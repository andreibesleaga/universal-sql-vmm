'use strict';

const { Contract } = require('fabric-contract-api');

class SQLContract extends Contract {
    /**
     * Select records matching criteria.
     * @param {Context} ctx
     * @param {String} table Table name (namespace in Hyperledger)
     * @param {String} where JSON string containing key-value pairs for filtering
     */
    async select(ctx, table, where) {
        const query = JSON.parse(where);
        const iterator = await ctx.stub.getStateByPartialCompositeKey(table, []);
        const results = [];

        for await (const res of iterator) {
            const record = JSON.parse(res.value.toString());
            if (Object.entries(query).every(([key, value]) => record[key] === value)) {
                results.push(record);
            }
        }

        return JSON.stringify(results);
    }

    /**
     * Insert a new record into the table.
     * @param {Context} ctx
     * @param {String} table Table name (namespace in Hyperledger)
     * @param {String} fields Comma-separated field names
     * @param {String} values Comma-separated values
     */
    async insert(ctx, table, fields, values) {
        const key = ctx.stub.createCompositeKey(table, values.split(','));
        const record = Object.fromEntries(
            fields.split(',').map((field, index) => [field, values.split(',')[index]])
        );

        await ctx.stub.putState(key, Buffer.from(JSON.stringify(record)));
        return 'Insert successful';
    }

    /**
     * Update records matching criteria.
     * @param {Context} ctx
     * @param {String} table Table name
     * @param {String} fields Comma-separated field names
     * @param {String} values Comma-separated values
     * @param {String} where JSON string containing criteria for matching
     */
    async update(ctx, table, fields, values, where) {
        const query = JSON.parse(where);
        const iterator = await ctx.stub.getStateByPartialCompositeKey(table, []);
        const updates = {};

        for await (const res of iterator) {
            const record = JSON.parse(res.value.toString());
            if (Object.entries(query).every(([key, value]) => record[key] === value)) {
                fields.split(',').forEach((field, index) => {
                    record[field] = values.split(',')[index];
                });
                updates[res.key] = record;
            }
        }

        for (const [key, record] of Object.entries(updates)) {
            await ctx.stub.putState(key, Buffer.from(JSON.stringify(record)));
        }

        return 'Update successful';
    }

    /**
     * Delete records matching criteria.
     * @param {Context} ctx
     * @param {String} table Table name
     * @param {String} where JSON string containing criteria for matching
     */
    async delete(ctx, table, where) {
        const query = JSON.parse(where);
        const iterator = await ctx.stub.getStateByPartialCompositeKey(table, []);
        const toDelete = [];

        for await (const res of iterator) {
            const record = JSON.parse(res.value.toString());
            if (Object.entries(query).every(([key, value]) => record[key] === value)) {
                toDelete.push(res.key);
            }
        }

        for (const key of toDelete) {
            await ctx.stub.deleteState(key);
        }

        return 'Delete successful';
    }
}

module.exports = SQLContract;
