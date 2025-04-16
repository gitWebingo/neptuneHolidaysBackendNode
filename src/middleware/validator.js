import Joi from 'joi';

/**
 * Creates a validation middleware with the provided schema
 * @param {Object} schema - Joi schema for validation
 * @returns {Function} Express middleware function
 */
export const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errorMessage
      });
    }

    next();
  };
};

/**
 * Creates a validation middleware that validates request query parameters
 * @param {Object} schema - Joi schema for validation
 * @returns {Function} Express middleware function
 */
export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({
        status: 'error',
        message: 'Query validation error',
        errors: errorMessage
      });
    }

    next();
  };
};

/**
 * Creates a validation middleware that validates request parameters
 * @param {Object} schema - Joi schema for validation
 * @returns {Function} Express middleware function
 */
export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return res.status(400).json({
        status: 'error',
        message: 'Parameter validation error',
        errors: errorMessage
      });
    }

    next();
  };
}; 