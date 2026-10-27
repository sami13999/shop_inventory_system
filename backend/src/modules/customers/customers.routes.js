const express = require('express');
const router = express.Router();
const customersController = require('./customers.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');

// Note: /khata must come before /:id so it is not treated as a customer_id
router.get('/khata', customersController.getKhata);
router.get('/', customersController.getAll);
router.get('/:id', customersController.getById);
router.get('/:id/bills', customersController.getCustomerBills);
router.post('/', authenticateToken, customersController.create);
router.put('/:id', authenticateToken, customersController.update);
router.delete('/:id', authenticateToken, customersController.delete);

module.exports = router;
