import express from 'express';
import authRoutes from './auth.routes.js';
import roleRoutes from './role.routes.js';
import permissionRoutes from './permission.routes.js';
import settingsRoutes from './settings.routes.js';
import reportRoutes from './report.routes.js';

const router = express.Router();

// Mount admin sub-routes
router.use('/auth', authRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/settings', settingsRoutes);
router.use('/reports', reportRoutes);

export default router; 