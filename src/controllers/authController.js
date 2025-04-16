import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import serverConfig from '../config/server.js';

const { jwtSecret, jwtExpiresIn } = serverConfig;

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, jwtSecret, {
    expiresIn: jwtExpiresIn
  });
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
    
    // Generate token
    const token = generateToken(newUser.id);
    
    // Remove password from output
    newUser.password = undefined;
    
    // Set cookie with token
    res.cookie('token', token, {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });
    
    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: newUser
      }
    });
  } catch (error) {
    next(error);
  }
};

// User login
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
    
    // Find user by email
    const user = await User.findOne({ where: { email } });
    
    // Check if user exists and password is correct
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Remove password from output
    user.password = undefined;
    
    // Set cookie with token
    res.cookie('token', token, {
      expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
    });
    
    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

// User logout
const logout = (req, res) => {
  res.cookie('token', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
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