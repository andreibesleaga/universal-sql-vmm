const { expect } = require('chai');
const sinon = require('sinon');
const dbAdapter = require('../../../adapters/dbAdapter');
const knex = require('knex');

describe('Database Adapter', () => {
  let knexStub;
  let knexInstance;
  let connectionPools;

  beforeEach(() => {
    // Create mock knex instance
    knexInstance = {
      select: sinon.stub().returnsThis(),
      where: sinon.stub().returnsThis(),
      insert: sinon.stub().resolves([1]),
      update: sinon.stub().resolves(1),
      del: sinon.stub().resolves(1),
      destroy: sinon.stub().resolves()
    };
    
    // Stub knex constructor
    knexStub = sinon.stub(knex).returns(knexInstance);
    
    // Reset connection pools
    connectionPools = {};
    // Add a reference to our mock instance
    connectionPools.sqlite = knexInstance;
    // Expose the connection pools to the adapter
    dbAdapter.connectionPools = connectionPools;

  afterEach(() => {
    sinon.restore();
  });

  it('should execute SELECT queries', async () => {
    const mockResult = [{ id: 1, value: 'test', key: 123 }];
    knexInstance.select.returnsThis();
    knexInstance.where.resolves(mockResult);

    const result = await dbAdapter.execute('select', 'test', ['*'], null, {});
    
    expect(knexInstance.select.calledWith(['*'])).to.be.true;
    expect(knexInstance.where.calledWith({})).to.be.true;
    expect(result).to.deep.equal(mockResult);
  });

  it('should execute INSERT queries', async () => {
    const values = { value: 'test', key: 123 };
    const mockResult = [1];
    knexInstance.insert.resolves(mockResult);

    const result = await dbAdapter.execute('insert', 'test', ['value', 'key'], values);
    
    expect(knexInstance.insert.calledWith(values)).to.be.true;
    expect(result).to.deep.equal(mockResult);
  });

  it('should execute UPDATE queries', async () => {
    const values = { value: 'updated' };
    const where = { id: 1 };
    const mockResult = 1;
    knexInstance.update.resolves(mockResult);

    const result = await dbAdapter.execute('update', 'test', ['value'], values, where);
    
    expect(knexInstance.update.calledWith(values)).to.be.true;
    expect(knexInstance.where.calledWith(where)).to.be.true;
    expect(result).to.equal(mockResult);
  });

  it('should execute DELETE queries', async () => {
    const where = { id: 1 };
    const mockResult = 1;
    knexInstance.del.resolves(mockResult);

    const result = await dbAdapter.execute('delete', 'test', null, null, where);
    
    expect(knexInstance.where.calledWith(where)).to.be.true;
    expect(knexInstance.del.called).to.be.true;
    expect(result).to.equal(mockResult);
  });

  it('should throw error for unsupported SQL type', async () => {
    try {
      await dbAdapter.execute('unsupported', 'test', [], {}, {});
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Unsupported SQL type');
    }
  });

  it('should use default adapter if not specified', async () => {
    const mockResult = [{ id: 1 }];
    knexInstance.select.returnsThis();
    knexInstance.where.resolves(mockResult);

    await dbAdapter.execute('select', 'test', ['*'], null, {}, undefined);
    
    // Check that knex was called with sqlite config
    expect(knexStub.calledOnce).to.be.true;
    const config = knexStub.firstCall.args[0];
    expect(config.client).to.equal('sqlite3');
  });

  it('should throw error for invalid adapter', async () => {
    try {
      await dbAdapter.execute('select', 'test', ['*'], null, {}, 'invalid');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Database adapter');
    }
  });
});