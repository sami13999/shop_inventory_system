const express = require('express');
const router = express.Router();
const purchasesController = require('./purchases.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');

router.get('/', purchasesController.getAll);
router.get('/:id', purchasesController.getById);
router.post('/', authenticateToken, purchasesController.create);

module.exports = router;
