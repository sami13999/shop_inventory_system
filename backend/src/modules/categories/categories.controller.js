const categoriesService = require('./categories.service');

class CategoriesController {
  async getAll(req, res, next) {
    try {
      const data = await categoriesService.getAll();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await categoriesService.getById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await categoriesService.create(req.body);
      res.status(201).json({ success: true, message: 'Category created successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = await categoriesService.update(req.params.id, req.body);
      res.status(200).json({ success: true, message: 'Category updated successfully', data });
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await categoriesService.delete(req.params.id);
      res.status(200).json({ success: true, message: result.message });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CategoriesController();
