import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    req.user = { userId: user._id, email: user.email, isAdmin: user.isAdmin };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const adminAuth = async (req, res, next) => {
  auth(req, res, (err) => {
    if (err) return res.status(401).json({ message: 'Authentication failed.' });
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  });
};