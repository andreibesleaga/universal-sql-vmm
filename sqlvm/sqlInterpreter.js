const { Parser } = require('node-sql-parser');
const dbAdapter = require('../adapters/dbAdapter');
const redisAdapter = require('../adapters/redisAdapter');
const kafkaAdapter = require('../adapters/kafkaAdapter');
const hederaAdapter = require('../adapters/hederaAdapter');
const ethereumAdapter = require('../adapters/ethereumAdapter');
const hyperledgerAdapter = require('../adapters/hyperledgerAdapter');
const logger = require('../logger');
const queryCache = require('../utils/cache');

// Initialize SQL Parser
const parser = new Parser();
const parserOptions = {
    database: 'mysql', // Default dialect
    skipUnsupported: true, // Skip unsupported statements
    supportBigInt: true, // Support BIGINT data type
    supportUnsigned: true, // Support UNSIGNED data type
    multipleStatements: true, // Support multiple statements in one query
    includeHints: true // Include optimizer hints
};

// Map of supported adapters
const SUPPORTED_ADAPTERS = {
    database: dbAdapter,
    sqlite: dbAdapter, // Map sqlite to dbAdapter
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

    // Special handling for SAVEPOINT
    if (Array.isArray(ast) && ast[0]?.stmt?.left?.name === 'SAVEPOINT') {
        return {
            type: 'savepoint',
            table: null,
            columns: [],
            values: [],
            where: null,
            joins: [],
            groupBy: null,
            orderBy: null,
            limit: null,
            definition: null,
            privileges: null,
            users: null,
            transaction: {
                type: 'savepoint',
                name: ast[0]?.stmt?.right?.name?.name?.[0]?.value || null
            }
        };
    }

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
        limit: null,
        // Additional properties for DDL statements
        definition: null,
        // Additional properties for DCL statements
        privileges: null,
        users: null,
        // Additional properties for TCL statements
        transaction: null
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
    
    // Extract DDL information (CREATE, ALTER, DROP)
    if (['create', 'alter', 'drop'].includes(result.type)) {
        result.definition = {
            keyword: node.keyword,
            columns: node.create_definitions || node.columns || [],
            options: node.options || {}
        };
    }
    
    // Extract DCL information (GRANT, REVOKE)
    if (['grant', 'revoke'].includes(result.type)) {
        result.privileges = node.privileges || [];
        result.users = node.users || [];
        if (node.on) {
            result.table = node.on.table;
        }
    }
    
    // Extract TCL information (COMMIT, ROLLBACK, SAVEPOINT, TRANSACTION)
    if (['commit', 'rollback', 'savepoint', 'start', 'begin', 'transaction'].includes(result.type)) {
        result.transaction = {
            type: result.type,
            name: node.name || null
        };
    }
    
    // Special handling for BEGIN TRANSACTION
    if (result.type === 'transaction' && node.expr && node.expr.action && 
        node.expr.action.value) {
        const action = node.expr.action.value.toLowerCase();
        if (action === 'begin') {
            result.type = 'begin';
            result.transaction = {
                type: 'begin',
                name: null
            };
        } else if (action === 'commit') {
            result.type = 'commit';
            result.transaction = {
                type: 'commit',
                name: null
            };
        } else if (action === 'rollback') {
            result.type = 'rollback';
            result.transaction = {
                type: 'rollback',
                name: null
            };
        }
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
        // Handle different AST structures for values
        if (Array.isArray(node.values)) {
            result.values = {};
            // Extract column names from the columns array
            if (node.columns && Array.isArray(node.columns)) {
                const columnNames = node.columns.map(col => {
                    return typeof col === 'string' ? col : (col.value || col.column);
                });
                
                // Extract values from the first row (assuming single row insert)
                if (node.values[0] && node.values[0].value && Array.isArray(node.values[0].value)) {
                    const rowValues = node.values[0].value.map(val => {
                        if (val && typeof val === 'object') {
                            return val.value;
                        }
                        return val;
                    });
                    
                    // Create an object with column names as keys and values
                    columnNames.forEach((col, index) => {
                        if (index < rowValues.length) {
                            result.values[col] = rowValues[index];
                        }
                    });
                }
            }
        }
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
    
    // DML - Data Manipulation Language
    const dmlTypes = ['select', 'insert', 'update', 'delete', 'merge', 'call', 'explain', 'describe'];
    
    // DDL - Data Definition Language
    const ddlTypes = ['create', 'alter', 'drop', 'truncate', 'rename', 'comment'];
    
    // DCL - Data Control Language
    const dclTypes = ['grant', 'revoke', 'deny'];
    
    // TCL - Transaction Control Language
    const tclTypes = ['commit', 'rollback', 'savepoint', 'set', 'start', 'begin', 'end', 'transaction'];
    
    const validTypes = [...dmlTypes, ...ddlTypes, ...dclTypes, ...tclTypes];
    
    if (!validTypes.includes(type.toLowerCase())) {
        throw new Error(`Unsupported SQL type: ${type}. Supported types are: ${validTypes.join(', ')}`);
    }

    // Only validate table presence for operations that require it
    if (dmlTypes.includes(type.toLowerCase()) && !['call', 'explain', 'describe'].includes(type.toLowerCase()) && !table) {
        throw new Error('Table name is required for this operation');
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
        
        // Try different SQL dialects if needed
        let ast;
        const dialects = ['mysql', 'postgresql', 'transactsql'];
        let lastError;
        
        for (const dialect of dialects) {
            try {
                const options = { ...parserOptions, database: dialect };
                ast = parser.astify(normalizedSQL, options);
                if (ast) break;
            } catch (err) {
                lastError = err;
                // Continue trying other dialects
            }
        }
        
        if (!ast) {
            throw lastError || new Error('Failed to generate AST from SQL query');
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

        // For SELECT queries, check cache first
        if (sqlComponents.type === 'select' && options.useCache !== false) {
            const cachedResult = queryCache.get(sql, normalizedAdapter, options);
            if (cachedResult) {
                logger.info('SQLInterpreter: Cache hit', { sql, adapter });
                return cachedResult;
            }
        }

        // Execute the query using the appropriate adapter
        let result;
        
        // DML operations (SELECT, INSERT, UPDATE, DELETE)
        if (['select', 'insert', 'update', 'delete'].includes(sqlComponents.type)) {
            result = await SUPPORTED_ADAPTERS[normalizedAdapter].execute(
                sqlComponents.type,
                sqlComponents.table,
                sqlComponents.columns,
                sqlComponents.values,
                sqlComponents.where,
                options
            );
        }
        // DDL operations (CREATE, ALTER, DROP, etc.)
        else if (['create', 'alter', 'drop', 'truncate', 'rename'].includes(sqlComponents.type)) {
            result = await SUPPORTED_ADAPTERS[normalizedAdapter].execute(
                sqlComponents.type,
                sqlComponents.table,
                null,
                sqlComponents.definition,
                null,
                options
            );
        }
        // DCL operations (GRANT, REVOKE)
        else if (['grant', 'revoke'].includes(sqlComponents.type)) {
            result = await SUPPORTED_ADAPTERS[normalizedAdapter].execute(
                sqlComponents.type,
                sqlComponents.table,
                sqlComponents.privileges,
                sqlComponents.users,
                null,
                options
            );
        }
        // TCL operations (COMMIT, ROLLBACK, etc.)
        else if (['commit', 'rollback', 'savepoint', 'start', 'begin', 'end'].includes(sqlComponents.type)) {
            result = await SUPPORTED_ADAPTERS[normalizedAdapter].execute(
                sqlComponents.type,
                null,
                null,
                sqlComponents.transaction,
                null,
                options
            );
        }
        // Default fallback for other operations
        else {
            result = await SUPPORTED_ADAPTERS[normalizedAdapter].execute(
                sqlComponents.type,
                sqlComponents.table,
                sqlComponents.columns,
                sqlComponents.values,
                sqlComponents.where,
                options
            );
        }

        // Cache SELECT query results
        if (sqlComponents.type === 'select' && options.useCache !== false) {
            // Use custom TTL if provided in options
            const ttl = options.cacheTTL || undefined;
            queryCache.set(sql, normalizedAdapter, options, result, ttl);
            logger.debug('SQLInterpreter: Cached query result', { sql, adapter });
        }

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
