import express from 'express';
import {
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
} from '../../controllers/admin/roleController.js';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth.js';

const router = express.Router();

// Role management routes
router.get(
  '/',
  authenticateAdmin, 
  requirePermission('role:view'), 
  getAllRoles
);

router.get(
  '/:id', 
  authenticateAdmin, 
  requirePermission('role:view'), 
  getRole
);

router.post(
  '/', 
  authenticateAdmin, 
  requirePermission('role:manage'), 
  createRole
);

router.patch(
  '/:id', 
  authenticateAdmin, 
  requirePermission('role:manage'), 
  updateRole
);

router.delete(
  '/:id', 
  authenticateAdmin, 
  requirePermission('role:manage'), 
  deleteRole
);

export default router; 