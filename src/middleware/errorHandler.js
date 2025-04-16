import serverConfig from '../config/server.js';

const { nodeEnv } = serverConfig;

// Handle Sequelize validation errors
const handleSequelizeValidationError = (error) => {
  const errors = error.errors.map(err => ({
    field: err.path,
    message: err.message
  }));
  
  return {
    status: 'fail',
    message: 'Validation Error',
    errors
  };
};

// Handle JWT errors
const handleJWTError = () => ({
  status: 'fail',
  message: 'Invalid token. Please log in again.'
});

const handleJWTExpiredError = () => ({
  status: 'fail',
  message: 'Your token has expired. Please log in again.'
});

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Different error responses for development and production
  if (nodeEnv === 'development') {
    // In development, send detailed error info
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
      error: err
    });
  } else {
    // In production, send limited error info
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'SequelizeValidationError') {
      const formattedError = handleSequelizeValidationError(err);
      return res.status(400).json(formattedError);
    }
    if (err.name === 'JsonWebTokenError') {
      const formattedError = handleJWTError();
      return res.status(401).json(formattedError);
    }
    if (err.name === 'TokenExpiredError') {
      const formattedError = handleJWTExpiredError();
      return res.status(401).json(formattedError);
    }

    // Handle unknown errors
    if (error.isOperational) {
      // Operational, trusted error: send message to client
      return res.status(error.statusCode).json({
        status: error.status,
        message: error.message
      });
    } 
    
    // Programming or unknown error: don't leak error details
    console.error('ERROR 💥', error);
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong'
    });
  }
};

export default errorHandler; 