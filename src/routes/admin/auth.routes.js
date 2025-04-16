import express from 'express';
import { login, logout, getCurrentAdmin, register } from '../../controllers/admin/authController.js';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', authenticateAdmin, getCurrentAdmin);
router.post('/logout', authenticateAdmin, logout);

// Admin registration (protected)
router.post(
  '/register', 
  authenticateAdmin, 
  requirePermission('user:manage'), 
  register
);

export default router; 