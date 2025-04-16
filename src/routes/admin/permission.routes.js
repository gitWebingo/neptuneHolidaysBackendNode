import express from 'express';
import {
  getAllPermissions,
  getPermission,
  createPermission,
  updatePermission,
  deletePermission,
  getModules
} from '../../controllers/permissionController.js';
import { authenticateAdmin, requirePermission, restrictToSuperAdmin } from '../../middleware/adminAuth.js';

const router = express.Router();

// Permission management routes
router.get(
  '/', 
  authenticateAdmin, 
  requirePermission('role:view'), 
  getAllPermissions
);

router.get(
  '/modules', 
  authenticateAdmin, 
  requirePermission('role:view'),
  getModules
);

router.get(
  '/:id', 
  authenticateAdmin, 
  requirePermission('role:view'), 
  getPermission
);

router.post(
  '/', 
  authenticateAdmin, 
  restrictToSuperAdmin, 
  createPermission
);

router.patch(
  '/:id', 
  authenticateAdmin, 
  restrictToSuperAdmin, 
  updatePermission
);

router.delete(
  '/:id', 
  authenticateAdmin, 
  restrictToSuperAdmin, 
  deletePermission
);

export default router; 