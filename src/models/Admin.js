import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcrypt';
import Role from './Role.js';

const Admin = sequelize.define('Admin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  roleId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  loginAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE,
    defaultValue: null
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'admins',
  hooks: {
    beforeCreate: async (admin) => {
      if (admin.password) {
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    },
    beforeUpdate: async (admin) => {
      if (admin.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    }
  }
});

// Set up association
Admin.belongsTo(Role, { foreignKey: 'roleId' });
Role.hasMany(Admin, { foreignKey: 'roleId' });

// Instance method to compare password
Admin.prototype.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if account is locked
Admin.prototype.isLocked = function() {
  // Check if lockUntil is set and is greater than current time
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
Admin.prototype.incrementLoginAttempts = async function() {
  // Increment login attempts
  this.loginAttempts = this.loginAttempts + 1;
  
  // Lock account if attempts >= 3
  if (this.loginAttempts >= 3) {
    // Lock for 1 hour
    this.lockUntil = new Date(Date.now() + 60 * 60 * 1000); 
  }
  
  return await this.save();
};

// Reset login attempts
Admin.prototype.resetLoginAttempts = async function() {
  this.loginAttempts = 0;
  this.lockUntil = null;
  return await this.save();
};

// Check if admin has a specific permission
Admin.prototype.hasPermission = async function(permissionCode) {
  try {
    // Load role with associated permissions if not already loaded
    const adminWithRole = await Admin.findByPk(this.id, {
      include: {
        model: Role,
        include: 'Permissions'
      }
    });
    
    // If no role or permissions found, return false
    if (!adminWithRole || !adminWithRole.Role || !adminWithRole.Role.Permissions) {
      return false;
    }
    
    // Check if the admin's role has the permission
    return adminWithRole.Role.Permissions.some(permission => permission.code === permissionCode);
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

// Check if the admin has ANY of the given permissions
Admin.prototype.hasAnyPermission = async function(permissionCodes) {
  for (const code of permissionCodes) {
    if (await this.hasPermission(code)) {
      return true;
    }
  }
  return false;
};

// Check if the admin has ALL of the given permissions
Admin.prototype.hasAllPermissions = async function(permissionCodes) {
  for (const code of permissionCodes) {
    if (!(await this.hasPermission(code))) {
      return false;
    }
  }
  return true;
};

// Check if admin is superadmin (system role)
Admin.prototype.isSuperAdmin = async function() {
  try {
    // Load role if not already loaded
    const adminWithRole = await Admin.findByPk(this.id, {
      include: Role
    });
    
    if (!adminWithRole || !adminWithRole.Role) {
      return false;
    }
    
    // Check if the role name is 'superadmin' and it's a system role
    return adminWithRole.Role.name === 'superadmin' && adminWithRole.Role.isSystemRole;
  } catch (error) {
    console.error('Error checking superadmin status:', error);
    return false;
  }
};

export default Admin; 