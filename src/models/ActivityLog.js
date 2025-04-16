import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the user who performed the action (if applicable)'
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the admin who performed the action (if applicable)'
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'The action performed (create, update, delete, etc.)'
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'The type of entity that was affected (User, Admin, Role, etc.)'
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'The ID of the entity that was affected'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Detailed description of the activity'
  },
  previousValues: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Previous values before the change (for updates)'
  },
  newValues: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'New values after the change'
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'IP address of the user who performed the action'
  },
  userAgent: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'User agent of the browser/client used'
  },
  module: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'The module in which the action was performed'
  }
}, {
  timestamps: true,
  tableName: 'activity_logs',
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['adminId']
    },
    {
      fields: ['action']
    },
    {
      fields: ['entityType', 'entityId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

export default ActivityLog; 