const { pool } = require('../../config/db');

class CategoriesService {
  async getAll() {
    const [rows] = await pool.query(`
      SELECT 
        c.category_id,
        c.category_name,
        c.createdAt,
        c.updatedAt,
        COUNT(p.product_id) AS product_count
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id
      GROUP BY c.category_id, c.category_name, c.createdAt, c.updatedAt
      ORDER BY c.category_name ASC
    `);
    return rows;
  }

  async getById(id) {
    const [rows] = await pool.query(
      'SELECT category_id, category_name, createdAt, updatedAt FROM categories WHERE category_id = ? LIMIT 1',
      [id]
    );
    if (rows.length === 0) {
      const err = new Error('Category not found');
      err.statusCode = 404;
      throw err;
    }
    return rows[0];
  }

  async create(data) {
    const { category_name } = data;
    if (!category_name || !category_name.trim()) {
      const err = new Error('Category name is required');
      err.statusCode = 400;
      throw err;
    }

    const trimmed = category_name.trim();

    // Check duplicate
    const [existing] = await pool.query(
      'SELECT category_id FROM categories WHERE category_name = ? LIMIT 1',
      [trimmed]
    );

    if (existing.length > 0) {
      const err = new Error(`Category "${trimmed}" already exists`);
      err.statusCode = 409;
      throw err;
    }

    const [result] = await pool.query(
      'INSERT INTO categories (category_name) VALUES (?)',
      [trimmed]
    );

    return this.getById(result.insertId);
  }

  async update(id, data) {
    const { category_name } = data;
    if (!category_name || !category_name.trim()) {
      const err = new Error('Category name is required');
      err.statusCode = 400;
      throw err;
    }

    const trimmed = category_name.trim();
    await this.getById(id);

    // Check duplicate with another ID
    const [existing] = await pool.query(
      'SELECT category_id FROM categories WHERE category_name = ? AND category_id != ? LIMIT 1',
      [trimmed, id]
    );

    if (existing.length > 0) {
      const err = new Error(`Category "${trimmed}" already exists`);
      err.statusCode = 409;
      throw err;
    }

    await pool.query(
      'UPDATE categories SET category_name = ? WHERE category_id = ?',
      [trimmed, id]
    );

    return this.getById(id);
  }

  async delete(id) {
    await this.getById(id);

    // Check if products exist in category
    const [products] = await pool.query(
      'SELECT product_id FROM products WHERE category_id = ? LIMIT 1',
      [id]
    );

    if (products.length > 0) {
      const err = new Error('Cannot delete category: products are assigned to this category. Reassign or delete products first.');
      err.statusCode = 400;
      throw err;
    }

    await pool.query('DELETE FROM categories WHERE category_id = ?', [id]);
    return { message: 'Category deleted successfully' };
  }
}

module.exports = new CategoriesService();
