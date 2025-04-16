import express from 'express';
import { login, logout, getCurrentAdmin } from '../../controllers/admin/authController.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';

const router = express.Router();

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', authenticateAdmin, getCurrentAdmin);
router.post('/logout', authenticateAdmin, logout);

export default router; 