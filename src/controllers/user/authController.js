import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import serverConfig from '../../config/server.js';
import { v4 as uuidv4 } from 'uuid';
import ActivityLog from '../../models/ActivityLog.js';
import { 
  storeUserSession, 
  getUserSession, 
  removeUserSession 
} from '../../utils/redisClient.js';
import logger from '../../utils/logger.js';

const { jwtSecret, jwtExpiresIn } = serverConfig;

// Generate JWT token with a unique token ID
const generateToken = (id) => {
  const tokenId = uuidv4();
  return {
    token: jwt.sign({ id, tokenId }, jwtSecret, {
      expiresIn: jwtExpiresIn
    }),
    tokenId
  };
};

// User registration
const register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email is already in use'
      });
    }
    
    // Create new user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password
    });
    
    // Generate token with unique ID
    const { token, tokenId } = generateToken(newUser.id);
    
    // Store the session in Redis
    const sessionData = {
      tokenId,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      loginTime: new Date().toISOString()
    };
    
    await storeUserSession(newUser.id, sessionData);
    
    // Remove password from output
    newUser.password = undefined;
    
    // Set cookie with token
    res.cookie('token', token, {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });
    
    // Log user registration
    await ActivityLog.create({
      userId: newUser.id,
      action: 'register',
      entityType: 'User',
      entityId: newUser.id,
      description: `User registered: ${firstName} ${lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      module: 'User/Auth'
    });
    
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser
      }
    });
  } catch (error) {
    logger.error('User registration error:', error);
    next(error);
  }
};

// User login
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
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }
    
    // Check for existing session
    const existingSession = await getUserSession(user.id);
    
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
        userId: user.id,
        action: 'force_login',
        entityType: 'Authentication',
        description: `User forced login and terminated other sessions`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        module: 'User/Auth'
      });
      
      // Remove the existing session
      await removeUserSession(user.id);
    }
    
    // Generate token with unique ID
    const { token, tokenId } = generateToken(user.id);
    
    // Store the session in Redis
    const sessionData = {
      tokenId,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      loginTime: new Date().toISOString()
    };
    
    await storeUserSession(user.id, sessionData);
    
    // Remove password from output
    user.password = undefined;
    
    // Set cookie with token
    res.cookie('token', token, {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });
    
    // Log the successful login
    await ActivityLog.create({
      userId: user.id,
      action: 'login',
      entityType: 'Authentication',
      description: `User logged in successfully`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      module: 'User/Auth'
    });
    
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (error) {
    logger.error('User login error:', error);
    next(error);
  }
};

// User logout
const logout = async (req, res) => {
  try {
    // Get user ID if authenticated
    const userId = req.user ? req.user.id : null;
    
    // Clear session if exists
    if (userId) {
      await removeUserSession(userId);
      
      // Log the logout
      await ActivityLog.create({
        userId,
        action: 'logout',
        entityType: 'Authentication',
        description: `User logged out`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        module: 'User/Auth'
      });
    }
    
    res.cookie('token', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('User logout error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error during logout'
    });
  }
};

// Get current user
const getCurrentUser = async (req, res, next) => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

export {
  register,
  login,
  logout,
  getCurrentUser
}; 