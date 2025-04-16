import express from 'express';
import adminRoutes from './admin/index.js';
import userRoutes from './user/index.js';

const router = express.Router();

// Mount route groups
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);

export default router; 