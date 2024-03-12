const jwt = require('jsonwebtoken');
const User = require('../models/user');

const verifyToken = async (req, res, next) => {
  try {
    // Check if authorization header is present
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: 'Authorization token is missing' });
    }

    // Verify the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid authorization token' });
    }

    // Attach user ID to request object for further use
    req.userId = userId;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Invalid authorization token' });
  }
};

module.exports = verifyToken;
