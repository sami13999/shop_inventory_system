const express = require('express');
const router = express.Router();
const suppliersController = require('./suppliers.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');

router.get('/', suppliersController.getAll);
router.get('/:id', suppliersController.getById);
router.get('/:id/purchases', suppliersController.getSupplierPurchases);
router.post('/', authenticateToken, suppliersController.create);
router.put('/:id', authenticateToken, suppliersController.update);
router.delete('/:id', authenticateToken, suppliersController.delete);

module.exports = router;
