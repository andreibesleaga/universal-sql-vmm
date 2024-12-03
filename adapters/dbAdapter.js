const knex = require('knex');
const logger = require('../logger');

const dbConfig = {
    mysql: { client: 'mysql2', connection: { /* MySQL Connection Config */ } },
    postgres: { client: 'pg', connection: { /* PostgreSQL Connection Config */ } },
    sqlite: {
        client: 'sqlite3',
        connection: {
            filename: './data.sqlite', // SQLite file path
        },
        useNullAsDefault: true, // Required for SQLite
    },
};

const execute = async (type, table, columns, values, where, adapter = 'sqlite') => {
    const db = knex(dbConfig[adapter]);
    logger.info(`Executing DB operation: ${type} on table: ${table} using ${adapter}`, { columns, values, where });

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
    } finally {
        await db.destroy();
    }
};

module.exports = { execute };
