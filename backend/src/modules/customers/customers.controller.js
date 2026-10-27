const customersService = require('./customers.service');

class CustomersController {
  async getAll(req, res, next) {
    try {
      const data = await customersService.getAll(req.query.search);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getKhata(req, res, next) {
    try {
      const data = await customersService.getKhataLedger(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await customersService.getById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getCustomerBills(req, res, next) {
    try {
      const data = await customersService.getCustomerBills(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await customersService.create(req.body);
      res.status(201).json({ success: true, message: 'Customer added successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = await customersService.update(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Customer updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await customersService.delete(req.params.id);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CustomersController();
