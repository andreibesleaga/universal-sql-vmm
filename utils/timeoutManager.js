/**
 * Timeout manager for external service calls
 */
const logger = require('../logger');

// Default timeout values (in milliseconds)
const DEFAULT_TIMEOUTS = {
  database: 5000,      // 5 seconds
  redis: 2000,         // 2 seconds
  kafka: 10000,        // 10 seconds
  ethereum: 30000,     // 30 seconds
  hedera: 30000,       // 30 seconds
  hyperledger: 30000,  // 30 seconds
  default: 10000       // 10 seconds
};

/**
 * Execute a function with a timeout
 * @param {Function} fn - Function to execute
 * @param {Number} timeout - Timeout in milliseconds
 * @param {String} operationName - Name of the operation for logging
 * @returns {Promise} Result of the function or timeout error
 */
const executeWithTimeout = async (fn, timeout, operationName = 'operation') => {
  // Create a promise that rejects after the timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeout}ms: ${operationName}`));
    }, timeout);
  });

  // Race the function against the timeout
  try {
    return await Promise.race([fn(), timeoutPromise]);
  } catch (error) {
    if (error.message.includes('timed out')) {
      logger.error(`Timeout occurred for ${operationName}`, { timeout });
    }
    throw error;
  }
};

/**
 * Get timeout value for a specific adapter
 * @param {String} adapter - Adapter name
 * @param {Object} options - Options with optional timeout
 * @returns {Number} Timeout in milliseconds
 */
const getTimeoutForAdapter = (adapter, options = {}) => {
  // Use timeout from options if provided
  if (options.timeout && typeof options.timeout === 'number') {
    return options.timeout;
  }

  // Use environment variable if set
  const envVar = `${adapter.toUpperCase()}_TIMEOUT`;
  if (process.env[envVar]) {
    const timeout = parseInt(process.env[envVar], 10);
    if (!isNaN(timeout) && timeout > 0) {
      return timeout;
    }
  }

  // Use default timeout for adapter or general default
  return DEFAULT_TIMEOUTS[adapter.toLowerCase()] || DEFAULT_TIMEOUTS.default;
};

module.exports = {
  executeWithTimeout,
  getTimeoutForAdapter
};