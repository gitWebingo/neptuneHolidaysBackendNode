import Joi from 'joi';

/**
 * Schema for creating a new admin
 */
export const createAdminSchema = Joi.object({
  firstName: Joi.string().required().min(2).max(50).messages({
    'string.empty': 'First name is required',
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required'
  }),
  lastName: Joi.string().required().min(2).max(50).messages({
    'string.empty': 'Last name is required',
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().min(8).messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  }),
  roleId: Joi.string().guid({ version: ['uuidv4'] }).required().messages({
    'string.base': 'Role ID must be a string',
    'string.guid': 'Role ID must be a valid UUID',
    'any.required': 'Role ID is required'
  }),
  isActive: Joi.boolean().default(true),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).messages({
    'string.pattern.base': 'Please enter a valid phone number'
  }).allow('')
});

/**
 * Schema for updating an admin
 */
export const updateAdminSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters'
  }),
  lastName: Joi.string().min(2).max(50).messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters'
  }),
  email: Joi.string().email().messages({
    'string.email': 'Please enter a valid email address'
  }),
  roleId: Joi.string().guid({ version: ['uuidv4'] }).required().messages({
    'string.base': 'Role ID must be a string',
    'string.guid': 'Role ID must be a valid UUID',
    'any.required': 'Role ID is required'
  }),
  isActive: Joi.boolean(),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).messages({
    'string.pattern.base': 'Please enter a valid phone number'
  }).allow('')
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

/**
 * Schema for admin password change
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().required().min(8).messages({
    'string.empty': 'New password is required',
    'string.min': 'New password must be at least 8 characters long',
    'any.required': 'New password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'string.empty': 'Password confirmation is required',
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required'
  })
});

/**
 * Schema for admin ID parameter validation
 */
export const adminIdSchema = Joi.object({
  id: Joi.string().guid({ version: ['uuidv4'] }).required().messages({
    'string.base': 'Admin ID must be a string',
    'string.guid': 'Admin ID must be a valid UUID',
    'any.required': 'Admin ID is required'
  })  
}); 