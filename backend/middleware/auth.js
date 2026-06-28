const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../config/app');

const auth = async (req, res, next) => {
  let token = null;

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.headers.token) {
    token = req.headers.token;
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
  }

  if (!token) {
    return res.json({ code: -1, msg: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.json({ code: -1, msg: 'User not found' });
    }
    next();
  } catch (error) {
    return res.json({ code: -1, msg: 'Token expired or invalid' });
  }
};

const adminAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user && req.user.role === 'admin') {
      next();
    } else {
      return res.json({ code: -2, msg: 'Admin access required' });
    }
  });
};

const sellerAuth = (req, res, next) => {
  auth(req, res, () => {
    if (req.user && (req.user.role === 'seller' || req.user.role === 'admin')) {
      next();
    } else {
      return res.json({ code: -2, msg: 'Seller access required' });
    }
  });
};

module.exports = { auth, adminAuth, sellerAuth };
