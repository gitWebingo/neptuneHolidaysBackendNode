import ActivityLog from '../models/ActivityLog.js';

/**
 * Log an activity in the system
 * @param {Object} options - Activity log options
 * @param {string} options.action - The action performed (create, update, delete, etc.)
 * @param {string} options.entityType - The type of entity affected (User, Admin, Role, etc.)
 * @param {string} options.entityId - The ID of the entity affected
 * @param {string} options.description - Detailed description of the activity
 * @param {Object} options.previousValues - Previous values before change (for updates)
 * @param {Object} options.newValues - New values after change
 * @param {string} options.userId - ID of the user who performed the action (if applicable)
 * @param {string} options.adminId - ID of the admin who performed the action (if applicable)
 * @param {string} options.ipAddress - IP address of the user who performed the action
 * @param {string} options.userAgent - User agent of the browser/client used
 * @param {string} options.module - The module in which the action was performed
 * @returns {Promise<ActivityLog>} - The created activity log
 */
const logActivity = async (options) => {
  try {
    const activityLog = await ActivityLog.create({
      userId: options.userId || null,
      adminId: options.adminId || null,
      action: options.action,
      entityType: options.entityType,
      entityId: options.entityId || null,
      description: options.description,
      previousValues: options.previousValues || null,
      newValues: options.newValues || null,
      ipAddress: options.ipAddress || null,
      userAgent: options.userAgent || null,
      module: options.module || null
    });
    
    return activityLog;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Log activity errors but don't throw, to prevent disrupting the main operation
    return null;
  }
};

/**
 * Create an activity logger middleware
 * @returns {Function} Express middleware function
 */
const activityLoggerMiddleware = () => {
  return (req, res, next) => {
    // Store the original methods we want to wrap
    const originalSend = res.send;
    
    // Add logger to the request object for easy access
    req.logActivity = (options) => {
      // Add IP address and user agent from request
      options.ipAddress = req.ip;
      options.userAgent = req.get('user-agent');
      
      // Add user or admin ID from authenticated user if available
      if (req.user) {
        options.userId = req.user.id;
      }
      if (req.admin) {
        options.adminId = req.admin.id;
      }
      
      return logActivity(options);
    };
    
    next();
  };
};

export { logActivity, activityLoggerMiddleware }; 