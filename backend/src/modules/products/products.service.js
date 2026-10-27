const { pool } = require('../../config/db');

class ProductsService {
  async getAll(filters = {}) {
    let query = `
      SELECT 
        p.product_id,
        p.name,
        p.category_id,
        c.category_name,
        p.purchase_price,
        p.selling_price,
        p.stock_quantity,
        p.createdAt,
        (p.selling_price - p.purchase_price) AS profit_margin,
        ROUND(((p.selling_price - p.purchase_price) / NULLIF(p.purchase_price, 0)) * 100, 2) AS profit_percentage
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE 1=1
    `;
    const params = [];

    if (filters.search) {
      query += ` AND (p.name LIKE ? OR c.category_name LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    if (filters.category_id) {
      query += ` AND p.category_id = ?`;
      params.push(filters.category_id);
    }

    if (filters.low_stock === 'true' || filters.low_stock === true) {
      query += ` AND p.stock_quantity <= 10`;
    }

    query += ` ORDER BY p.name ASC`;

    const [rows] = await pool.query(query, params);
    return rows;
  }

  async getLowStock() {
    // Strict requirement: SQL query selecting products joined with categories where stock_quantity <= 10
    // No SQL views used.
    const query = `
      SELECT 
        p.product_id,
        p.name AS product_name,
        p.name,
        p.category_id,
        c.category_name,
        p.purchase_price,
        p.selling_price,
        p.stock_quantity,
        p.createdAt
      FROM products p
      JOIN categories c ON p.category_id = c.category_id
      WHERE p.stock_quantity <= 10
      ORDER BY p.stock_quantity ASC, p.name ASC
    `;
    const [rows] = await pool.query(query);
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(`
      SELECT 
        p.product_id,
        p.name,
        p.category_id,
        c.category_name,
        p.purchase_price,
        p.selling_price,
        p.stock_quantity,
        p.createdAt
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.category_id
      WHERE p.product_id = ?
      LIMIT 1
    `, [id]);

    if (rows.length === 0) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }
    return rows[0];
  }

  async create(data) {
    const { name, category_id, purchase_price, selling_price, stock_quantity } = data;

    if (!name || !name.trim()) {
      const err = new Error('Product name is required');
      err.statusCode = 400;
      throw err;
    }

    if (!category_id) {
      const err = new Error('Category is required');
      err.statusCode = 400;
      throw err;
    }

    // Verify category exists
    const [cats] = await pool.query(
      'SELECT category_id FROM categories WHERE category_id = ? LIMIT 1',
      [category_id]
    );

    if (cats.length === 0) {
      const err = new Error('Specified category does not exist');
      err.statusCode = 400;
      throw err;
    }

    const pPrice = parseFloat(purchase_price) || 0.00;
    const sPrice = parseFloat(selling_price) || 0.00;
    const stock = parseInt(stock_quantity, 10) || 0;

    const [result] = await pool.query(`
      INSERT INTO products (name, category_id, purchase_price, selling_price, stock_quantity)
      VALUES (?, ?, ?, ?, ?)
    `, [name.trim(), category_id, pPrice, sPrice, stock]);

    return this.getById(result.insertId);
  }

  async update(id, data) {
    await this.getById(id);
    const { name, category_id, purchase_price, selling_price, stock_quantity } = data;

    if (!name || !name.trim()) {
      const err = new Error('Product name is required');
      err.statusCode = 400;
      throw err;
    }

    if (category_id) {
      const [cats] = await pool.query(
        'SELECT category_id FROM categories WHERE category_id = ? LIMIT 1',
        [category_id]
      );
      if (cats.length === 0) {
        const err = new Error('Specified category does not exist');
        err.statusCode = 400;
        throw err;
      }
    }

    const pPrice = parseFloat(purchase_price) || 0.00;
    const sPrice = parseFloat(selling_price) || 0.00;
    const stock = parseInt(stock_quantity, 10) || 0;

    await pool.query(`
      UPDATE products 
      SET name = ?, category_id = ?, purchase_price = ?, selling_price = ?, stock_quantity = ?
      WHERE product_id = ?
    `, [name.trim(), category_id, pPrice, sPrice, stock, id]);

    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);

    // Check if product is referenced in bill_items or purchase_items
    const [bills] = await pool.query(
      'SELECT bill_item_id FROM bill_items WHERE product_id = ? LIMIT 1',
      [id]
    );
    if (bills.length > 0) {
      const err = new Error('Cannot delete product: it is associated with existing bill sales records.');
      err.statusCode = 400;
      throw err;
    }

    const [purchases] = await pool.query(
      'SELECT purchase_item_id FROM purchase_items WHERE product_id = ? LIMIT 1',
      [id]
    );
    if (purchases.length > 0) {
      const err = new Error('Cannot delete product: it is associated with existing stock purchase records.');
      err.statusCode = 400;
      throw err;
    }

    await pool.query('DELETE FROM products WHERE product_id = ?', [id]);
    return { message: 'Product deleted successfully' };
  }
}

module.exports = new ProductsService();
