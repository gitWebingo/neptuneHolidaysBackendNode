import Admin from '../../models/Admin.js';
import Role from '../../models/Role.js';
import ActivityLog from '../../models/ActivityLog.js';
import { Op } from 'sequelize';
import AppError from '../../utils/appError.js';
import logger from '../../utils/logger.js';

/**
 * Get all admins with pagination and optional filtering
 * @route GET /api/admin
 * @access Private (requires 'admin:view' permission)
 */
const getAllAdmins = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    
    // Optional filters
    const { search, roleId, isActive } = req.query;
    const filter = {};
    
    // Add filters if provided
    if (search) {
      filter[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    if (roleId) {
      filter.roleId = roleId;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const { count, rows: admins } = await Admin.findAndCountAll({
      where: filter,
      include: [
        {
          model: Role,
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      attributes: { exclude: ['password'] }
    });

    // Log this action
    await ActivityLog.create({
      adminId: req.admin.id,
      action: 'list',
      entityType: 'Admin',
      description: `Admin viewed the list of admins`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      module: 'Admin/Management'
    });

    res.status(200).json({
      status: 'success',
      results: admins.length,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalItems: count,
      data: {
        admins
      }
    });
  } catch (error) {
    logger.error('Error fetching admins:', error);
    next(error);
  }
};

/**
 * Get a specific admin by ID
 * @route GET /api/admin/:id
 * @access Private (requires 'admin:view' permission)
 */
const getAdminById = async (req, res, next) => {
  try {
    const admin = await Admin.findByPk(req.params.id, {
      include: [
        {
          model: Role,
          include: 'Permissions'
        }
      ],
      attributes: { exclude: ['password'] }
    });

    if (!admin) {
      return next(new AppError('Admin not found', 404));
    }

    // Log this action
    await ActivityLog.create({
      adminId: req.admin.id,
      action: 'view',
      entityType: 'Admin',
      entityId: admin.id,
      description: `Admin viewed details for admin: ${admin.firstName} ${admin.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      module: 'Admin/Management'
    });

    res.status(200).json({
      status: 'success',
      data: {
        admin
      }
    });
  } catch (error) {
    logger.error('Error fetching admin by ID:', error);
    next(error);
  }
};

/**
 * Create a new admin
 * @route POST /api/admin
 * @access Private (requires 'admin:manage' permission)
 */
const createAdmin = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, roleId, isActive = true } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !roleId) {
      return next(new AppError('Missing required fields', 400));
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new AppError('Invalid email format', 400));
    }
    
    // Check if admin with this email already exists
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return next(new AppError('Email is already in use', 400));
    }
    
    // Verify role exists
    const role = await Role.findByPk(roleId);
    if (!role) {
      return next(new AppError('Invalid role', 400));
    }
    
    // Create new admin
    const newAdmin = await Admin.create({
      firstName,
      lastName,
      email,
      password,
      roleId,
      isActive,
      createdById: req.admin.id,
      lastModifiedById: req.admin.id
    });
    
    // Remove password from response
    newAdmin.password = undefined;
    
    // Log this action
    await ActivityLog.create({
      adminId: req.admin.id,
      action: 'create',
      entityType: 'Admin',
      entityId: newAdmin.id,
      description: `Admin created a new admin account for ${firstName} ${lastName}`,
      newValues: {
        firstName,
        lastName,
        email,
        roleId,
        isActive
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      module: 'Admin/Management'
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        admin: newAdmin
      }
    });
  } catch (error) {
    logger.error('Error creating admin:', error);
    next(error);
  }
};

/**
 * Update an existing admin
 * @route PUT /api/admin/:id
 * @access Private (requires 'admin:manage' permission)
 */
const updateAdmin = async (req, res, next) => {
  try {
    // Allow updating these fields
    const { firstName, lastName, email, roleId, isActive } = req.body;
    
    // Find the admin to update
    const adminToUpdate = await Admin.findByPk(req.params.id);
    
    if (!adminToUpdate) {
      return next(new AppError('Admin not found', 404));
    }
    
    // Don't allow updating superadmin if you're not a superadmin
    if (await adminToUpdate.isSuperAdmin()) {
      const isSuperAdmin = await req.admin.isSuperAdmin();
      if (!isSuperAdmin && req.admin.id !== adminToUpdate.id) {
        return next(new AppError('Only superadmins can update other superadmins', 403));
      }
    }
    
    // Save previous values for logging
    const previousValues = {
      firstName: adminToUpdate.firstName,
      lastName: adminToUpdate.lastName,
      email: adminToUpdate.email,
      roleId: adminToUpdate.roleId,
      isActive: adminToUpdate.isActive
    };
    
    // Update fields if provided
    if (firstName) adminToUpdate.firstName = firstName;
    if (lastName) adminToUpdate.lastName = lastName;
    if (email) {
      // Check if new email is already in use by another admin
      if (email !== adminToUpdate.email) {
        const existingAdmin = await Admin.findOne({ 
          where: { 
            email,
            id: { [Op.ne]: adminToUpdate.id }
          } 
        });
        
        if (existingAdmin) {
          return next(new AppError('Email is already in use', 400));
        }
        
        adminToUpdate.email = email;
      }
    }
    
    if (roleId) {
      // Verify role exists
      const role = await Role.findByPk(roleId);
      if (!role) {
        return next(new AppError('Invalid role', 400));
      }
      
      // Prevent removing last superadmin's superadmin role
      if (await adminToUpdate.isSuperAdmin() && role.name !== 'superadmin') {
        // Count other superadmins
        const superadminRole = await Role.findOne({ where: { name: 'superadmin' } });
        const superadminCount = await Admin.count({
          where: {
            roleId: superadminRole.id,
            id: { [Op.ne]: adminToUpdate.id },
            isActive: true
          }
        });
        
        if (superadminCount === 0) {
          return next(new AppError('Cannot remove the last superadmin', 400));
        }
      }
      
      adminToUpdate.roleId = roleId;
    }
    
    if (isActive !== undefined) {
      // Prevent deactivating the last superadmin
      if (await adminToUpdate.isSuperAdmin() && !isActive) {
        // Count other active superadmins
        const superadminRole = await Role.findOne({ where: { name: 'superadmin' } });
        const activeSuperadminCount = await Admin.count({
          where: {
            roleId: superadminRole.id,
            id: { [Op.ne]: adminToUpdate.id },
            isActive: true
          }
        });
        
        if (activeSuperadminCount === 0) {
          return next(new AppError('Cannot deactivate the last superadmin', 400));
        }
      }
      
      adminToUpdate.isActive = isActive;
    }
    
    adminToUpdate.lastModifiedById = req.admin.id;
    await adminToUpdate.save();
    
    // Load admin with role information
    const updatedAdmin = await Admin.findByPk(adminToUpdate.id, {
      include: [{ model: Role }],
      attributes: { exclude: ['password'] }
    });
    
    // Log this action
    await ActivityLog.create({
      adminId: req.admin.id,
      action: 'update',
      entityType: 'Admin',
      entityId: updatedAdmin.id,
      description: `Admin updated admin account for ${updatedAdmin.firstName} ${updatedAdmin.lastName}`,
      previousValues,
      newValues: {
        firstName: updatedAdmin.firstName,
        lastName: updatedAdmin.lastName,
        email: updatedAdmin.email,
        roleId: updatedAdmin.roleId,
        isActive: updatedAdmin.isActive
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      module: 'Admin/Management'
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        admin: updatedAdmin
      }
    });
  } catch (error) {
    logger.error('Error updating admin:', error);
    next(error);
  }
};

/**
 * Update admin password
 * @route PATCH /api/admin/:id/password
 * @access Private (requires 'admin:manage' permission, or self-update)
 */
const updateAdminPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.params.id;
    
    // Validate required fields
    if (!newPassword) {
      return next(new AppError('New password is required', 400));
    }
    
    // Find the admin
    const admin = await Admin.findByPk(adminId);
    
    if (!admin) {
      return next(new AppError('Admin not found', 404));
    }
    
    // Self-update requires current password validation
    // Admin with manage permission or superadmin can bypass this check
    if (req.admin.id === adminId) {
      if (!currentPassword) {
        return next(new AppError('Current password is required', 400));
      }
      
      const isPasswordCorrect = await admin.comparePassword(currentPassword);
      if (!isPasswordCorrect) {
        return next(new AppError('Current password is incorrect', 401));
      }
    } else {
      // Only superadmins and admins with the right permission can update other admin passwords
      const isSuperAdmin = await req.admin.isSuperAdmin();
      const hasPermission = await req.admin.hasPermission('admin:manage');
      
      if (!isSuperAdmin && !hasPermission) {
        return next(new AppError('You do not have permission to update this admin\'s password', 403));
      }
    }
    
    // Update the password
    admin.password = newPassword;
    admin.lastModifiedById = req.admin.id;
    await admin.save();
    
    // Log this action
    await ActivityLog.create({
      adminId: req.admin.id,
      action: 'update',
      entityType: 'Admin',
      entityId: admin.id,
      description: `Admin updated password for ${admin.firstName} ${admin.lastName}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      module: 'Admin/Management'
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error('Error updating admin password:', error);
    next(error);
  }
};

/**
 * Delete an admin
 * @route DELETE /api/admin/:id
 * @access Private (requires 'admin:delete' permission)
 */
const deleteAdmin = async (req, res, next) => {
  try {
    const adminId = req.params.id;
    
    // Prevent self-deletion
    if (req.admin.id === adminId) {
      return next(new AppError('Cannot delete your own account', 400));
    }
    
    const adminToDelete = await Admin.findByPk(adminId);
    
    if (!adminToDelete) {
      return next(new AppError('Admin not found', 404));
    }
    
    // Prevent deleting a superadmin if not a superadmin
    if (await adminToDelete.isSuperAdmin()) {
      const isSuperAdmin = await req.admin.isSuperAdmin();
      if (!isSuperAdmin) {
        return next(new AppError('Only superadmins can delete other superadmins', 403));
      }
      
      // Prevent deleting the last superadmin
      const superadminRole = await Role.findOne({ where: { name: 'superadmin' } });
      const superadminCount = await Admin.count({
        where: {
          roleId: superadminRole.id,
          isActive: true
        }
      });
      
      if (superadminCount <= 1) {
        return next(new AppError('Cannot delete the last superadmin', 400));
      }
    }
    
    // Log before deletion for record-keeping
    await ActivityLog.create({
      adminId: req.admin.id,
      action: 'delete',
      entityType: 'Admin',
      entityId: adminToDelete.id,
      description: `Admin deleted admin account for ${adminToDelete.firstName} ${adminToDelete.lastName}`,
      previousValues: {
        firstName: adminToDelete.firstName,
        lastName: adminToDelete.lastName,
        email: adminToDelete.email,
        roleId: adminToDelete.roleId
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      module: 'Admin/Management'
    });
    
    // Delete the admin
    await adminToDelete.destroy();
    
    res.status(200).json({
      status: 'success',
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting admin:', error);
    next(error);
  }
};

export {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  updateAdminPassword,
  deleteAdmin
}; 