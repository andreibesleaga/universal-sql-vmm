/**
 * Input sanitization utility
 */
const { ErrorTypes, AppError } = require('../utils/errorHandler');

/**
 * Sanitize SQL query to prevent injection
 * @param {String} sql - SQL query to sanitize
 * @returns {String} Sanitized SQL query
 */
const sanitizeSql = (sql) => {
  if (!sql || typeof sql !== 'string') {
    throw new AppError('SQL query must be a non-empty string', ErrorTypes.VALIDATION);
  }

  // Remove comments
  let sanitized = sql
    .replace(/--.*$/gm, '') // Remove single line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
};

/**
 * Sanitize object values to prevent XSS
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Basic XSS prevention
      result[key] = value
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }

  return result;
};

/**
 * Sanitize request parameters
 * @param {Object} params - Request parameters to sanitize
 * @returns {Object} Sanitized parameters
 */
const sanitizeRequest = ({ sql, adapter, options }) => {
  return {
    sql: sanitizeSql(sql),
    adapter: adapter.toLowerCase(),
    options: options ? sanitizeObject(options) : {}
  };
};

module.exports = {
  sanitizeSql,
  sanitizeObject,
  sanitizeRequest
};