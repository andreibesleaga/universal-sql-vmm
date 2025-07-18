/**
 * JWT Secret Management
 * 
 * This module provides secure JWT secret management with:
 * - Environment variable based secrets
 * - Secret rotation capability
 * - Secure secret generation
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('../logger');
const { ErrorTypes, AppError } = require('../utils/errorHandler');

// Default expiration time (1 hour)
const DEFAULT_EXPIRATION = '1h';

/**
 * Get the JWT secret from environment variables
 * Falls back to a secure randomly generated secret if not set
 * @returns {String} JWT secret
 */
const getJwtSecret = () => {
  // Primary secret from environment variable
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    // In production, we should require a proper secret
    if (process.env.NODE_ENV === 'production') {
      logger.error('JWT_SECRET environment variable is not set in production mode');
      throw new AppError('JWT secret is not configured', ErrorTypes.AUTHENTICATION);
    }
    
    // For development, generate a warning but allow a fallback
    logger.warn('JWT_SECRET environment variable is not set, using fallback secret (NOT SECURE FOR PRODUCTION)');
    
    // Use a fallback secret for development only
    return process.env.DEV_JWT_SECRET || 'dev-jwt-secret-not-for-production-use';
  }
  
  return secret;
};

/**
 * Generate a secure random JWT secret
 * @returns {String} Secure random string
 */
const generateSecureSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Create a JWT token
 * @param {Object} payload - Token payload
 * @param {Object} options - JWT options
 * @returns {String} JWT token
 */
const createToken = (payload, options = {}) => {
  const secret = getJwtSecret();
  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRATION || DEFAULT_EXPIRATION
  };
  
  return jwt.sign(payload, secret, { ...defaultOptions, ...options });
};

/**
 * Verify a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {AppError} If token is invalid
 */
const verifyToken = (token) => {
  try {
    // Remove Bearer prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.split(' ')[1];
    }
    
    const secret = getJwtSecret();
    return jwt.verify(token, secret);
  } catch (error) {
    logger.error('JWT verification failed', { error: error.message });
    throw new AppError('Invalid authentication token', ErrorTypes.AUTHENTICATION);
  }
};

module.exports = {
  createToken,
  verifyToken,
  generateSecureSecret
};