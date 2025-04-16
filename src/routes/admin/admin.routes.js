import express from 'express';
import { 
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  updateAdminPassword,
  deleteAdmin
} from '../../controllers/admin/adminController.js';
import { 
  authenticateAdmin, 
  requirePermission, 
  restrictToSuperAdmin 
} from '../../middleware/adminAuth.js';
import { validate, validateParams } from '../../middleware/validator.js';
import { 
  createAdminSchema, 
  updateAdminSchema, 
  changePasswordSchema, 
  adminIdSchema 
} from '../../validations/admin/admin.schema.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateAdmin);

// Get all admins (paginated)
router.get(
  '/', 
  requirePermission('admin:view'), 
  getAllAdmins
);

// Get admin by ID
router.get(
  '/:id', 
  requirePermission('admin:view'), 
  validateParams(adminIdSchema),
  getAdminById
);

// Create a new admin (superadmin or admin with manage permission)
router.post(
  '/', 
  requirePermission('admin:manage'), 
  validate(createAdminSchema),
  createAdmin
);

// Update an admin
router.put(
  '/:id', 
  requirePermission('admin:manage'), 
  validateParams(adminIdSchema),
  validate(updateAdminSchema),
  updateAdmin
);

// Update admin password (can be used by admin to change their own password)
router.patch(
  '/:id/password', 
  validateParams(adminIdSchema),
  validate(changePasswordSchema),
  updateAdminPassword
);

// Delete an admin (requires specific delete permission)
router.delete(
  '/:id', 
  requirePermission('admin:delete'), 
  validateParams(adminIdSchema),
  deleteAdmin
);

export default router; 