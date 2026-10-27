const dashboardService = require('./dashboard.service');

class DashboardController {
  async getMetrics(req, res, next) {
    try {
      const data = await dashboardService.getMetrics();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DashboardController();
