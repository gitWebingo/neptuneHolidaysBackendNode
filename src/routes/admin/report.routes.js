import express from 'express';
import { authenticateAdmin, requirePermission } from '../../middleware/adminAuth.js';

const router = express.Router();

// Reports routes
router.get(
  '/', 
  authenticateAdmin, 
  requirePermission('reports:view'), 
  (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Reports accessed'
    });
  }
);

export default router; 