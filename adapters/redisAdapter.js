const Redis = require('ioredis');
const logger = require('../logger');

const redis = new Redis(); // Default connection to localhost:6379

const execute = async (type, key, fields, values) => {
    try {
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
