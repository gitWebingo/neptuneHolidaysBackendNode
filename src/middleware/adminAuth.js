import jwt from 'jsonwebtoken';
import serverConfig from '../config/server.js';
import Admin from '../models/Admin.js';
import Role from '../models/Role.js';

const { jwtSecret } = serverConfig;

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
      return res.status(401).json({
        status: 'fail',
        message: 'You are not logged in. Please log in to get access.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret);

    // Check if it's an admin token
    if (!decoded.isAdmin) {
      return res.status(401).json({
        status: 'fail',
        message: 'Invalid token. Admin access required.'
      });
    }

    // Check if admin still exists
    const currentAdmin = await Admin.findByPk(decoded.id, {
      include: {
        model: Role,
        include: 'Permissions'
      }
    });
    
    if (!currentAdmin) {
      return res.status(401).json({
        status: 'fail',
        message: 'The admin belonging to this token no longer exists.'
      });
    }

    // Check if admin is active
    if (!currentAdmin.isActive) {
      return res.status(401).json({
        status: 'fail',
        message: 'This admin account has been deactivated.'
      });
    }

    // Grant access to protected route
    req.admin = currentAdmin;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid token or authorization failed.'
    });
  }
};

// Middleware to check if admin is a superadmin
const restrictToSuperAdmin = async (req, res, next) => {
  try {
    const isSuperAdmin = await req.admin.isSuperAdmin();
    
    if (!isSuperAdmin) {
      return res.status(403).json({
        status: 'fail',
        message: 'This action is restricted to super administrators only.'
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error checking admin permissions.'
    });
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
        return res.status(403).json({
          status: 'fail',
          message: 'You do not have permission to perform this action.'
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error checking admin permissions.'
      });
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
        return res.status(403).json({
          status: 'fail',
          message: 'You do not have all the required permissions to perform this action.'
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error checking admin permissions.'
      });
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
        return res.status(403).json({
          status: 'fail',
          message: 'You do not have permission to perform this action.'
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        status: 'error',
        message: 'Error checking admin role.'
      });
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