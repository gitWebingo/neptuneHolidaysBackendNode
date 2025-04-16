const Joi = require('joi');

/**
 * Validate data against a Joi schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema
 * @param {Object} options - Validation options
 * @returns {Object} - { error, value }
 */
const validate = (data, schema, options = {}) => {
  const defaultOptions = {
    abortEarly: false, // Return all errors
    stripUnknown: true, // Remove unknown properties
    errors: {
      wrap: {
        label: false
      }
    }
  };

  const validationOptions = { ...defaultOptions, ...options };
  return schema.validate(data, validationOptions);
};

/**
 * Handle validation errors and return a formatted response
 * @param {Object} error - Joi validation error
 * @returns {Object} - Formatted error object
 */
const formatValidationErrors = (error) => {
  if (!error) return null;
  
  const formattedErrors = {};
  
  error.details.forEach((detail) => {
    const path = detail.path.join('.');
    formattedErrors[path] = detail.message;
  });
  
  return {
    status: 'error',
    message: 'Validation failed',
    errors: formattedErrors
  };
};

/**
 * Validation middleware for Express routes
 * @param {Object} schema - Schema object with keys for 'body', 'query', 'params'
 * @returns {Function} - Express middleware
 */
const validationMiddleware = (schema) => {
  return (req, res, next) => {
    const validationErrors = {};
    let hasErrors = false;

    // Validate request body if schema provided
    if (schema.body) {
      const { error } = validate(req.body, schema.body);
      if (error) {
        validationErrors.body = formatValidationErrors(error).errors;
        hasErrors = true;
      }
    }

    // Validate query parameters if schema provided
    if (schema.query) {
      const { error } = validate(req.query, schema.query);
      if (error) {
        validationErrors.query = formatValidationErrors(error).errors;
        hasErrors = true;
      }
    }

    // Validate URL parameters if schema provided
    if (schema.params) {
      const { error } = validate(req.params, schema.params);
      if (error) {
        validationErrors.params = formatValidationErrors(error).errors;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    next();
  };
};

module.exports = {
  validate,
  formatValidationErrors,
  validationMiddleware
}; 