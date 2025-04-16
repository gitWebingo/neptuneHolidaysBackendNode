import express from 'express';
import { login, logout, getCurrentAdmin, register } from '../../controllers/adminController.js';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.get('/logout', logout);

// Protected routes
router.get('/me', authenticateAdmin, getCurrentAdmin);

// Admin registration (protected)
router.post(
  '/register', 
  authenticateAdmin, 
  requirePermission('user:manage'), 
  register
);

export default router; 