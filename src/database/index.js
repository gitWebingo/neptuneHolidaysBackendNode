import { sequelize } from '../config/database.js';
import User from '../models/User.js';
import Admin from '../models/Admin.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import RolePermission from '../models/RolePermission.js';
import ActivityLog from '../models/ActivityLog.js';

// Import all models here
const models = {
  User,
  Admin,
  Role,
  Permission,
  RolePermission,
  ActivityLog
};

// Define relationships between models if needed
const setupAssociations = () => {
  // Associations are already set up in the model files
  
  // Set up activity log associations
  ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'User' });
  User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'ActivityLogs' });
  
  ActivityLog.belongsTo(Admin, { foreignKey: 'adminId', as: 'Admin' });
  Admin.hasMany(ActivityLog, { foreignKey: 'adminId', as: 'ActivityLogs' });
};

// Create default permissions and roles if they don't exist
const createDefaultData = async () => {
  try {
    // Create default permissions
    const defaultPermissions = [
      { name: 'Manage Users', code: 'user:manage', module: 'Users', description: 'Create, update, delete users' },
      { name: 'View Users', code: 'user:view', module: 'Users', description: 'View users list and details' },
      { name: 'Manage Roles', code: 'role:manage', module: 'Roles', description: 'Create, update, delete roles' },
      { name: 'View Roles', code: 'role:view', module: 'Roles', description: 'View roles list and details' },
      { name: 'Assign Permissions', code: 'permission:assign', module: 'Permissions', description: 'Assign permissions to roles' },
      { name: 'View Settings', code: 'settings:view', module: 'Settings', description: 'View system settings' },
      { name: 'Manage Settings', code: 'settings:manage', module: 'Settings', description: 'Update system settings' },
      { name: 'View Reports', code: 'reports:view', module: 'Reports', description: 'View system reports' },
      { name: 'View Audit Logs', code: 'audit:view', module: 'Audit', description: 'View system audit logs' }
    ];

    for (const permissionData of defaultPermissions) {
      await Permission.findOrCreate({
        where: { code: permissionData.code },
        defaults: permissionData
      });
    }

    // Create superadmin role if it doesn't exist
    const [superadminRole] = await Role.findOrCreate({
      where: { name: 'superadmin' },
      defaults: {
        name: 'superadmin',
        description: 'Super Administrator with all permissions',
        isSystemRole: true
      }
    });

    // Create admin role if it doesn't exist
    const [adminRole] = await Role.findOrCreate({
      where: { name: 'admin' },
      defaults: {
        name: 'admin',
        description: 'Administrator with limited permissions',
        isSystemRole: true
      }
    });

    // Get all permissions
    const allPermissions = await Permission.findAll();
    
    // Assign all permissions to superadmin role
    await superadminRole.setPermissions(allPermissions);
    
    // Assign some permissions to admin role (excluding role and permission management)
    const adminPermissions = await Permission.findAll({
      where: {
        code: ['user:view', 'reports:view', 'settings:view']
      }
    });
    await adminRole.setPermissions(adminPermissions);

    // Create default superadmin if it doesn't exist
    const superAdminExists = await Admin.findOne({
      include: {
        model: Role,
        where: { name: 'superadmin' }
      }
    });

    if (!superAdminExists) {
      await Admin.create({
        firstName: 'Super',
        lastName: 'Admin',
        email: 'spectraxcodes07@gmail.com',
        password: 'P@ssw0rd123', // This will be hashed by the model hooks
        roleId: superadminRole.id,
        isActive: true
      });
      console.log('Default superadmin account created');
    }

    console.log('Default roles and permissions created');
  } catch (error) {
    console.error('Error creating default data:', error);
  }
};

const initializeDatabase = async (force = false) => {
  try {
    // Setup associations between models
    setupAssociations();
    
    // Sync all models with database
    await sequelize.sync({ force });
    console.log('Database synchronized successfully.');

    // Create default data after sync
    await createDefaultData();
  } catch (error) {
    console.error('Database synchronization failed:', error);
    throw error;
  }
};

export {
  sequelize,
  models,
  initializeDatabase
}; 