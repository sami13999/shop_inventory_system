const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// Load environment variables from the project root .env
const candidateEnvPaths = [
  path.resolve(__dirname, '../../../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), 'shop_inventory_system', '.env')
];

const envPath = candidateEnvPaths.find(p => fs.existsSync(p));
if (envPath) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'shop_inventory',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  decimalNumbers: true
});

// Test connection helper
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT DATABASE() AS current_db');
    connection.release();
    console.log(`[Database] Connected successfully to MySQL database: "${rows[0]?.current_db}"`);
    return true;
  } catch (error) {
    console.error('[Database Error] Failed to connect to MySQL:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testDbConnection
};
