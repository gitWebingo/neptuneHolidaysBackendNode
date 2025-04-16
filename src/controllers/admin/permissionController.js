import Permission from '../../models/Permission.js';
import { sequelize } from '../../config/database.js';

// Get all permissions
const getAllPermissions = async (req, res, next) => {
  try {
    const permissions = await Permission.findAll();
    
    res.status(200).json({
      status: 'success',
      results: permissions.length,
      data: permissions
    });
    
    // Log this action
    req.logActivity({
      action: 'read',
      entityType: 'Permission',
      description: 'Retrieved all permissions',
      module: 'Admin/Permissions'
    });
  } catch (error) {
    next(error);
  }
};

// Get permission by ID
const getPermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const permission = await Permission.findByPk(id);
    
    if (!permission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Permission not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: permission
    });
    
    // Log this action
    req.logActivity({
      action: 'read',
      entityType: 'Permission',
      entityId: id,
      description: `Retrieved permission: ${permission.name}`,
      module: 'Admin/Permissions'
    });
  } catch (error) {
    next(error);
  }
};

// Create a new permission (typically restricted to superadmin)
const createPermission = async (req, res, next) => {
  try {
    const { name, description, code, module } = req.body;
    
    // Validate required fields
    if (!name || !code || !module) {
      return res.status(400).json({
        status: 'fail',
        message: 'Name, code, and module are required fields'
      });
    }
    
    // Check if permission with this code already exists
    const existingPermission = await Permission.findOne({ where: { code } });
    if (existingPermission) {
      return res.status(400).json({
        status: 'fail',
        message: 'A permission with this code already exists'
      });
    }
    
    // Create the permission
    const newPermission = await Permission.create({
      name,
      description,
      code,
      module,
      createdById: req.admin.id,
      lastModifiedById: req.admin.id
    });
    
    // Log the permission creation
    req.logActivity({
      action: 'create',
      entityType: 'Permission',
      entityId: newPermission.id,
      description: `Created new permission: ${name} (${code})`,
      newValues: {
        name,
        description,
        code,
        module
      },
      module: 'Admin/Permissions'
    });
    
    res.status(201).json({
      status: 'success',
      data: newPermission
    });
  } catch (error) {
    next(error);
  }
};

// Update a permission
const updatePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, module } = req.body;
    
    const permission = await Permission.findByPk(id);
    
    if (!permission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Permission not found'
      });
    }
    
    // Store previous values for logging
    const previousValues = {
      name: permission.name,
      description: permission.description,
      module: permission.module
    };
    
    // Update permission fields
    if (name) permission.name = name;
    if (description !== undefined) permission.description = description;
    if (module) permission.module = module;
    permission.lastModifiedById = req.admin.id;
    
    await permission.save();
    
    // Log the permission update
    req.logActivity({
      action: 'update',
      entityType: 'Permission',
      entityId: id,
      description: `Updated permission: ${permission.name} (${permission.code})`,
      previousValues,
      newValues: {
        name: permission.name,
        description: permission.description,
        module: permission.module
      },
      module: 'Admin/Permissions'
    });
    
    res.status(200).json({
      status: 'success',
      data: permission
    });
  } catch (error) {
    next(error);
  }
};

// Delete a permission
const deletePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const permission = await Permission.findByPk(id);
    
    if (!permission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Permission not found'
      });
    }
    
    // Check if permission is assigned to any roles
    const roleCount = await sequelize.query(
      `SELECT COUNT(*) FROM "role_permissions" WHERE "permissionId" = :permissionId`,
      {
        replacements: { permissionId: id },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    if (roleCount[0].count > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot delete permission. It is assigned to ${roleCount[0].count} role(s)`
      });
    }
    
    // Store permission info for logging
    const permissionInfo = {
      id: permission.id,
      name: permission.name,
      code: permission.code,
      description: permission.description,
      module: permission.module
    };
    
    // Delete the permission
    await permission.destroy();
    
    // Log the permission deletion
    req.logActivity({
      action: 'delete',
      entityType: 'Permission',
      entityId: id,
      description: `Deleted permission: ${permissionInfo.name} (${permissionInfo.code})`,
      previousValues: permissionInfo,
      module: 'Admin/Permissions'
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Permission deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get all unique modules
const getModules = async (req, res, next) => {
  try {
    const modules = await Permission.findAll({
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('module')), 'module']],
      order: [['module', 'ASC']],
      raw: true
    });
    
    res.status(200).json({
      status: 'success',
      data: modules.map(item => item.module)
    });
    
    // Log this action
    req.logActivity({
      action: 'read',
      entityType: 'Permission',
      description: 'Retrieved all unique permission modules',
      module: 'Admin/Permissions'
    });
  } catch (error) {
    next(error);
  }
};

export {
  getAllPermissions,
  getPermission,
  createPermission,
  updatePermission,
  deletePermission,
  getModules
}; 