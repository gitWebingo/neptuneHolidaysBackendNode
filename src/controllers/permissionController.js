import Permission from '../models/Permission.js';

// Get all permissions
const getAllPermissions = async (req, res, next) => {
  try {
    // Optionally filter by module
    const filter = {};
    if (req.query.module) {
      filter.module = req.query.module;
    }
    
    const permissions = await Permission.findAll({
      where: filter,
      order: [
        ['module', 'ASC'],
        ['name', 'ASC']
      ]
    });
    
    res.status(200).json({
      status: 'success',
      results: permissions.length,
      data: {
        permissions
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get a single permission by ID
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
      data: {
        permission
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create a new permission (typically only used by superadmin)
const createPermission = async (req, res, next) => {
  try {
    const { name, code, module, description } = req.body;
    
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
      code,
      module,
      description
    });
    
    res.status(201).json({
      status: 'success',
      data: {
        permission: newPermission
      }
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
    
    // Find the permission
    const permission = await Permission.findByPk(id);
    
    if (!permission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Permission not found'
      });
    }
    
    // Don't allow changing the permission code (used for programmatic access)
    if (req.body.code) {
      return res.status(400).json({
        status: 'fail',
        message: 'Permission code cannot be changed'
      });
    }
    
    // Update permission details
    if (name) permission.name = name;
    if (description !== undefined) permission.description = description;
    if (module) permission.module = module;
    
    await permission.save();
    
    res.status(200).json({
      status: 'success',
      data: {
        permission
      }
    });
  } catch (error) {
    next(error);
  }
};

// Delete a permission
const deletePermission = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Find the permission
    const permission = await Permission.findByPk(id);
    
    if (!permission) {
      return res.status(404).json({
        status: 'fail',
        message: 'Permission not found'
      });
    }
    
    // Check if any roles have this permission
    const roles = await permission.getRoles();
    
    if (roles.length > 0) {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot delete permission. It is currently assigned to ${roles.length} role(s).`
      });
    }
    
    // Delete the permission
    await permission.destroy();
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

// Get all available modules
const getModules = async (req, res, next) => {
  try {
    const modules = await Permission.findAll({
      attributes: ['module'],
      group: ['module'],
      order: [['module', 'ASC']]
    });
    
    const moduleList = modules.map(item => item.module);
    
    res.status(200).json({
      status: 'success',
      data: {
        modules: moduleList
      }
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