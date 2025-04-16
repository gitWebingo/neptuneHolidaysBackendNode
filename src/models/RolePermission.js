import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import Role from './Role.js';
import Permission from './Permission.js';

const RolePermission = sequelize.define('RolePermission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  roleId: {
    type: DataTypes.UUID,
    references: {
      model: Role,
      key: 'id'
    },
    allowNull: false
  },
  permissionId: {
    type: DataTypes.UUID,
    references: {
      model: Permission,
      key: 'id'
    },
    allowNull: false
  }
}, {
  timestamps: true,
  tableName: 'role_permissions',
  indexes: [
    {
      unique: true,
      fields: ['roleId', 'permissionId']
    }
  ]
});

// Set up associations
Role.belongsToMany(Permission, { 
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId'
});

Permission.belongsToMany(Role, { 
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId'
});

export default RolePermission; 