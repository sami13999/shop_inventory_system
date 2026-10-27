const { pool } = require('../../config/db');

class SuppliersService {
  async getAll(search) {
    let query = `
      SELECT 
        s.supplier_id,
        s.supplier_name,
        s.phone,
        s.address,
        s.createdAt,
        s.updatedAt,
        COUNT(p.purchase_id) AS total_purchases,
        COALESCE(SUM(p.total_amount), 0) AS total_procured_amount
      FROM suppliers s
      LEFT JOIN purchases p ON s.supplier_id = p.supplier_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (s.supplier_name LIKE ? OR s.phone LIKE ? OR s.address LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += `
      GROUP BY s.supplier_id, s.supplier_name, s.phone, s.address, s.createdAt, s.updatedAt
      ORDER BY s.supplier_name ASC
    `;

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(`
      SELECT 
        s.supplier_id,
        s.supplier_name,
        s.phone,
        s.address,
        s.createdAt,
        s.updatedAt,
        COUNT(p.purchase_id) AS total_purchases,
        COALESCE(SUM(p.total_amount), 0) AS total_procured_amount
      FROM suppliers s
      LEFT JOIN purchases p ON s.supplier_id = p.supplier_id
      WHERE s.supplier_id = ?
      GROUP BY s.supplier_id, s.supplier_name, s.phone, s.address, s.createdAt, s.updatedAt
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      const err = new Error('Supplier not found');
      err.statusCode = 404;
      throw err;
    }
    return rows[0];
  }

  async getSupplierPurchases(id) {
    await this.getById(id);
    const [rows] = await pool.query(`
      SELECT 
        p.purchase_id,
        p.supplier_id,
        p.purchase_date,
        p.total_amount,
        p.paid_amount,
        COUNT(pi.purchase_item_id) AS item_count
      FROM purchases p
      LEFT JOIN purchase_items pi ON p.purchase_id = pi.purchase_id
      WHERE p.supplier_id = ?
      GROUP BY p.purchase_id, p.supplier_id, p.purchase_date, p.total_amount, p.paid_amount
      ORDER BY p.purchase_date DESC
    `, [id]);
    return rows;
  }

  async create(data) {
    const { supplier_name, phone, address } = data;
    if (!supplier_name || !supplier_name.trim()) {
      const err = new Error('Supplier name is required');
      err.statusCode = 400;
      throw err;
    }

    const [result] = await pool.query(`
      INSERT INTO suppliers (supplier_name, phone, address)
      VALUES (?, ?, ?)
    `, [supplier_name.trim(), phone ? phone.trim() : null, address ? address.trim() : null]);

    return this.getById(result.insertId);
  }

  async update(id, data) {
    await this.getById(id);
    const { supplier_name, phone, address } = data;

    if (!supplier_name || !supplier_name.trim()) {
      const err = new Error('Supplier name is required');
      err.statusCode = 400;
      throw err;
    }

    await pool.query(`
      UPDATE suppliers 
      SET supplier_name = ?, phone = ?, address = ?
      WHERE supplier_id = ?
    `, [supplier_name.trim(), phone ? phone.trim() : null, address ? address.trim() : null, id]);

    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);

    // Check if supplier has purchases
    const [purchases] = await pool.query(
      'SELECT purchase_id FROM purchases WHERE supplier_id = ? LIMIT 1',
      [id]
    );

    if (purchases.length > 0) {
      const err = new Error('Cannot delete supplier: supplier has recorded purchase orders.');
      err.statusCode = 400;
      throw err;
    }

    await pool.query('DELETE FROM suppliers WHERE supplier_id = ?', [id]);
    return { message: 'Supplier deleted successfully' };
  }
}

module.exports = new SuppliersService();
