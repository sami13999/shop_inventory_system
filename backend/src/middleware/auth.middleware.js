const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'production_pos_jwt_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      user_id: decoded.user_id,
      user_name: decoded.user_name
    };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired authentication token.'
    });
  }
}

// Optional auth helper (for public or semi-protected routes where req.user might be optional)
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        user_id: decoded.user_id,
        user_name: decoded.user_name
      };
    } catch {
      // Ignore token failure for optional routes
    }
  }
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth
};
