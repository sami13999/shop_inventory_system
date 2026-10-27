const billsService = require('./bills.service');

class BillsController {
  async getAll(req, res, next) {
    try {
      const data = await billsService.getAll(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await billsService.getById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const userId = req.user?.user_id;
      const data = await billsService.createBill(req.body, userId);
      res.status(201).json({
        success: true,
        message: 'Bill created and stock updated successfully',
        data
      });
    } catch (err) {
      next(err);
    }
  }

  async updatePayment(req, res, next) {
    try {
      const { paid_amount } = req.body;
      const data = await billsService.updatePayment(req.params.id, paid_amount);
      res.status(200).json({
        success: true,
        message: 'Payment updated successfully',
        data
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BillsController();
