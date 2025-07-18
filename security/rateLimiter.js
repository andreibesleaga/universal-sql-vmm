/**
 * Rate limiting middleware
 */
const rateLimit = require('express-rate-limit');
const { ErrorTypes, AppError } = require('../utils/errorHandler');

// Create a store with sliding window
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      const error = new AppError(
        'Too many requests, please try again later.',
        ErrorTypes.AUTHORIZATION,
        { ip: req.ip }
      );
      res.status(429).json({
        error: {
          type: error.type,
          message: error.message,
          timestamp: error.timestamp
        }
      });
    }
  };

  return rateLimit({
    ...defaultOptions,
    ...options
  });
};

// Create different rate limiters for different endpoints
const apiLimiter = createRateLimiter();

// More aggressive rate limiting for authentication endpoints
const authLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  message: 'Too many authentication attempts, please try again after an hour'
});

module.exports = {
  apiLimiter,
  authLimiter,
  createRateLimiter
};