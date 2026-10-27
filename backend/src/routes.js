const express = require('express');
const router = express.Router();

const authRoutes = require('./modules/auth/auth.routes');
const categoriesRoutes = require('./modules/categories/categories.routes');
const productsRoutes = require('./modules/products/products.routes');
const customersRoutes = require('./modules/customers/customers.routes');
const suppliersRoutes = require('./modules/suppliers/suppliers.routes');
const billsRoutes = require('./modules/bills/bills.routes');
const purchasesRoutes = require('./modules/purchases/purchases.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Shop Inventory & POS API'
  });
});

// Feature Sliced Routes
router.use('/auth', authRoutes);
router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);
router.use('/customers', customersRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/bills', billsRoutes);
router.use('/purchases', purchasesRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
