import Role from '../../models/Role.js';
import Permission from '../../models/Permission.js';
import ActivityLog from '../../models/ActivityLog.js';

// Get all roles
const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll({
      include: {
        model: Permission,
        through: { attributes: [] } // Exclude junction table attributes
      }
    });
    
    res.status(200).json({
      status: 'success',
      results: roles.length,
      data: {
        roles
      }
    });
    
    // Log this action
    req.logActivity({
      action: 'read',
      entityType: 'Role',
      description: 'Retrieved all roles',
      module: 'Admin/Roles'
    });
  } catch (error) {
    next(error);
  }
};

// Get a single role by ID
const getRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findByPk(id, {
      include: {
        model: Permission,
        through: { attributes: [] }
      }
    });
    
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        role
      }
    });
    
    // Log this action
    req.logActivity({
      action: 'read',
      entityType: 'Role',
      entityId: id,
      description: `Retrieved role: ${role.name}`,
      module: 'Admin/Roles'
    });
  } catch (error) {
    next(error);
  }
};

// Create a new role
const createRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        status: 'fail',
        message: 'Role name is required'
      });
    }
    
    // Check if role with this name already exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({
        status: 'fail',
        message: 'A role with this name already exists'
      });
    }
    
    // Check if trying to create a system role that's not superadmin
    const isSuperAdmin = await req.admin.isSuperAdmin();
    if (req.body.isSystemRole && !isSuperAdmin) {
      return res.status(403).json({
        status: 'fail',
        message: 'Only superadmin can create system roles'
      });
    }
    
    // Create the role
    const newRole = await Role.create({
      name,
      description,
      isSystemRole: !!req.body.isSystemRole,
      createdById: req.admin.id,
      lastModifiedById: req.admin.id
    });
    
    // Assign permissions if provided
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const permissionsToAssign = await Permission.findAll({
        where: {
          id: permissions
        }
      });
      
      await newRole.setPermissions(permissionsToAssign);
    }
    
    // Fetch the role with its permissions
    const roleWithPermissions = await Role.findByPk(newRole.id, {
      include: {
        model: Permission,
        through: { attributes: [] }
      }
    });
    
    // Log the role creation
    req.logActivity({
      action: 'create',
      entityType: 'Role',
      entityId: newRole.id,
      description: `Created new role: ${name}`,
      newValues: {
        name,
        description,
        isSystemRole: !!req.body.isSystemRole,
        permissions: permissions || []
      },
      module: 'Admin/Roles'
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        role: roleWithPermissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update a role
const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;
    
    // Find the role
    const role = await Role.findByPk(id, {
      include: {
        model: Permission,
        through: { attributes: [] }
      }
    });
    
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
    // Store previous values for logging
    const previousValues = {
      name: role.name,
      description: role.description,
      permissions: role.Permissions ? role.Permissions.map(p => p.id) : []
    };
    
    // Don't allow modifying system roles unless you're superadmin
    if (role.isSystemRole) {
      const isSuperAdmin = await req.admin.isSuperAdmin();
      if (!isSuperAdmin) {
        return res.status(403).json({
          status: 'fail',
          message: 'System roles can only be modified by superadmin'
        });
      }
      
      // Don't allow changing the name of the superadmin role
      if (role.name === 'superadmin' && name && name !== 'superadmin') {
        return res.status(403).json({
          status: 'fail',
          message: 'The superadmin role name cannot be changed'
        });
      }
    }
    
    // Check if new name already exists (if name is being changed)
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return res.status(400).json({
          status: 'fail',
          message: 'A role with this name already exists'
        });
      }
    }
    
    // Update role details
    if (name) role.name = name;
    if (description !== undefined) role.description = description;
    role.lastModifiedById = req.admin.id;
    
    await role.save();
    
    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      // Don't allow removing all permissions from superadmin role
      if (role.name === 'superadmin' && permissions.length === 0) {
        return res.status(403).json({
          status: 'fail',
          message: 'Cannot remove all permissions from the superadmin role'
        });
      }
      
      const permissionsToAssign = await Permission.findAll({
        where: {
          id: permissions
        }
      });
      
      await role.setPermissions(permissionsToAssign);
    }
    
    // Fetch the updated role with its permissions
    const updatedRole = await Role.findByPk(id, {
      include: {
        model: Permission,
        through: { attributes: [] }
      }
    });
    
    // Create new values object for logging
    const newValues = {
      name: updatedRole.name,
      description: updatedRole.description,
      permissions: updatedRole.Permissions ? updatedRole.Permissions.map(p => p.id) : []
    };
    
    // Log the role update
    req.logActivity({
      action: 'update',
      entityType: 'Role',
      entityId: id,
      description: `Updated role: ${updatedRole.name}`,
      previousValues,
      newValues,
      module: 'Admin/Roles'
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        role: updatedRole
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete a role
const deleteRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the role
    const role = await Role.findByPk(id, {
      include: {
        model: Permission,
        through: { attributes: [] }
      }
    });
    
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
    // Don't allow deleting system roles
    if (role.isSystemRole) {
      return res.status(403).json({
        status: 'fail',
        message: 'System roles cannot be deleted'
      });
    }
    
    // Check if any admins are using this role
    const adminsWithRole = await role.getAdmins();
    if (adminsWithRole.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot delete role. It is assigned to ${adminsWithRole.length} admin(s)`
      });
    }
    
    // Store info for logging
    const roleInfo = {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: role.Permissions ? role.Permissions.map(p => p.id) : []
    };
    
    // Delete the role
    await role.destroy();
    
    // Log the role deletion
    req.logActivity({
      action: 'delete',
      entityType: 'Role',
      entityId: id,
      description: `Deleted role: ${roleInfo.name}`,
      previousValues: roleInfo,
      module: 'Admin/Roles'
    });
    
    res.status(200).json({
      status: 'success',
      message: 'Role deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export {
  getAllRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
}; 