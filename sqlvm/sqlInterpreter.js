const { Parser } = require('node-sql-parser');
const dbAdapter = require('../adapters/dbAdapter');
//const redisAdapter = require('../adapters/redisAdapter');
//const kafkaAdapter = require('../adapters/kafkaAdapter');
//const hederaAdapter = require('../adapters/hederaAdapter');
//const ethereumAdapter = require('../adapters/ethereumAdapter');
//const hyperledgerAdapter = require('../adapters/hyperledgerAdapter');
const logger = require('../logger');

// Initialize SQL Parser
const parser = new Parser();

/**
 * Parses a SQL query and returns a structured representation.
 * @param {String} sql - The raw SQL query string.
 * @returns {Object} - Parsed SQL object.
 */
const parseSQL = (sql) => {
    try {
        const ast = parser.astify(sql); // Converts SQL to an Abstract Syntax Tree (AST)
        logger.info('SQLInterpreter: Parsed SQL AST', { ast });
        return ast;
    } catch (error) {
        logger.error('SQLInterpreter: Failed to parse SQL', { sql, error: error.message });
        throw new Error(`Invalid SQL query: ${error.message}`);
    }
};

/**
 * Routes SQL queries to the appropriate adapter based on the specified adapter type.
 * @param {String} sql - The raw SQL query string.
 * @param {String} adapter - The target adapter (e.g., "database", "redis", "kafka", "hedera", "hyperledger").
 * @param {Object} options - Optional parameters for the query execution.
 * @returns {Promise<Object>} - The result of the SQL operation.
 */
const execute = async (sql, adapter, options = {}) => {
    logger.info('SQLInterpreter: Received SQL', { sql, adapter });

    // Parse the SQL query
    const ast = parseSQL(sql);
    const type = ast.type.toLowerCase();
    const table = ast.table ? ast.table[0].table : null;
    const columns = ast.columns ? ast.columns.map((col) => col.column) : [];
    const values = ast.values ? ast.values.map((val) => val.value) : [];
    const where = ast.where ? ast.where : null;

    logger.info('SQLInterpreter: Parsed SQL', { type, table, columns, values, where });

    try {
        switch (adapter.toLowerCase()) {
            case 'database': {
                // Route to database adapter (e.g., SQLite, MySQL, PostgreSQL)
                return await dbAdapter.execute(type, table, columns, values, where);
            }
            case 'redis': {
                // Route to Redis adapter
                return await redisAdapter.execute(type, table, columns, values, where);
            }
            case 'kafka': {
                // Route to Kafka adapter
                return await kafkaAdapter.execute(type, table, columns, values, where);
            }
            case 'hedera': {
                // Route to Hedera adapter
                return await hederaAdapter.execute(type, table, columns, values, where);
            }
            case 'hyperledger': {
                // Route to Hyperledger Fabric adapter
                return await hyperledgerAdapter.execute(type, table, columns, values, where);
            }
            case 'ethereum': {
                // Route to Hyperledger Fabric adapter
                return await ethereumAdapter.execute(type, table, columns, values, where);
            }
            default: {
                // Unsupported adapter
                throw new Error(`Unsupported adapter: ${adapter}`);
            }
        }
    } catch (error) {
        logger.error('SQLInterpreter: Execution failed', { sql, adapter, error: error.message });
        throw error;
    }
};

module.exports = { execute };
