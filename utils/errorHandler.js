/**
 * Centralized error handling utility
 */
const logger = require('../logger');

// Error types
const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  DATABASE: 'DATABASE_ERROR',
  PARSING: 'PARSING_ERROR',
  NETWORK: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

/**
 * Custom error class with type and context
 */
class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, context = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Handle errors in a consistent way
 * @param {Error} error - The error to handle
 * @param {Object} req - Express request object (optional)
 * @param {Object} res - Express response object (optional)
 * @returns {Object} Formatted error response
 */
const handleError = (error, req, res) => {
  // Convert to AppError if it's not already
  const appError = error instanceof AppError 
    ? error 
    : new AppError(error.message || 'An unknown error occurred');
  
  // Log the error
  logger.error(`${appError.type}: ${appError.message}`, {
    error: appError.message,
    stack: appError.stack,
    context: appError.context
  });

  // If we have a response object, send the error
  if (res) {
    const statusCode = getStatusCodeForErrorType(appError.type);
    return res.status(statusCode).json({
      error: {
        type: appError.type,
        message: appError.message,
        timestamp: appError.timestamp
      }
    });
  }

  // Return formatted error for non-HTTP contexts
  return {
    error: {
      type: appError.type,
      message: appError.message,
      timestamp: appError.timestamp
    }
  };
};

/**
 * Map error types to HTTP status codes
 */
const getStatusCodeForErrorType = (type) => {
  const statusMap = {
    [ErrorTypes.VALIDATION]: 400,
    [ErrorTypes.AUTHENTICATION]: 401,
    [ErrorTypes.AUTHORIZATION]: 403,
    [ErrorTypes.DATABASE]: 500,
    [ErrorTypes.PARSING]: 400,
    [ErrorTypes.NETWORK]: 503,
    [ErrorTypes.TIMEOUT]: 504,
    [ErrorTypes.UNKNOWN]: 500
  };
  return statusMap[type] || 500;
};

module.exports = {
  ErrorTypes,
  AppError,
  handleError
};