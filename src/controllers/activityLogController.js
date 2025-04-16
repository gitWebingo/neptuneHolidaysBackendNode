import ActivityLog from '../models/ActivityLog.js';
import { Op } from 'sequelize';

/**
 * Get all activity logs with pagination and filtering
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getAllActivityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    
    // Build filter conditions
    const whereConditions = {};
    
    // Filter by entity type
    if (req.query.entityType) {
      whereConditions.entityType = req.query.entityType;
    }
    
    // Filter by action
    if (req.query.action) {
      whereConditions.action = req.query.action;
    }
    
    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      whereConditions.createdAt = {
        [Op.between]: [new Date(req.query.startDate), new Date(req.query.endDate)]
      };
    } else if (req.query.startDate) {
      whereConditions.createdAt = {
        [Op.gte]: new Date(req.query.startDate)
      };
    } else if (req.query.endDate) {
      whereConditions.createdAt = {
        [Op.lte]: new Date(req.query.endDate)
      };
    }
    
    // Filter by user or admin
    if (req.query.userId) {
      whereConditions.userId = req.query.userId;
    }
    
    if (req.query.adminId) {
      whereConditions.adminId = req.query.adminId;
    }
    
    // Filter by module
    if (req.query.module) {
      whereConditions.module = req.query.module;
    }
    
    // Search in description
    if (req.query.search) {
      whereConditions.description = {
        [Op.iLike]: `%${req.query.search}%`
      };
    }
    
    // Get activity logs with pagination
    const { count, rows: activityLogs } = await ActivityLog.findAndCountAll({
      where: whereConditions,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        { 
          association: 'User',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          association: 'Admin',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });
    
    // Prepare response with pagination info
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      status: 'success',
      results: activityLogs.length,
      pagination: {
        count,
        page,
        limit,
        totalPages
      },
      data: {
        activityLogs
      }
    });
    
    // Log this action
    req.logActivity({
      action: 'read',
      entityType: 'ActivityLog',
      description: `Retrieved activity logs (page ${page}, limit ${limit})`,
      module: 'Admin/Audit'
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching activity logs'
    });
  }
};

/**
 * Get unique entity types for filtering
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getEntityTypes = async (req, res) => {
  try {
    const entityTypes = await ActivityLog.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('entityType')), 'entityType']],
      raw: true
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        entityTypes: entityTypes.map(item => item.entityType)
      }
    });
  } catch (error) {
    console.error('Error fetching entity types:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching entity types'
    });
  }
};

/**
 * Get unique actions for filtering
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getActions = async (req, res) => {
  try {
    const actions = await ActivityLog.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('action')), 'action']],
      raw: true
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        actions: actions.map(item => item.action)
      }
    });
  } catch (error) {
    console.error('Error fetching actions:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching actions'
    });
  }
};

/**
 * Get unique modules for filtering
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const getModules = async (req, res) => {
  try {
    const modules = await ActivityLog.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('module')), 'module']],
      raw: true
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        modules: modules.map(item => item.module).filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'An error occurred while fetching modules'
    });
  }
}; 