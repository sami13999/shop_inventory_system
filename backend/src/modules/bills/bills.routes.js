const express = require('express');
const router = express.Router();
const billsController = require('./bills.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');

router.get('/', billsController.getAll);
router.get('/:id', billsController.getById);
router.post('/', authenticateToken, billsController.create);
router.patch('/:id/payment', authenticateToken, billsController.updatePayment);

module.exports = router;
