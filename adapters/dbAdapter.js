const knex = require('knex');
const logger = require('../logger');

// Connection pool configuration
const poolConfig = {
    min: 2,                // Minimum connections in pool
    max: 10,               // Maximum connections in pool
    idleTimeoutMillis: 30000,  // How long a connection can be idle before being removed
    acquireTimeoutMillis: 30000, // How long to wait to get a connection from the pool
    createTimeoutMillis: 30000,  // How long to wait for a connection to be established
    createRetryIntervalMillis: 200, // Time between connection creation retries
    propagateCreateError: false    // Don't propagate connection creation errors (retry instead)
};

const dbConfig = {
    mysql: { 
        client: 'mysql2', 
        connection: process.env.MYSQL_CONNECTION_STRING || { 
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || '',
            database: process.env.MYSQL_DATABASE || 'test'
        },
        pool: poolConfig
    },
    postgres: { 
        client: 'pg', 
        connection: process.env.POSTGRES_CONNECTION_STRING || {
            host: process.env.POSTGRES_HOST || 'localhost',
            user: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || '',
            database: process.env.POSTGRES_DATABASE || 'test'
        },
        pool: poolConfig
    },
    sqlite: {
        client: 'sqlite3',
        connection: {
            filename: process.env.SQLITE_PATH || './data.sqlite',
        },
        useNullAsDefault: true, // Required for SQLite
        // SQLite doesn't support connection pooling in the same way
        // but we can still configure some pool settings
        pool: { min: 1, max: 1 }
    },
};

// Default adapter is sqlite if not specified
const DEFAULT_ADAPTER = 'sqlite';

// Connection pools cache
const connectionPools = {};

/**
 * Get or create a connection pool for the specified adapter
 * @param {String} adapterName - Database adapter name
 * @returns {Object} Knex connection pool
 */
const getConnectionPool = (adapterName) => {
    // Return existing pool if available
    if (connectionPools[adapterName]) {
        return connectionPools[adapterName];
    }
    
    // Create new pool if not exists
    if (!dbConfig[adapterName]) {
        throw new Error(`Database adapter '${adapterName}' is not configured`);
    }
    
    // Create and cache the connection pool
    connectionPools[adapterName] = knex(dbConfig[adapterName]);
    
    logger.info(`Created connection pool for ${adapterName}`, { 
        poolMin: dbConfig[adapterName].pool?.min || 1,
        poolMax: dbConfig[adapterName].pool?.max || 1
    });
    
    return connectionPools[adapterName];
};

/**
 * Execute a database operation using connection pooling
 */
const execute = async (type, table, columns, values, where, adapter = DEFAULT_ADAPTER) => {
    // Use the specified adapter or default to sqlite
    const adapterName = adapter && dbConfig[adapter] ? adapter : DEFAULT_ADAPTER;
    
    // Get connection from pool
    const db = getConnectionPool(adapterName);
    logger.info(`Executing DB operation: ${type} on table: ${table} using ${adapterName}`, { columns, values, where });

    try {
        let result;
        switch (type) {
            case 'select':
                result = await db(table).select(columns).where(where || {});
                break;
            case 'insert':
                result = await db(table).insert(values);
                break;
            case 'update':
                result = await db(table).update(values).where(where || {});
                break;
            case 'delete':
                result = await db(table).where(where || {}).del();
                break;
            default:
                throw new Error(`Unsupported SQL type: ${type}`);
        }
        logger.info(`DB operation successful: ${type}`, { result });
        return result;
    } catch (error) {
        logger.error(`DB operation failed: ${type}`, { error: error.message });
        throw error;
    }
    // Don't destroy the connection - it returns to the pool
};

/**
 * Close all connection pools - useful for graceful shutdown
 */
const closeAllPools = async () => {
    const pools = Object.keys(connectionPools);
    logger.info(`Closing ${pools.length} connection pools`);
    
    for (const adapter of pools) {
        try {
            await connectionPools[adapter].destroy();
            logger.info(`Closed connection pool for ${adapter}`);
        } catch (error) {
            logger.error(`Error closing connection pool for ${adapter}`, { error: error.message });
        }
    }
};

// Export connectionPools for testing
module.exports = { execute, closeAllPools, connectionPools };
