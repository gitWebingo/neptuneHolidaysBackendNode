import jwt from 'jsonwebtoken';
import AppError from '../utils/appError.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import serverConfig from '../config/server.js';
import { getUserSession } from '../utils/redisClient.js';
import logger from '../utils/logger.js';

const { jwtSecret } = serverConfig;

/**
 * Authenticate user middleware
 * Verifies JWT token and checks for valid session in Redis
 */
export const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in authorization header or cookies
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret);

    // Check if user still exists
    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }
    
    // Check if the user has an active session in Redis
    const userSession = await getUserSession(decoded.id);
    
    if (!userSession) {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    
    // Verify the token ID matches the active session
    if (decoded.tokenId !== userSession.tokenId) {
      return next(new AppError('Invalid session. Please log in again.', 401));
    }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return next(new AppError('Invalid token or authorization failed.', 401));
  }
};

/**
 * Restrict to specific user roles
 * @param {...string} roles - Allowed roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };
}; 