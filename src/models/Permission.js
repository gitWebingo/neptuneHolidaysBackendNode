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
  }
}, {
  timestamps: true,
  tableName: 'permissions'
});

export default Permission; 