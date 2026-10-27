const authService = require('./auth.service');

class AuthController {
  async register(req, res, next) {
    try {
      const { user_name, password } = req.body;
      const data = await authService.register(user_name, password);
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { user_name, password } = req.body;
      const data = await authService.login(user_name, password);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data
      });
    } catch (err) {
      next(err);
    }
  }

  async getMe(req, res, next) {
    try {
      const user = await authService.getMe(req.user.user_id);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (err) {
      next(err);
    }
  }

  async forgotPassword(req, res, next) {
    try {
      const { user_name, new_password } = req.body;
      const result = await authService.resetPassword(user_name, new_password);
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
