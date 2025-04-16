import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import Admin from '../models/Admin.js';

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
      isSystemRole: !!req.body.isSystemRole
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
    const role = await Role.findByPk(id);
    
    if (!role) {
      return res.status(404).json({
        status: 'fail',
        message: 'Role not found'
      });
    }
    
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
    const role = await Role.findByPk(id);
    
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
    
    // Check if there are admins using this role
    const adminsWithRole = await Admin.count({ where: { roleId: id } });
    
    if (adminsWithRole > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot delete role. It is currently assigned to ${adminsWithRole} admin(s).`
      });
    }
    
    // Delete the role
    await role.destroy();
    
    res.status(204).json({
      status: 'success',
      data: null
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