const { expect } = require('chai');
const sinon = require('sinon');
const Redis = require('ioredis');
const redisAdapter = require('../../../adapters/redisAdapter');

describe('Redis Adapter', () => {
  let redisStub;
  let redisInstance;

  beforeEach(() => {
    // Create mock Redis instance
    redisInstance = {
      hgetall: sinon.stub().resolves({ field1: 'value1', field2: 'value2' }),
      hmset: sinon.stub().resolves('OK'),
      del: sinon.stub().resolves(1),
      on: sinon.stub()
    };
    
    // Stub Redis constructor
    redisStub = sinon.stub(Redis.prototype, 'constructor').returns(redisInstance);
    
    // Add direct stubs to the adapter's redis instance
    redisAdapter.redis = redisInstance;
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should execute SELECT queries', async () => {
    const mockResult = { field1: 'value1', field2: 'value2' };
    redisInstance.hgetall.resolves(mockResult);

    const result = await redisAdapter.execute('select', 'test:key', ['*'], null, {});
    
    expect(redisInstance.hgetall.calledWith('test:key')).to.be.true;
    expect(result).to.deep.equal(mockResult);
  });

  it('should execute INSERT queries', async () => {
    const fields = ['field1', 'field2'];
    const values = ['value1', 'value2'];
    redisInstance.hmset.resolves('OK');

    const result = await redisAdapter.execute('insert', 'test:key', fields, values);
    
    expect(redisInstance.hmset.calledOnce).to.be.true;
    expect(result).to.have.property('key', 'test:key');
  });

  it('should execute UPDATE queries', async () => {
    const fields = ['field1', 'field2'];
    const values = ['newValue1', 'newValue2'];
    redisInstance.hmset.resolves('OK');

    const result = await redisAdapter.execute('update', 'test:key', fields, values);
    
    expect(redisInstance.hmset.calledOnce).to.be.true;
    expect(result).to.have.property('key', 'test:key');
  });

  it('should execute DELETE queries', async () => {
    redisInstance.del.resolves(1);

    const result = await redisAdapter.execute('delete', 'test:key');
    
    expect(redisInstance.del.calledWith('test:key')).to.be.true;
    expect(result).to.have.property('deleted', 1);
  });

  it('should throw error for unsupported operation', async () => {
    try {
      await redisAdapter.execute('unsupported', 'test:key', [], []);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Unsupported Redis operation');
    }
  });

  it('should throw error when Redis is not available', async () => {
    // Simulate Redis not being available
    redisAdapter.redis = null;
    
    try {
      await redisAdapter.execute('select', 'test:key', [], []);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Redis connection is not available');
    }
    
    // Restore for other tests
    redisAdapter.redis = redisInstance;
  });

  it('should throw error when fields and values have different lengths', async () => {
    try {
      await redisAdapter.execute('insert', 'test:key', ['field1'], ['value1', 'value2']);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Fields and values must be provided and have the same length');
    }
  });
});