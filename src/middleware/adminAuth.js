import jwt from 'jsonwebtoken';
import serverConfig from '../config/server.js';
import Admin from '../models/Admin.js';
import Role from '../models/Role.js';
import { getAdminSession } from '../utils/redisClient.js';
import AppError from '../utils/appError.js';
import logger from '../utils/logger.js';

const { jwtSecret } = serverConfig;

/**
 * Authenticate admin middleware
 * Verifies JWT token and checks for valid session in Redis
 */
const authenticateAdmin = async (req, res, next) => {
  try {
    let token;
    
    // Check if token exists in authorization header or cookies
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.admin_token) {
      token = req.cookies.admin_token;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret);

    // Check if it's an admin token
    if (!decoded.isAdmin) {
      return next(new AppError('Invalid token. Admin access required.', 401));
    }

    // Check if admin still exists
    const currentAdmin = await Admin.findByPk(decoded.id, {
      include: {
        model: Role,
        include: 'Permissions'
      }
    });
    
    if (!currentAdmin) {
      return next(new AppError('The admin account no longer exists.', 401));
    }

    // Check if admin is active
    if (!currentAdmin.isActive) {
      return next(new AppError('This admin account has been deactivated.', 401));
    }
    
    // Check if the admin has an active session in Redis
    const adminSession = await getAdminSession(decoded.id);
    
    if (!adminSession) {
      return next(new AppError('Your session has expired. Please log in again.', 401));
    }
    
    // Verify the token ID matches the active session
    if (decoded.tokenId !== adminSession.tokenId) {
      return next(new AppError('Invalid session. Please log in again.', 401));
    }

    // Grant access to protected route
    req.admin = currentAdmin;
    next();
  } catch (error) {
    logger.error('Admin authentication error:', error);
    return next(new AppError('Invalid token or authorization failed.', 401));
  }
};

// Middleware to check if admin is a superadmin
const restrictToSuperAdmin = async (req, res, next) => {
  try {
    const isSuperAdmin = await req.admin.isSuperAdmin();
    
    if (!isSuperAdmin) {
      return next(new AppError('This action is restricted to super administrators only.', 403));
    }
    
    next();
  } catch (error) {
    logger.error('Error checking admin permissions:', error);
    return next(new AppError('Error checking admin permissions.', 500));
  }
};

// Middleware to check if admin has specific permissions
const requirePermission = (...permissionCodes) => {
  return async (req, res, next) => {
    try {
      // First check if admin is superadmin (has all permissions)
      const isSuperAdmin = await req.admin.isSuperAdmin();
      
      if (isSuperAdmin) {
        return next();
      }
      
      // Otherwise check for the specific permissions
      const hasPermission = await req.admin.hasAnyPermission(permissionCodes);
      
      if (!hasPermission) {
        return next(new AppError('You do not have permission to perform this action.', 403));
      }
      
      next();
    } catch (error) {
      logger.error('Error checking admin permissions:', error);
      return next(new AppError('Error checking admin permissions.', 500));
    }
  };
};

// Middleware to ensure admin has ALL the specified permissions
const requireAllPermissions = (...permissionCodes) => {
  return async (req, res, next) => {
    try {
      // First check if admin is superadmin (has all permissions)
      const isSuperAdmin = await req.admin.isSuperAdmin();
      
      if (isSuperAdmin) {
        return next();
      }
      
      // Otherwise check for all the specific permissions
      const hasAllPermissions = await req.admin.hasAllPermissions(permissionCodes);
      
      if (!hasAllPermissions) {
        return next(new AppError('You do not have all the required permissions to perform this action.', 403));
      }
      
      next();
    } catch (error) {
      logger.error('Error checking admin permissions:', error);
      return next(new AppError('Error checking admin permissions.', 500));
    }
  };
};

// Legacy role-based middleware (kept for compatibility, but uses dynamic roles now)
const restrictToAdmin = (...roleNames) => {
  return async (req, res, next) => {
    try {
      // First check if admin is superadmin
      const isSuperAdmin = await req.admin.isSuperAdmin();
      
      if (isSuperAdmin) {
        return next();
      }
      
      // Check if admin's role name is in the provided list
      if (!req.admin.Role || !roleNames.includes(req.admin.Role.name)) {
        return next(new AppError('You do not have permission to perform this action.', 403));
      }
      
      next();
    } catch (error) {
      logger.error('Error checking admin role:', error);
      return next(new AppError('Error checking admin role.', 500));
    }
  };
};

export {
  authenticateAdmin,
  restrictToAdmin,
  restrictToSuperAdmin,
  requirePermission,
  requireAllPermissions
}; 