const { pool } = require('../../config/db');

class PurchasesService {
  async getAll(filters = {}) {
    let query = `
      SELECT 
        p.purchase_id,
        p.supplier_id,
        s.supplier_name,
        s.phone AS supplier_phone,
        p.purchase_date,
        p.total_amount,
        p.paid_amount,
        (p.total_amount - p.paid_amount) AS balance_due,
        COUNT(pi.purchase_item_id) AS total_items,
        COALESCE(SUM(pi.quantity), 0) AS total_quantity
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.supplier_id
      LEFT JOIN purchase_items pi ON p.purchase_id = pi.purchase_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      query += ` AND (p.purchase_id = ? OR s.supplier_name LIKE ?)`;
      params.push(filters.search, `%${filters.search}%`);
    }

    if (filters.supplier_id) {
      query += ` AND p.supplier_id = ?`;
      params.push(filters.supplier_id);
    }

    query += `
      GROUP BY p.purchase_id, p.supplier_id, s.supplier_name, s.phone, p.purchase_date, p.total_amount, p.paid_amount
      ORDER BY p.purchase_date DESC
    `;

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getById(id) {
    const [purchaseRows] = await pool.query(`
      SELECT 
        p.purchase_id,
        p.supplier_id,
        s.supplier_name,
        s.phone AS supplier_phone,
        s.address AS supplier_address,
        p.purchase_date,
        p.total_amount,
        p.paid_amount,
        (p.total_amount - p.paid_amount) AS balance_due
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.supplier_id
      WHERE p.purchase_id = ?
      LIMIT 1
    `, [id]);

    if (purchaseRows.length === 0) {
      const err = new Error('Purchase record not found');
      err.statusCode = 404;
      throw err;
    }

    const purchase = purchaseRows[0];

    const [itemRows] = await pool.query(`
      SELECT 
        pi.purchase_item_id,
        pi.purchase_id,
        pi.product_id,
        p.name AS product_name,
        c.category_name,
        pi.quantity,
        pi.unit_cost,
        (pi.quantity * pi.unit_cost) AS line_total
      FROM purchase_items pi
      JOIN products p ON pi.product_id = p.product_id
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE pi.purchase_id = ?
      ORDER BY pi.purchase_item_id ASC
    `, [id]);

    return {
      ...purchase,
      items: itemRows
    };
  }

  async createPurchase(data) {
    const { supplier_id, items, paid_amount = 0 } = data;

    if (!supplier_id) {
      const err = new Error('Supplier is required');
      err.statusCode = 400;
      throw err;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      const err = new Error('Purchase order must contain at least one product item');
      err.statusCode = 400;
      throw err;
    }

    // ACID Transaction
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verify supplier exists
      const [supplierRows] = await connection.query(
        'SELECT supplier_id FROM suppliers WHERE supplier_id = ? LIMIT 1',
        [supplier_id]
      );

      if (supplierRows.length === 0) {
        const err = new Error('Selected supplier does not exist');
        err.statusCode = 400;
        throw err;
      }

      let calculatedTotal = 0;
      const verifiedItems = [];

      for (const item of items) {
        const productId = item.product_id;
        const qty = parseInt(item.quantity, 10);
        const unitCost = parseFloat(item.unit_cost);

        if (!productId || isNaN(qty) || qty <= 0 || isNaN(unitCost) || unitCost < 0) {
          const err = new Error('Each item must have a valid product_id, quantity > 0, and non-negative unit_cost');
          err.statusCode = 400;
          throw err;
        }

        const [prodRows] = await connection.query(
          'SELECT product_id, name, purchase_price FROM products WHERE product_id = ? LIMIT 1',
          [productId]
        );

        if (prodRows.length === 0) {
          const err = new Error(`Product ID ${productId} does not exist`);
          err.statusCode = 400;
          throw err;
        }

        const lineTotal = parseFloat((qty * unitCost).toFixed(2));
        calculatedTotal += lineTotal;

        verifiedItems.push({
          product_id: productId,
          quantity: qty,
          unit_cost: unitCost
        });
      }

      const totalAmount = parseFloat(calculatedTotal.toFixed(2));
      const numPaid = Math.max(0, parseFloat(paid_amount) || 0);

      // 1. Insert into purchases
      const [purchaseResult] = await connection.query(`
        INSERT INTO purchases (supplier_id, purchase_date, total_amount, paid_amount)
        VALUES (?, NOW(), ?, ?)
      `, [supplier_id, totalAmount, numPaid]);

      const purchaseId = purchaseResult.insertId;

      // 2. Insert into purchase_items
      // Note: Database trigger 'after_purchase_item_insert' automatically increments products.stock_quantity!
      for (const item of verifiedItems) {
        await connection.query(`
          INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost)
          VALUES (?, ?, ?, ?)
        `, [
          purchaseId,
          item.product_id,
          item.quantity,
          item.unit_cost
        ]);

        // Also update product's latest purchase_price in products table if desired
        await connection.query(`
          UPDATE products SET purchase_price = ? WHERE product_id = ?
        `, [item.unit_cost, item.product_id]);
      }

      // 3. Commit ACID transaction
      await connection.commit();

      return await this.getById(purchaseId);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

module.exports = new PurchasesService();
