import express from 'express';
import { register, login, logout, getCurrentUser } from '../../controllers/user/authController.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', authenticate, getCurrentUser);

export default router; 