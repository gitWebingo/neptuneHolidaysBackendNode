import express from 'express';
import { login, logout, getCurrentAdmin } from '../../controllers/admin/authController.js';
import { authenticateAdmin } from '../../middleware/adminAuth.js';
import { validate } from '../../middleware/validator.js';
import { loginSchema } from '../../validations/admin/auth.schema.js';

const router = express.Router();

// Public routes
router.post('/login', validate(loginSchema), login);

// Protected routes
router.get('/me', authenticateAdmin, getCurrentAdmin);
router.post('/logout', authenticateAdmin, logout);

export default router; 