const express = require('express');
const router = express.Router();
const categoriesController = require('./categories.controller');
const { authenticateToken } = require('../../middleware/auth.middleware');

router.get('/', categoriesController.getAll);
router.get('/:id', categoriesController.getById);
router.post('/', authenticateToken, categoriesController.create);
router.put('/:id', authenticateToken, categoriesController.update);
router.delete('/:id', authenticateToken, categoriesController.delete);

module.exports = router;
