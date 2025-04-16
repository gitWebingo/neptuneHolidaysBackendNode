import express from 'express';
import { 
  getAllActivityLogs, 
  getEntityTypes, 
  getActions, 
  getModules 
} from '../../controllers/activityLogController.js';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth.js';

const router = express.Router();

// All routes require admin authentication and audit:view permission
router.use(authenticateAdmin, requirePermission('audit:view'));

// Get all activity logs with filtering and pagination
router.get('/', getAllActivityLogs);

// Get filter options
router.get('/entity-types', getEntityTypes);
router.get('/actions', getActions);
router.get('/modules', getModules);

export default router; 