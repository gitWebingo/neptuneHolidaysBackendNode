import express from 'express';
import authRoutes from './auth.routes.js';

const router = express.Router();

// Mount user sub-routes
router.use('/auth', authRoutes);

export default router; 