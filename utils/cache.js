/**
 * Query cache implementation for performance optimization
 */
const logger = require('../logger');

// Default cache settings
const DEFAULT_TTL = 60 * 1000; // 1 minute in milliseconds
const DEFAULT_MAX_SIZE = 1000; // Maximum number of entries in cache

class QueryCache {
  constructor(options = {}) {
    this.ttl = options.ttl || DEFAULT_TTL;
    this.maxSize = options.maxSize || DEFAULT_MAX_SIZE;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0
    };
    
    logger.info('Query cache initialized', { ttl: this.ttl, maxSize: this.maxSize });
  }

  /**
   * Generate a cache key from query parameters
   * @param {String} sql - SQL query
   * @param {String} adapter - Adapter name
   * @param {Object} options - Query options
   * @returns {String} Cache key
   */
  generateKey(sql, adapter, options = {}) {
    // Create a deterministic key from the query parameters
    const optionsStr = JSON.stringify(options || {});
    return `${adapter}:${sql}:${optionsStr}`;
  }

  /**
   * Get a value from the cache
   * @param {String} sql - SQL query
   * @param {String} adapter - Adapter name
   * @param {Object} options - Query options
   * @returns {Object|null} Cached result or null if not found
   */
  get(sql, adapter, options = {}) {
    const key = this.generateKey(sql, adapter, options);
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Check if entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.stats.size = this.cache.size;
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set a value in the cache
   * @param {String} sql - SQL query
   * @param {String} adapter - Adapter name
   * @param {Object} options - Query options
   * @param {Object} value - Value to cache
   * @param {Number} ttl - Time to live in milliseconds (optional)
   */
  set(sql, adapter, options = {}, value, ttl = this.ttl) {
    // Don't cache null or undefined values
    if (value === null || value === undefined) {
      return;
    }
    
    const key = this.generateKey(sql, adapter, options);
    
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
    
    this.stats.size = this.cache.size;
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
    this.stats.size = 0;
    logger.info('Query cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? this.stats.hits / (this.stats.hits + this.stats.misses) 
        : 0
    };
  }
}

// Create a singleton instance
const queryCache = new QueryCache({
  ttl: parseInt(process.env.QUERY_CACHE_TTL || DEFAULT_TTL, 10),
  maxSize: parseInt(process.env.QUERY_CACHE_MAX_SIZE || DEFAULT_MAX_SIZE, 10)
});

module.exports = queryCache;