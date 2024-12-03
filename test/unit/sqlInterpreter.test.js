const { expect } = require('chai');
const sinon = require('sinon');
const sqlInterpreter = require('../../sqlvm/sqlInterpreter');
const dbAdapter = require('../../adapters/dbAdapter');
const redisAdapter = require('../../adapters/redisAdapter');

describe('SQL Interpreter', () => {
    it('should route SELECT queries to the database adapter', async () => {
        const sql = "SELECT name, age FROM users WHERE age > 30";
        const adapter = 'database';
        const mockResult = [{ name: 'Alice', age: 35 }];

        sinon.stub(dbAdapter, 'execute').resolves(mockResult);

        const result = await sqlInterpreter.execute(sql, adapter);
        expect(result).to.eql(mockResult);

        dbAdapter.execute.restore();
    });

    it('should route INSERT queries to the Redis adapter', async () => {
        const sql = "INSERT INTO cache (key, value) VALUES ('token', '12345')";
        const adapter = 'redis';
        const mockResult = { status: 'success' };

        sinon.stub(redisAdapter, 'execute').resolves(mockResult);

        const result = await sqlInterpreter.execute(sql, adapter);
        expect(result).to.eql(mockResult);

        redisAdapter.execute.restore();
    });

    it('should throw an error for unsupported adapters', async () => {
        const sql = "SELECT * FROM users";
        const adapter = 'unknown';

        try {
            await sqlInterpreter.execute(sql, adapter);
        } catch (error) {
            expect(error.message).to.equal('Unsupported adapter: unknown');
        }
    });
});
