const { pool } = require('../../config/db');

class BillsService {
  async getAll(filters = {}) {
    let query = `
      SELECT 
        b.bill_id,
        b.customer_id,
        COALESCE(c.name, 'Walk-in Customer') AS customer_name,
        c.phone AS customer_phone,
        b.bill_date,
        b.total_amount,
        b.discount,
        b.paid_amount,
        (b.total_amount - b.paid_amount) AS balance_due,
        b.payment_status,
        b.created_by,
        u.user_name AS cashier_name,
        COUNT(bi.bill_item_id) AS total_items,
        b.updatedAt
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.customer_id
      LEFT JOIN users u ON b.created_by = u.user_id
      LEFT JOIN bill_items bi ON b.bill_id = bi.bill_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      query += ` AND (b.bill_id = ? OR c.name LIKE ? OR c.phone LIKE ?)`;
      params.push(filters.search, `%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.payment_status) {
      query += ` AND b.payment_status = ?`;
      params.push(filters.payment_status);
    }

    if (filters.customer_id) {
      query += ` AND b.customer_id = ?`;
      params.push(filters.customer_id);
    }

    query += `
      GROUP BY b.bill_id, b.customer_id, c.name, c.phone, b.bill_date, b.total_amount, b.discount, b.paid_amount, b.payment_status, b.created_by, u.user_name, b.updatedAt
      ORDER BY b.bill_date DESC
    `;

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getById(id) {
    const [billRows] = await pool.query(`
      SELECT 
        b.bill_id,
        b.customer_id,
        COALESCE(c.name, 'Walk-in Customer') AS customer_name,
        c.phone AS customer_phone,
        c.address AS customer_address,
        b.bill_date,
        b.total_amount,
        b.discount,
        b.paid_amount,
        (b.total_amount - b.paid_amount) AS balance_due,
        b.payment_status,
        b.created_by,
        u.user_name AS cashier_name,
        b.updatedAt
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.customer_id
      LEFT JOIN users u ON b.created_by = u.user_id
      WHERE b.bill_id = ?
      LIMIT 1
    `, [id]);

    if (billRows.length === 0) {
      const err = new Error('Bill not found');
      err.statusCode = 404;
      throw err;
    }

    const bill = billRows[0];

    const [itemRows] = await pool.query(`
      SELECT 
        bi.bill_item_id,
        bi.bill_id,
        bi.product_id,
        p.name AS product_name,
        c.category_name,
        bi.quantity,
        bi.unit_price,
        bi.line_total,
        bi.createdAt
      FROM bill_items bi
      JOIN products p ON bi.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE bi.bill_id = ?
      ORDER BY bi.bill_item_id ASC
    `, [id]);

    return {
      ...bill,
      items: itemRows
    };
  }

  async createBill(data, userId) {
    const { customer_id, items, discount = 0, paid_amount = 0 } = data;

    if (!items || !Array.isArray(items) || items.length === 0) {
      const err = new Error('Bill must contain at least one product item');
      err.statusCode = 400;
      throw err;
    }

    // ACID Transaction
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let calculatedSubtotal = 0;
      const verifiedItems = [];

      // Validate products and check inventory stock
      for (const item of items) {
        const productId = item.product_id;
        const qty = parseInt(item.quantity, 10);

        if (!productId || isNaN(qty) || qty <= 0) {
          const err = new Error('Each item must have a valid product_id and a quantity > 0');
          err.statusCode = 400;
          throw err;
        }

        const [prodRows] = await connection.query(
          'SELECT product_id, name, selling_price, stock_quantity FROM products WHERE product_id = ? FOR UPDATE',
          [productId]
        );

        if (prodRows.length === 0) {
          const err = new Error(`Product ID ${productId} does not exist`);
          err.statusCode = 400;
          throw err;
        }

        const product = prodRows[0];

        if (product.stock_quantity < qty) {
          const err = new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${qty}`
          );
          err.statusCode = 400;
          throw err;
        }

        const unitPrice = item.unit_price !== undefined ? parseFloat(item.unit_price) : parseFloat(product.selling_price);
        const lineTotal = parseFloat((unitPrice * qty).toFixed(2));
        calculatedSubtotal += lineTotal;

        verifiedItems.push({
          product_id: productId,
          quantity: qty,
          unit_price: unitPrice,
          line_total: lineTotal
        });
      }

      const numDiscount = Math.max(0, parseFloat(discount) || 0);
      const totalAmount = Math.max(0, parseFloat((calculatedSubtotal - numDiscount).toFixed(2)));
      const numPaid = Math.max(0, parseFloat(paid_amount) || 0);

      let paymentStatus = 'unpaid';
      if (numPaid >= totalAmount) {
        paymentStatus = 'paid';
      } else if (numPaid > 0) {
        paymentStatus = 'partial';
      }

      // 1. Insert into bills
      const [billResult] = await connection.query(`
        INSERT INTO bills (
          customer_id,
          bill_date,
          total_amount,
          discount,
          paid_amount,
          payment_status,
          created_by
        ) VALUES (?, NOW(), ?, ?, ?, ?, ?)
      `, [
        customer_id ? parseInt(customer_id, 10) : null,
        totalAmount,
        numDiscount,
        numPaid,
        paymentStatus,
        userId || null
      ]);

      const billId = billResult.insertId;

      // 2. Insert into bill_items
      // Note: Database trigger 'after_bill_item_insert' automatically updates products.stock_quantity!
      for (const item of verifiedItems) {
        await connection.query(`
          INSERT INTO bill_items (bill_id, product_id, quantity, unit_price, line_total)
          VALUES (?, ?, ?, ?, ?)
        `, [
          billId,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.line_total
        ]);
      }

      // 3. Commit ACID transaction
      await connection.commit();

      // Retrieve full created bill
      return await this.getById(billId);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  async updatePayment(id, paidAmount) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [rows] = await connection.query(
        'SELECT bill_id, total_amount, paid_amount FROM bills WHERE bill_id = ? FOR UPDATE',
        [id]
      );

      if (rows.length === 0) {
        const err = new Error('Bill not found');
        err.statusCode = 404;
        throw err;
      }

      const bill = rows[0];
      const newPaid = parseFloat(paidAmount);
      if (isNaN(newPaid) || newPaid < 0) {
        const err = new Error('Valid paid amount is required');
        err.statusCode = 400;
        throw err;
      }

      let paymentStatus = 'unpaid';
      if (newPaid >= bill.total_amount) {
        paymentStatus = 'paid';
      } else if (newPaid > 0) {
        paymentStatus = 'partial';
      }

      await connection.query(`
        UPDATE bills 
        SET paid_amount = ?, payment_status = ?
        WHERE bill_id = ?
      `, [newPaid, paymentStatus, id]);

      await connection.commit();
      return await this.getById(id);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = new BillsService();
