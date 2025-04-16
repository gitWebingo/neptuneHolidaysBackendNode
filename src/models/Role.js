import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isSystemRole: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the admin who created this role'
  },
  lastModifiedById: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the admin who last modified this role'
  }
}, {
  timestamps: true,
  tableName: 'roles'
});

export default Role; 