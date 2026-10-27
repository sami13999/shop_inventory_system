const { pool } = require('../../config/db');

class DashboardService {
  async getMetrics() {
    // Pure SQL calculations - Strictly NO SQL VIEWS
    const [salesRows] = await pool.query(`
      SELECT 
        COUNT(bill_id) AS total_bills_count,
        COALESCE(SUM(total_amount), 0) AS total_sales_amount,
        COALESCE(SUM(paid_amount), 0) AS total_revenue_collected,
        (COALESCE(SUM(total_amount), 0) - COALESCE(SUM(paid_amount), 0)) AS outstanding_khata_balance
      FROM bills
    `);

    const [todaySalesRows] = await pool.query(`
      SELECT 
        COUNT(bill_id) AS today_bills_count,
        COALESCE(SUM(total_amount), 0) AS today_sales_amount,
        COALESCE(SUM(paid_amount), 0) AS today_revenue_collected
      FROM bills
      WHERE DATE(bill_date) = CURDATE()
    `);

    const [productRows] = await pool.query(`
      SELECT 
        COUNT(product_id) AS total_products,
        COALESCE(SUM(stock_quantity), 0) AS total_stock_units,
        COUNT(CASE WHEN stock_quantity > 10 THEN 1 END) AS healthy_stock_count,
        COUNT(CASE WHEN stock_quantity <= 10 AND stock_quantity > 0 THEN 1 END) AS low_stock_count,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) AS out_of_stock_count
      FROM products
    `);

    const [customerRows] = await pool.query('SELECT COUNT(customer_id) AS total_customers FROM customers');
    const [supplierRows] = await pool.query('SELECT COUNT(supplier_id) AS total_suppliers FROM suppliers');

    // Category-wise stock distribution
    const [categoryRows] = await pool.query(`
      SELECT 
        c.category_id,
        c.category_name,
        COUNT(p.product_id) AS product_count,
        COALESCE(SUM(p.stock_quantity), 0) AS total_stock
      FROM categories c
      LEFT JOIN products p ON c.category_id = p.category_id
      GROUP BY c.category_id, c.category_name
      ORDER BY total_stock DESC, c.category_name ASC
      LIMIT 6
    `);

    // 7-Day sales velocity
    const [weeklySalesRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(bill_date, '%Y-%m-%d') AS date_str,
        DATE_FORMAT(bill_date, '%a') AS day_name,
        COALESCE(SUM(total_amount), 0) AS daily_amount,
        COUNT(bill_id) AS order_count
      FROM bills
      WHERE bill_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE_FORMAT(bill_date, '%Y-%m-%d'), DATE_FORMAT(bill_date, '%a')
      ORDER BY date_str ASC
    `);

    // Generate continuous 7 days timeline
    const daysMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      daysMap[dateStr] = {
        date: dateStr,
        day: dayName,
        amount: 0,
        orders: 0
      };
    }

    weeklySalesRows.forEach(row => {
      if (daysMap[row.date_str]) {
        daysMap[row.date_str].amount = Number(row.daily_amount);
        daysMap[row.date_str].orders = Number(row.order_count);
      }
    });

    const weeklyVelocity = Object.values(daysMap);

    const [recentBills] = await pool.query(`
      SELECT 
        b.bill_id,
        COALESCE(c.name, 'Walk-in Customer') AS customer_name,
        b.bill_date,
        b.total_amount,
        b.paid_amount,
        b.payment_status
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.customer_id
      ORDER BY b.bill_date DESC
      LIMIT 6
    `);

    const [lowStockAlerts] = await pool.query(`
      SELECT 
        p.product_id,
        p.name AS product_name,
        c.category_name,
        p.stock_quantity,
        p.selling_price
      FROM products p
      JOIN categories c ON p.category_id = c.category_id
      WHERE p.stock_quantity <= 10
      ORDER BY p.stock_quantity ASC
      LIMIT 6
    `);

    const totalProds = Number(productRows[0].total_products);
    const healthyCount = Number(productRows[0].healthy_stock_count);
    const lowCount = Number(productRows[0].low_stock_count);
    const outCount = Number(productRows[0].out_of_stock_count);
    const healthScore = totalProds > 0 ? Math.round((healthyCount / totalProds) * 100) : 100;

    return {
      financials: {
        total_sales_amount: Number(salesRows[0].total_sales_amount),
        total_revenue_collected: Number(salesRows[0].total_revenue_collected),
        outstanding_khata_balance: Number(salesRows[0].outstanding_khata_balance),
        total_bills_count: Number(salesRows[0].total_bills_count),
        today_sales_amount: Number(todaySalesRows[0].today_sales_amount),
        today_revenue_collected: Number(todaySalesRows[0].today_revenue_collected),
        today_bills_count: Number(todaySalesRows[0].today_bills_count)
      },
      inventory: {
        total_products: totalProds,
        total_stock_units: Number(productRows[0].total_stock_units),
        healthy_stock_count: healthyCount,
        low_stock_count: lowCount,
        out_of_stock_count: outCount,
        health_score: healthScore
      },
      categories_distribution: categoryRows.map(c => ({
        id: c.category_id,
        name: c.category_name,
        product_count: Number(c.product_count),
        total_stock: Number(c.total_stock)
      })),
      weekly_velocity: weeklyVelocity,
      counts: {
        customers: Number(customerRows[0].total_customers),
        suppliers: Number(supplierRows[0].total_suppliers)
      },
      recent_bills: recentBills,
      low_stock_alerts: lowStockAlerts
    };
  }
}

module.exports = new DashboardService();
