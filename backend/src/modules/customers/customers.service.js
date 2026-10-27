const { pool } = require('../../config/db');

class CustomersService {
  async getAll(search) {
    let query = `
      SELECT 
        c.customer_id,
        c.name,
        c.phone,
        c.address,
        COUNT(b.bill_id) AS total_bills,
        COALESCE(SUM(b.total_amount), 0) AS total_spent,
        COALESCE(SUM(b.paid_amount), 0) AS total_paid,
        (COALESCE(SUM(b.total_amount), 0) - COALESCE(SUM(b.paid_amount), 0)) AS remaining_balance
      FROM customers c
      LEFT JOIN bills b ON c.customer_id = b.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.address LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += `
      GROUP BY c.customer_id, c.name, c.phone, c.address
      ORDER BY c.name ASC
    `;

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getKhataLedger(filters = {}) {
    // Strict Requirement: SQL query joining customers with bills to compute total bills,
    // total spent, total paid, and remaining_balance. NO SQL views used.
    let query = `
      SELECT 
        c.customer_id,
        c.name AS customer_name,
        c.phone,
        c.address,
        COUNT(b.bill_id) AS total_bills,
        COALESCE(SUM(b.total_amount), 0) AS total_purchase_amount,
        COALESCE(SUM(b.paid_amount), 0) AS total_paid_amount,
        (COALESCE(SUM(b.total_amount), 0) - COALESCE(SUM(b.paid_amount), 0)) AS remaining_balance
      FROM customers c
      LEFT JOIN bills b ON c.customer_id = b.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      query += ` AND (c.name LIKE ? OR c.phone LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += `
      GROUP BY c.customer_id, c.name, c.phone, c.address
    `;

    if (filters.due_only === 'true' || filters.due_only === true) {
      query += ` HAVING remaining_balance > 0`;
    }

    query += ` ORDER BY remaining_balance DESC, c.name ASC`;

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(`
      SELECT 
        c.customer_id,
        c.name,
        c.phone,
        c.address,
        COUNT(b.bill_id) AS total_bills,
        COALESCE(SUM(b.total_amount), 0) AS total_spent,
        COALESCE(SUM(b.paid_amount), 0) AS total_paid,
        (COALESCE(SUM(b.total_amount), 0) - COALESCE(SUM(b.paid_amount), 0)) AS remaining_balance
      FROM customers c
      LEFT JOIN bills b ON c.customer_id = b.customer_id
      WHERE c.customer_id = ?
      GROUP BY c.customer_id, c.name, c.phone, c.address
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      const err = new Error('Customer not found');
      err.statusCode = 404;
      throw err;
    }
    return rows[0];
  }

  async getCustomerBills(id) {
    await this.getById(id);
    const [rows] = await pool.query(`
      SELECT 
        b.bill_id,
        b.customer_id,
        b.bill_date,
        b.total_amount,
        b.discount,
        b.paid_amount,
        (b.total_amount - b.paid_amount) AS balance_due,
        b.payment_status,
        b.created_by,
        u.user_name AS cashier_name,
        COUNT(bi.bill_item_id) AS total_items
      FROM bills b
      LEFT JOIN users u ON b.created_by = u.user_id
      LEFT JOIN bill_items bi ON b.bill_id = bi.bill_id
      WHERE b.customer_id = ?
      GROUP BY b.bill_id, b.customer_id, b.bill_date, b.total_amount, b.discount, b.paid_amount, b.payment_status, b.created_by, u.user_name
      ORDER BY b.bill_date DESC
    `, [id]);
    return rows;
  }

  async create(data) {
    const { name, phone, address } = data;
    if (!name || !name.trim()) {
      const err = new Error('Customer name is required');
      err.statusCode = 400;
      throw err;
    }

    const [result] = await pool.query(`
      INSERT INTO customers (name, phone, address)
      VALUES (?, ?, ?)
    `, [name.trim(), phone ? phone.trim() : null, address ? address.trim() : null]);

    return this.getById(result.insertId);
  }

  async update(id, data) {
    await this.getById(id);
    const { name, phone, address } = data;

    if (!name || !name.trim()) {
      const err = new Error('Customer name is required');
      err.statusCode = 400;
      throw err;
    }

    await pool.query(`
      UPDATE customers 
      SET name = ?, phone = ?, address = ?
      WHERE customer_id = ?
    `, [name.trim(), phone ? phone.trim() : null, address ? address.trim() : null, id]);

    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);

    // Check if customer has bills
    const [bills] = await pool.query(
      'SELECT bill_id FROM bills WHERE customer_id = ? LIMIT 1',
      [id]
    );

    if (bills.length > 0) {
      const err = new Error('Cannot delete customer: customer has existing sales bills / ledger history.');
      err.statusCode = 400;
      throw err;
    }

    await pool.query('DELETE FROM customers WHERE customer_id = ?', [id]);
    return { message: 'Customer deleted successfully' };
  }
}

module.exports = new CustomersService();
