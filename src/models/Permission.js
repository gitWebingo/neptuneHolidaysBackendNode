import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Permission = sequelize.define('Permission', {
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
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: 'Unique code for programmatic access to permission'
  },
  module: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Module or section this permission belongs to'
  },
  createdById: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the admin who created this permission'
  },
  lastModifiedById: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the admin who last modified this permission'
  }
}, {
  timestamps: true,
  tableName: 'permissions'
});

export default Permission; 