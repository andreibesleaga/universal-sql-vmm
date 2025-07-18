const Redis = require('ioredis');
const logger = require('../logger');

let redis;

// Use a mock Redis client in test mode
if (process.env.TEST_MODE === 'true') {
    redis = {
        hgetall: async (key) => ({ key: 'value', timestamp: Date.now() }),
        hmset: async (key, data) => 'OK',
        del: async (key) => 1,
        on: () => {}
    };
    logger.info('Using mock Redis client in test mode');
} else {
    try {
        redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            retryStrategy: (times) => {
                // Only retry a few times then give up
                if (times > 3) {
                    return null; // Stop retrying
                }
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 1,
            connectTimeout: 1000, // Shorter timeout
            enableOfflineQueue: false // Don't queue commands when disconnected
        });
        
        redis.on('error', (error) => {
            logger.error('Redis connection error', { error: error.message });
        });
    } catch (error) {
        logger.error('Redis initialization failed', { error: error.message });
    }
}

const execute = async (type, key, fields, values) => {
    try {
        if (!redis) {
            throw new Error('Redis connection is not available');
        }
        
        logger.info(`Executing Redis operation: ${type}`, { key, fields, values });

        switch (type) {
            case 'select': {
                const result = await redis.hgetall(key); // Assuming hash-based data model
                logger.info('Redis select successful', { result });
                return result;
            }
            case 'insert': {
                if (!fields || !values || fields.length !== values.length) {
                    throw new Error('Fields and values must be provided and have the same length.');
                }
                const data = fields.reduce((acc, field, index) => {
                    acc[field] = values[index];
                    return acc;
                }, {});
                await redis.hmset(key, data);
                logger.info('Redis insert successful', { key, data });
                return { key, data };
            }
            case 'update': {
                if (!fields || !values || fields.length !== values.length) {
                    throw new Error('Fields and values must be provided and have the same length.');
                }
                const updates = fields.reduce((acc, field, index) => {
                    acc[field] = values[index];
                    return acc;
                }, {});
                await redis.hmset(key, updates); // Redis HMSET works for updates too
                logger.info('Redis update successful', { key, updates });
                return { key, updates };
            }
            case 'delete': {
                const result = await redis.del(key);
                logger.info('Redis delete successful', { key });
                return { deleted: result };
            }
            default:
                throw new Error(`Unsupported Redis operation: ${type}`);
        }
    } catch (error) {
        logger.error(`Redis operation failed: ${type}`, { error: error.message });
        throw error;
    }
};

module.exports = { execute };
