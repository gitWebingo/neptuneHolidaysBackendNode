import Joi from 'joi';

/**
 * Schema for admin login validation
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().min(8).messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  })
});

/**
 * Schema for password reset request validation
 */
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please enter a valid email address',
    'string.empty': 'Email is required',
    'any.required': 'Email is required'
  })
});

/**
 * Schema for password reset validation
 */
export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.empty': 'Reset token is required',
    'any.required': 'Reset token is required'
  }),
  password: Joi.string().required().min(8).messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'string.empty': 'Password confirmation is required',
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required'
  })
}); 