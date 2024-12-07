const { Parser } = require('node-sql-parser');
const dbAdapter = require('../adapters/dbAdapter');
const redisAdapter = require('../adapters/redisAdapter');
const kafkaAdapter = require('../adapters/kafkaAdapter');
const hederaAdapter = require('../adapters/hederaAdapter');
const ethereumAdapter = require('../adapters/ethereumAdapter');
const hyperledgerAdapter = require('../adapters/hyperledgerAdapter');
const logger = require('../logger');

// Initialize SQL Parser
const parser = new Parser();
const parserOptions = {
    database: 'mysql' // or 'postgresql', 'transactsql', etc.
};

// Map of supported adapters
const SUPPORTED_ADAPTERS = {
    database: dbAdapter,
    redis: redisAdapter,
    kafka: kafkaAdapter,
    hedera: hederaAdapter,
    ethereum: ethereumAdapter,
    hyperledger: hyperledgerAdapter
};

/**
 * Extracts relevant information from the AST
 * @param {Object} ast - The Abstract Syntax Tree
 * @returns {Object} - Extracted SQL components
 */
const extractSQLComponents = (ast) => {
    if (!ast) throw new Error('Invalid AST structure');

    // Handle array of AST nodes (multiple statements)
    const node = Array.isArray(ast) ? ast[0] : ast;

    const result = {
        type: node.type?.toLowerCase(),
        table: null,
        columns: [],
        values: [],
        where: null,
        joins: [],
        groupBy: null,
        orderBy: null,
        limit: null
    };

    // Extract table information
    if (node.from) {
        if (Array.isArray(node.from)) {
            result.table = node.from[0]?.table;
            
            // Extract JOIN information
            node.from.forEach(item => {
                if (item.join) {
                    result.joins.push({
                        type: item.join,
                        table: item.table,
                        on: item.on
                    });
                }
            });
        } else {
            result.table = node.from.table;
        }
    } else if (node.table) {
        result.table = Array.isArray(node.table) ? node.table[0]?.table : node.table;
    }

    // Extract columns
    if (node.columns) {
        result.columns = node.columns.map(col => {
            if (typeof col === 'string') return col;
            if (col.expr) return col.expr.column || col.expr.value;
            return col.column || col.value;
        }).filter(Boolean);
    }

    // Extract values for INSERT
    if (node.values) {
        result.values = node.values.map(row => 
            Array.isArray(row) 
                ? row.map(val => val?.value) 
                : row.value
        );
    }

    // Extract WHERE clause
    if (node.where) {
        result.where = node.where;
    }

    // Extract GROUP BY
    if (node.groupby) {
        result.groupBy = Array.isArray(node.groupby) 
            ? node.groupby.map(item => item.column)
            : [node.groupby.column];
    }

    // Extract ORDER BY
    if (node.orderby) {
        result.orderBy = Array.isArray(node.orderby)
            ? node.orderby.map(item => ({
                column: item.expr.column,
                type: item.type
            }))
            : [{
                column: node.orderby.expr.column,
                type: node.orderby.type
            }];
    }

    // Extract LIMIT
    if (node.limit) {
        result.limit = {
            value: node.limit.value,
            offset: node.limit.offset?.value
        };
    }

    return result;
};

/**
 * Validates the SQL components with improved checks
 * @param {Object} components - The extracted SQL components
 * @throws {Error} If validation fails
 */
const validateSQLComponents = ({ type, table }) => {
    if (!type) throw new Error('SQL type is required');
    
    const validTypes = ['select', 'insert', 'update', 'delete'];
    if (!validTypes.includes(type.toLowerCase())) {
        throw new Error(`Unsupported SQL type: ${type}. Supported types are: ${validTypes.join(', ')}`);
    }

    // Only validate table presence for operations that require it
    if (['select', 'insert', 'update', 'delete'].includes(type.toLowerCase()) && !table) {
        throw new Error('Table name is required');
    }
};

/**
 * Parses a SQL query with improved error handling
 * @param {String} sql - The raw SQL query string.
 * @returns {Object} - Parsed SQL object.
 * @throws {Error} If parsing fails
 */
const parseSQL = (sql) => {
    if (!sql || typeof sql !== 'string') {
        throw new Error('SQL query must be a non-empty string');
    }

    try {
        // Normalize the SQL query
        const normalizedSQL = sql.trim().replace(/\s+/g, ' ');
        
        // Parse the SQL
        const ast = parser.astify(normalizedSQL, parserOptions);
        
        if (!ast) {
            throw new Error('Failed to generate AST from SQL query');
        }

        logger.info('SQLInterpreter: Parsed SQL AST', { 
            sql: normalizedSQL,
            ast: JSON.stringify(ast, null, 2)
        });

        return ast;
    } catch (error) {
        logger.error('SQLInterpreter: Failed to parse SQL', { 
            sql,
            error: error.message,
            stack: error.stack
        });

        // Provide more helpful error messages
        let errorMessage = 'Invalid SQL query: ';
        if (error.message.includes('Lexical error')) {
            errorMessage += 'Syntax error in SQL statement';
        } else if (error.message.includes('Parsing error')) {
            errorMessage += 'Invalid SQL syntax';
        } else {
            errorMessage += error.message;
        }

        throw new Error(errorMessage);
    }
};

/**
 * Routes SQL queries to the appropriate adapter based on the specified adapter type.
 * @param {String} sql - The raw SQL query string.
 * @param {String} adapter - The target adapter (e.g., "database", "redis", "kafka", "hedera", "hyperledger").
 * @param {Object} options - Optional parameters for the query execution.
 * @returns {Promise<Object>} - The result of the SQL operation.
 * @throws {Error} If execution fails
 */
const execute = async (sql, adapter, options = {}) => {
    if (!adapter || typeof adapter !== 'string') {
        throw new Error('Adapter must be a non-empty string');
    }

    logger.info('SQLInterpreter: Received SQL', { sql, adapter });

    const normalizedAdapter = adapter.toLowerCase();
    if (!SUPPORTED_ADAPTERS[normalizedAdapter]) {
        throw new Error(`Unsupported adapter: ${adapter}`);
    }

    try {
        // Parse the SQL query
        const ast = parseSQL(sql);
        const sqlComponents = extractSQLComponents(ast);
        validateSQLComponents(sqlComponents);

        logger.info('SQLInterpreter: Parsed SQL', sqlComponents);

        // Execute the query using the appropriate adapter
        const result = await SUPPORTED_ADAPTERS[normalizedAdapter].execute(
            sqlComponents.type,
            sqlComponents.table,
            sqlComponents.columns,
            sqlComponents.values,
            sqlComponents.where,
            options
        );

        return result;
    } catch (error) {
        logger.error('SQLInterpreter: Execution failed', { 
            sql, 
            adapter, 
            error: error.message,
            stack: error.stack 
        });
        throw error;
    }
};

module.exports = { 
    execute,
    parseSQL, // Exported for testing purposes
    extractSQLComponents, // Exported for testing purposes
    validateSQLComponents // Exported for testing purposes
};
