const express = require('express');
const router = express.Router();
const productsController = require('./products.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');

// Note: /low-stock must come before /:id so it does not collide with route parameter
router.get('/low-stock', productsController.getLowStock);
router.get('/', productsController.getAll);
router.get('/:id', productsController.getById);
router.post('/', authenticateToken, productsController.create);
router.put('/:id', authenticateToken, productsController.update);
router.delete('/:id', authenticateToken, productsController.delete);

module.exports = router;
