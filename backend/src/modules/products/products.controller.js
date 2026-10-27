const productsService = require('./products.service');

class ProductsController {
  async getAll(req, res, next) {
    try {
      const data = await productsService.getAll(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getLowStock(req, res, next) {
    try {
      const data = await productsService.getLowStock();
      res.status(200).json({ success: true, count: data.length, data });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await productsService.getById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await productsService.create(req.body);
      res.status(201).json({ success: true, message: 'Product created successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = await productsService.update(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Product updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await productsService.delete(req.params.id);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductsController();
