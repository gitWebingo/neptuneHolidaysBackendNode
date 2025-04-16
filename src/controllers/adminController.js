import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import serverConfig from '../config/server.js';

const { jwtSecret, jwtExpiresIn } = serverConfig;

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id, isAdmin: true }, jwtSecret, {
    expiresIn: jwtExpiresIn
  });
};

// Admin login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
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
    
    // If we get here, authentication is successful
    
    // Reset login attempts
    await admin.resetLoginAttempts();
    
    // Generate token
    const token = generateToken(admin.id);
    
    // Remove password from output
    admin.password = undefined;
    
    // Set cookie with token
    res.cookie('admin_token', token, {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });
    
    res.status(200).json({
      status: 'success',
      token,
      data: {
        admin
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin logout
const logout = (req, res) => {
  res.cookie('admin_token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
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
    const { firstName, lastName, email, password, role } = req.body;
    
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
      role: role || 'admin' // Default to admin if not specified
    });
    
    // Remove password from output
    newAdmin.password = undefined;
    
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

export {
  login,
  logout,
  getCurrentAdmin,
  register
}; 