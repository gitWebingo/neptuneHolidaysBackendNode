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
  getAdminById
);

// Create a new admin (superadmin or admin with manage permission)
router.post(
  '/', 
  requirePermission('admin:manage'), 
  createAdmin
);

// Update an admin
router.put(
  '/:id', 
  requirePermission('admin:manage'), 
  updateAdmin
);

// Update admin password (can be used by admin to change their own password)
router.patch(
  '/:id/password', 
  updateAdminPassword
);

// Delete an admin (requires specific delete permission)
router.delete(
  '/:id', 
  requirePermission('admin:delete'), 
  deleteAdmin
);

export default router; 