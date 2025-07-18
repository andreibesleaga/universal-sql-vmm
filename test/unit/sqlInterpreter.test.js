const { expect } = require('chai');
const sinon = require('sinon');
const sqlInterpreter = require('../../sqlvm/sqlInterpreter');
const dbAdapter = require('../../adapters/dbAdapter');
const redisAdapter = require('../../adapters/redisAdapter');
const kafkaAdapter = require('../../adapters/kafkaAdapter');
const ethereumAdapter = require('../../adapters/ethereumAdapter');
const hederaAdapter = require('../../adapters/hederaAdapter');
const hyperledgerAdapter = require('../../adapters/hyperledgerAdapter');

describe('SQL Interpreter', () => {
  beforeEach(() => {
    // Stub all adapters
    sinon.stub(dbAdapter, 'execute').resolves({ result: 'database' });
    sinon.stub(redisAdapter, 'execute').resolves({ result: 'redis' });
    sinon.stub(kafkaAdapter, 'execute').resolves({ result: 'kafka' });
    sinon.stub(ethereumAdapter, 'execute').resolves({ result: 'ethereum' });
    sinon.stub(hederaAdapter, 'execute').resolves({ result: 'hedera' });
    sinon.stub(hyperledgerAdapter, 'execute').resolves({ result: 'hyperledger' });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should parse SELECT queries correctly', async () => {
    await sqlInterpreter.execute('SELECT name, email FROM users WHERE id = 1', 'database');
    
    expect(dbAdapter.execute.calledOnce).to.be.true;
    const args = dbAdapter.execute.firstCall.args;
    expect(args[0]).to.equal('select');
    expect(args[1]).to.equal('users');
    expect(args[2]).to.deep.equal(['name', 'email']);
    expect(args[4]).to.exist; // where clause
  });
  
  it('should parse INSERT queries correctly', async () => {
    await sqlInterpreter.execute("INSERT INTO users (name, email) VALUES ('John', 'john@example.com')", 'database');
    
    expect(dbAdapter.execute.calledOnce).to.be.true;
    const args = dbAdapter.execute.firstCall.args;
    expect(args[0]).to.equal('insert');
    expect(args[1]).to.equal('users');
    expect(args[2]).to.deep.equal(['name', 'email']);
    expect(args[3]).to.deep.equal(['John', 'john@example.com']);
  });
  
  it('should parse UPDATE queries correctly', async () => {
    await sqlInterpreter.execute("UPDATE users SET email = 'new@example.com' WHERE id = 1", 'database');
    
    expect(dbAdapter.execute.calledOnce).to.be.true;
    const args = dbAdapter.execute.firstCall.args;
    expect(args[0]).to.equal('update');
    expect(args[1]).to.equal('users');
    // The exact structure of columns and values depends on the parser implementation
  });
  
  it('should parse DELETE queries correctly', async () => {
    await sqlInterpreter.execute("DELETE FROM users WHERE id = 1", 'database');
    
    expect(dbAdapter.execute.calledOnce).to.be.true;
    const args = dbAdapter.execute.firstCall.args;
    expect(args[0]).to.equal('delete');
    expect(args[1]).to.equal('users');
    expect(args[4]).to.exist; // where clause
  });
  
  it('should route queries to the correct adapter', async () => {
    await sqlInterpreter.execute('SELECT * FROM users', 'database');
    expect(dbAdapter.execute.calledOnce).to.be.true;
    
    await sqlInterpreter.execute('SELECT * FROM users', 'redis');
    expect(redisAdapter.execute.calledOnce).to.be.true;
    
    await sqlInterpreter.execute('SELECT * FROM users', 'kafka');
    expect(kafkaAdapter.execute.calledOnce).to.be.true;
    
    await sqlInterpreter.execute('SELECT * FROM users', 'ethereum');
    expect(ethereumAdapter.execute.calledOnce).to.be.true;
    
    await sqlInterpreter.execute('SELECT * FROM users', 'hedera');
    expect(hederaAdapter.execute.calledOnce).to.be.true;
    
    await sqlInterpreter.execute('SELECT * FROM users', 'hyperledger');
    expect(hyperledgerAdapter.execute.calledOnce).to.be.true;
  });
  
  it('should throw error for unsupported adapters', async () => {
    try {
      await sqlInterpreter.execute('SELECT * FROM users', 'unsupported');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Unsupported adapter');
    }
  });
  
  it('should throw error for invalid SQL', async () => {
    try {
      await sqlInterpreter.execute('INVALID SQL', 'database');
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Invalid SQL');
    }
  });
  
  it('should validate SQL components', async () => {
    try {
      // Force an invalid SQL component by directly calling the function
      sqlInterpreter.validateSQLComponents({ type: 'unknown' });
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Unsupported SQL type');
    }
  });
});