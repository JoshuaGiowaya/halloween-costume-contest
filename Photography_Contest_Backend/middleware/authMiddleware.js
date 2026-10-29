const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header or cookies
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  // If no token found, return unauthorized error
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Decode token to get user/admin ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try to find the user or admin based on the decoded ID
    let user = await User.findById(decoded.id).select('-password');
    let isAdmin = false;
    if (!user) {
      user = await Admin.findById(decoded.id).select('-password');
      isAdmin = !!user;
    }

    // If no user or admin found or token doesn't match, return unauthorized error
    if (!user || user.token !== token) {
      return res.status(401).json({ message: 'Not authorized, token invalid' });
    }

    // Attach the user/admin to the request object
    req.user = user;
    // protect() accepts a contestant's token just as readily as an admin's, so
    // which collection it came from is what the admin-only routes go on.
    req.isAdmin = isAdmin;
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// Runs after protect(). Starting and stopping a contest or its voting is the
// admin's call, and a logged-in contestant holds a token that protect() alone
// is happy with.
const requireAdmin = (req, res, next) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: 'Not authorized, admin only' });
  }
  next();
};

module.exports = { protect, requireAdmin };
