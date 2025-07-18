/**
 * Data validation utility
 */
const { ErrorTypes, AppError } = require('./errorHandler');

/**
 * Validate SQL query
 * @param {String} sql - SQL query to validate
 * @throws {AppError} If validation fails
 */
const validateSql = (sql) => {
  if (!sql || typeof sql !== 'string') {
    throw new AppError('SQL query must be a non-empty string', ErrorTypes.VALIDATION);
  }

  // Check for SQL injection patterns
  const sqlInjectionPatterns = [
    /(\s|;)+(DROP|DELETE|UPDATE|INSERT)\s+/i,
    /(\s|;)+(ALTER|CREATE|TRUNCATE)\s+/i,
    /(\s|;)+(UNION\s+ALL|UNION)\s+SELECT/i,
    /(\s|;)+(OR|AND)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?/i,
    /(\s|;)+(OR|AND)\s+\d+\s*=\s*\d+/i,
    /(\s|;)+SLEEP\s*\(\s*\d+\s*\)/i,
    /(\s|;)+BENCHMARK\s*\(\s*\d+\s*,\s*[\w\s\(\)]+\s*\)/i,
    /(\s|;)+WAITFOR\s+DELAY\s+['"][\w:]+['"]/i,
    /(\s|;)+EXEC\s+XP_CMDSHELL/i,
    /(\s|;)+INTO\s+(OUTFILE|DUMPFILE)/i
  ];

  // Only check for injection if not in test mode
  if (process.env.TEST_MODE !== 'true') {
    for (const pattern of sqlInjectionPatterns) {
      if (pattern.test(sql)) {
        throw new AppError('Potential SQL injection detected', ErrorTypes.VALIDATION, { sql });
      }
    }
  }
};

/**
 * Validate adapter name
 * @param {String} adapter - Adapter name to validate
 * @throws {AppError} If validation fails
 */
const validateAdapter = (adapter) => {
  if (!adapter || typeof adapter !== 'string') {
    throw new AppError('Adapter must be a non-empty string', ErrorTypes.VALIDATION);
  }

  const validAdapters = ['database', 'sqlite', 'redis', 'kafka', 'ethereum', 'hyperledger', 'hedera'];
  if (!validAdapters.includes(adapter.toLowerCase())) {
    throw new AppError(`Invalid adapter: ${adapter}. Valid adapters are: ${validAdapters.join(', ')}`, 
      ErrorTypes.VALIDATION, { adapter });
  }
};

/**
 * Validate options object
 * @param {Object} options - Options to validate
 * @throws {AppError} If validation fails
 */
const validateOptions = (options) => {
  if (options && typeof options !== 'object') {
    throw new AppError('Options must be an object', ErrorTypes.VALIDATION);
  }

  if (options && options.timeout && (!Number.isInteger(options.timeout) || options.timeout < 0)) {
    throw new AppError('Timeout must be a positive integer', ErrorTypes.VALIDATION);
  }
};

/**
 * Validate request parameters
 * @param {Object} params - Request parameters to validate
 * @throws {AppError} If validation fails
 */
const validateRequest = ({ sql, adapter, options }) => {
  validateSql(sql);
  validateAdapter(adapter);
  if (options) validateOptions(options);
};

module.exports = {
  validateSql,
  validateAdapter,
  validateOptions,
  validateRequest
};