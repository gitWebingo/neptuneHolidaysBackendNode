import express from 'express';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth.js';

const router = express.Router();

// Settings routes
router.get(
  '/', 
  authenticateAdmin, 
  requirePermission('settings:view'), 
  (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Settings accessed'
    });
  }
);

router.patch(
  '/', 
  authenticateAdmin, 
  requirePermission('settings:manage'), 
  (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Settings updated'
    });
  }
);

export default router; 