# API Validation with Joi

This project uses Joi for request validation across all API endpoints. This document explains how validation is implemented and how to add validation to new routes.

## Structure

- `src/middleware/validator.js` - Contains the validation middleware functions
- `src/validations/` - Contains all validation schemas organized by module
  - `admin/` - Admin-related validation schemas
  - `user/` - User-related validation schemas

## Validation Middleware

Three main validation middleware functions are available:

1. `validate(schema)` - Validates request body
2. `validateQuery(schema)` - Validates request query parameters
3. `validateParams(schema)` - Validates route parameters

## How to Use

### 1. Create a Schema

First, create a schema for your endpoint in the appropriate directory:

```javascript
// src/validations/admin/example.schema.js
import Joi from 'joi';

export const exampleSchema = Joi.object({
  name: Joi.string().required().min(2).messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters long',
    'any.required': 'Name is required'
  }),
  // Add more fields as needed
});
```

### 2. Apply to Routes

Then, apply the validation middleware to your routes:

```javascript
import { validate } from '../../middleware/validator.js';
import { exampleSchema } from '../../validations/admin/example.schema.js';

// In your router file
router.post('/example', validate(exampleSchema), exampleController);
```

## Best Practices

1. **Detailed Error Messages** - Always provide clear error messages using the `messages()` function
2. **Field Validation** - Validate all fields that your endpoint accepts
3. **Security** - Never trust client input; always validate and sanitize
4. **Code Organization** - Keep schemas organized by module/feature

## Examples

### Body Validation

```javascript
// Schema
export const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().required()
});

// Route
router.post('/users', validate(createUserSchema), createUser);
```

### Query Parameter Validation

```javascript
// Schema
export const listUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('name', 'email', 'createdAt').default('createdAt')
});

// Route
router.get('/users', validateQuery(listUsersSchema), listUsers);
```

### Route Parameter Validation

```javascript
// Schema
export const userIdSchema = Joi.object({
  id: Joi.number().integer().required()
});

// Route
router.get('/users/:id', validateParams(userIdSchema), getUserById);
```

## Error Handling

Validation errors are handled automatically by the validation middleware. The response follows this format:

```json
{
  "status": "error",
  "message": "Validation error",
  "errors": "Email is required, Password must be at least 8 characters long"
}
``` 