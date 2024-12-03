const { expect } = require('chai');
const sinon = require('sinon');
const dbAdapter = require('../../adapters/dbAdapter');
const redisAdapter = require('../../adapters/redisAdapter');
const kafkaAdapter = require('../../adapters/kafkaAdapter');

describe('Adapters', () => {
    describe('Database Adapter', () => {
        it('should execute SELECT queries', async () => {
            const mockResult = [{ name: 'Alice', age: 35 }];
            sinon.stub(dbAdapter, 'execute').resolves(mockResult);

            const result = await dbAdapter.execute('select', 'users', ['name', 'age'], null, { age: '> 30' });
            expect(result).to.eql(mockResult);

            dbAdapter.execute.restore();
        });
    });

    describe('Redis Adapter', () => {
        it('should execute INSERT queries', async () => {
            const mockResult = { status: 'success' };
            sinon.stub(redisAdapter, 'execute').resolves(mockResult);

            const result = await redisAdapter.execute('insert', 'cache', ['key', 'value'], ['token', '12345']);
            expect(result).to.eql(mockResult);

            redisAdapter.execute.restore();
        });
    });

    describe('Kafka Adapter', () => {
        it('should execute PUBLISH operations', async () => {
            const mockResult = { status: 'published' };
            sinon.stub(kafkaAdapter, 'execute').resolves(mockResult);

            const result = await kafkaAdapter.execute('insert', 'topic1', ['message'], ['test message']);
            expect(result).to.eql(mockResult);

            kafkaAdapter.execute.restore();
        });
    });
});
