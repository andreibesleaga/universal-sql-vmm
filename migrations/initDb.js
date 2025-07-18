const knex = require('knex');

const dbConfig = {
    client: 'sqlite3',
    connection: { filename: './data.sqlite' },
    useNullAsDefault: true
};

const db = knex(dbConfig);

(async () => {
    if (!(await db.schema.hasTable('test'))) {
        await db.schema.createTable('test', (table) => {
            table.increments('id').primary();
            table.string('value');
            table.integer('key');
        });
    }
    console.log('Database initialized');
    await db.destroy();
})();
