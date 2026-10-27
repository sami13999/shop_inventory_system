const suppliersService = require('./suppliers.service');

class SuppliersController {
  async getAll(req, res, next) {
    try {
      const data = await suppliersService.getAll(req.query.search);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await suppliersService.getById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getSupplierPurchases(req, res, next) {
    try {
      const data = await suppliersService.getSupplierPurchases(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await suppliersService.create(req.body);
      res.status(201).json({ success: true, message: 'Supplier added successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = await suppliersService.update(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Supplier updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await suppliersService.delete(req.params.id);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SuppliersController();
