const purchasesService = require('./purchases.service');

class PurchasesController {
  async getAll(req, res, next) {
    try {
      const data = await purchasesService.getAll(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await purchasesService.getById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await purchasesService.createPurchase(req.body);
      res.status(201).json({
        success: true,
        message: 'Stock purchase recorded and inventory updated successfully',
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new PurchasesController();
