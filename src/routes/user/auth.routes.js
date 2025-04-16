import express from 'express';
import { register, login, logout, getCurrentUser } from '../../controllers/user/authController.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validator.js';
import { registerSchema, loginSchema } from '../../validations/user/auth.schema.js';

const router = express.Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/logout', logout);
router.get('/me', authenticate, getCurrentUser);

export default router; 