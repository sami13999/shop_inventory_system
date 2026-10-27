const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'production_pos_jwt_secret_key_2026';

class AuthService {
  generateToken(user) {
    return jwt.sign(
      {
        user_id: user.user_id,
        user_name: user.user_name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  async register(userName, password) {
    if (!userName || !password) {
      const err = new Error('Username and password are required');
      err.statusCode = 400;
      throw err;
    }

    if (password.length < 6) {
      const err = new Error('Password must be at least 6 characters long');
      err.statusCode = 400;
      throw err;
    }

    // Check if user already exists
    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE user_name = ? LIMIT 1',
      [userName]
    );

    if (existing.length > 0) {
      const err = new Error(`Username "${userName}" is already taken`);
      err.statusCode = 409;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (user_name, password) VALUES (?, ?)',
      [userName, hashedPassword]
    );

    const newUser = {
      user_id: result.insertId,
      user_name: userName
    };

    const token = this.generateToken(newUser);

    return {
      user: newUser,
      token
    };
  }

  async login(userName, password) {
    if (!userName || !password) {
      const err = new Error('Username and password are required');
      err.statusCode = 400;
      throw err;
    }

    const [rows] = await pool.query(
      'SELECT user_id, user_name, password FROM users WHERE user_name = ? LIMIT 1',
      [userName]
    );

    if (rows.length === 0) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const userPayload = {
      user_id: user.user_id,
      user_name: user.user_name
    };

    const token = this.generateToken(userPayload);

    return {
      user: userPayload,
      token
    };
  }

  async getMe(userId) {
    const [rows] = await pool.query(
      'SELECT user_id, user_name, createdAt, updatedAt FROM users WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (rows.length === 0) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    return rows[0];
  }

  async resetPassword(userName, newPassword) {
    if (!userName || !newPassword) {
      const err = new Error('Username and new password are required');
      err.statusCode = 400;
      throw err;
    }

    if (newPassword.length < 6) {
      const err = new Error('New password must be at least 6 characters long');
      err.statusCode = 400;
      throw err;
    }

    const [rows] = await pool.query(
      'SELECT user_id FROM users WHERE user_name = ? LIMIT 1',
      [userName]
    );

    if (rows.length === 0) {
      const err = new Error(`User "${userName}" not found`);
      err.statusCode = 404;
      throw err;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = ? WHERE user_name = ?',
      [hashedPassword, userName]
    );

    return { message: 'Password reset successfully' };
  }

  async autoSeedAdminIfEmpty() {
    try {
      const [rows] = await pool.query('SELECT COUNT(*) AS count FROM users');
      if (rows[0].count === 0) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query(
          'INSERT INTO users (user_name, password) VALUES (?, ?)',
          ['admin', hashedPassword]
        );
        console.log('[Auth] Initial admin account seeded: username: "admin" | password: "admin123"');
      }
    } catch (err) {
      console.warn('[Auth Seed Warning] Could not check or seed admin user:', err.message);
    }
  }
}

module.exports = new AuthService();
