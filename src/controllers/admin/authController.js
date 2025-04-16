import jwt from 'jsonwebtoken';
import Admin from '../../models/Admin.js';
import serverConfig from '../../config/server.js';
import { v4 as uuidv4 } from 'uuid';
import ActivityLog from '../../models/ActivityLog.js';
import { 
  storeAdminSession, 
  getAdminSession, 
  removeAdminSession 
} from '../../utils/redisClient.js';
import logger from '../../utils/logger.js';

const { jwtSecret, jwtExpiresIn } = serverConfig;

// Generate JWT token with a unique token ID
const generateToken = (id) => {
  const tokenId = uuidv4();
  return {
    token: jwt.sign({ id, isAdmin: true, tokenId }, jwtSecret, {
      expiresIn: jwtExpiresIn
    }),
    tokenId
  };
};

// Admin login
const login = async (req, res, next) => {
  try {
    const { email, password, forceLogin = false } = req.body;
    
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }
    
    // Find admin by email
    const admin = await Admin.findOne({ where: { email } });
    
    // Check if admin exists
    if (!admin) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }
    
    // Check if account is locked
    if (admin.isLocked()) {
      // Calculate remaining lock time in minutes
      const lockTime = Math.ceil((admin.lockUntil - Date.now()) / (60 * 1000));
      
      return res.status(401).json({
        status: 'fail',
        message: `Account is locked. Try again in ${lockTime} minutes.`
      });
    }
    
    // Check if password is correct
    const isPasswordCorrect = await admin.comparePassword(password);
    
    if (!isPasswordCorrect) {
      // Increment login attempts and potentially lock account
      await admin.incrementLoginAttempts();
      
      // Get remaining attempts before locking
      const remainingAttempts = 3 - admin.loginAttempts;
      
      return res.status(401).json({
        status: 'fail',
        message: remainingAttempts > 0 
          ? `Incorrect password. ${remainingAttempts} attempts remaining.` 
          : 'Account locked for 1 hour due to too many failed attempts.'
      });
    }
    
    // Check for existing session
    const existingSession = await getAdminSession(admin.id);
    
    if (existingSession && !forceLogin) {
      return res.status(403).json({
        status: 'fail',
        message: 'This account is already logged in on another device',
        canForceLogin: true
      });
    }
    
    // If forcing login, log out other sessions
    if (forceLogin && existingSession) {
      // Log the forced login
      await ActivityLog.create({
        adminId: admin.id,
        action: 'force_login',
        entityType: 'Authentication',
        description: `Admin forced login and terminated other sessions`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        module: 'Auth'
      });
      
      // Remove the existing session
      await removeAdminSession(admin.id);
    }
    
    // If we get here, authentication is successful
    
    // Reset login attempts
    await admin.resetLoginAttempts();
    
    // Generate token with unique ID
    const { token, tokenId } = generateToken(admin.id);
    
    // Store the session in Redis
    const sessionData = {
      tokenId,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      loginTime: new Date().toISOString()
    };
    
    await storeAdminSession(admin.id, sessionData);
    
    // Remove password from output
    admin.password = undefined;
    
    // Set cookie with token
    res.cookie('admin_token', token, {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });
    
    // Log the successful login
    await ActivityLog.create({
      adminId: admin.id,
      action: 'login',
      entityType: 'Authentication',
      description: `Admin logged in successfully`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      module: 'Auth'
    });
    
    res.status(200).json({
      status: 'success',
      token,
      data: admin
    });
  } catch (error) {
    logger.error('Admin login error:', error);
    next(error);
  }
};

// Admin logout
const logout = async (req, res) => {
  try {
    // Get admin ID if authenticated
    const adminId = req.admin ? req.admin.id : null;
    
    // Clear session if exists
    if (adminId) {
      await removeAdminSession(adminId);
      
      // Log the logout
      await ActivityLog.create({
        adminId,
        action: 'logout',
        entityType: 'Authentication',
        description: `Admin logged out`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        module: 'Auth'
      });
    }
    
    res.cookie('admin_token', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Admin logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error during logout'
    });
  }
};

// Get current admin
const getCurrentAdmin = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        admin: req.admin
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin registration (typically would be restricted to superadmin)
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, roleId } = req.body;
    
    // Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email is already in use'
      });
    }
    
    // Create new admin
    const newAdmin = await Admin.create({
      firstName,
      lastName,
      email,
      password,
      roleId,
      createdById: req.admin.id, // Track who created this admin
      lastModifiedById: req.admin.id
    });
    
    // Remove password from output
    newAdmin.password = undefined;
    
    // Log the admin creation
    await ActivityLog.create({
      adminId: req.admin.id,
      action: 'create',
      entityType: 'Admin',
      entityId: newAdmin.id,
      description: `Admin created a new admin account for ${firstName} ${lastName}`,
      newValues: {
        firstName,
        lastName,
        email,
        roleId
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      module: 'Admin'
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        admin: newAdmin
      }
    });
  } catch (error) {
    next(error);
  }
};

// Verify token
const verifyToken = (token, tokenId) => {
  try {
    const decoded = jwt.verify(token, jwtSecret);
    
    // Check if the token ID matches
    if (decoded.tokenId !== tokenId) {
      return false;
    }
    
    return decoded;
  } catch (error) {
    return false;
  }
};

// Get admin session - for middleware
const getAdminSessionById = (adminId) => {
  return getAdminSession(adminId);
};

export {
  login,
  logout,
  getCurrentAdmin,
  register,
  verifyToken,
  getAdminSessionById
}; 