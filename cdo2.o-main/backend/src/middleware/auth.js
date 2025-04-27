const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Add user from payload
    req.user = {
      userId: decoded.userId,
      role: decoded.role // Include role from token
    };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
}; 