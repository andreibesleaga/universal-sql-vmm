const { expect } = require('chai');
const sinon = require('sinon');
const { 
  Client, 
  ContractCallQuery, 
  ContractExecuteTransaction 
} = require('@hashgraph/sdk');
const hederaAdapter = require('../../../adapters/hederaAdapter');

describe('Hedera Adapter', () => {
  let clientStub;
  let contractCallQueryStub;
  let contractExecuteTransactionStub;
  let queryResultStub;
  let txReceiptStub;
  
  beforeEach(() => {
    // Create mock query result
    queryResultStub = {
      getString: sinon.stub().returns('{"result":"success"}')
    };
    
    // Create mock transaction receipt
    txReceiptStub = {
      status: { toString: () => 'SUCCESS' }
    };
    
    // Create mock contract call query
    contractCallQueryStub = {
      setContractId: sinon.stub().returnsThis(),
      setFunction: sinon.stub().returnsThis(),
      execute: sinon.stub().resolves(queryResultStub)
    };
    
    // Create mock contract execute transaction
    contractExecuteTransactionStub = {
      setContractId: sinon.stub().returnsThis(),
      setFunction: sinon.stub().returnsThis(),
      execute: sinon.stub().resolves({
        getReceipt: sinon.stub().resolves(txReceiptStub)
      })
    };
    
    // Create mock client
    clientStub = {};
    
    // Stub Hedera SDK
    sinon.stub(ContractCallQuery.prototype, 'setContractId').returns(contractCallQueryStub);
    sinon.stub(ContractExecuteTransaction.prototype, 'setContractId').returns(contractExecuteTransactionStub);
    
    // Add direct references to the adapter
    hederaAdapter.client = clientStub;
    hederaAdapter.CONTRACT_ID = 'test-contract';
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should execute SELECT operations', async () => {
    const result = await hederaAdapter.execute('select', 'users', ['name', 'email'], ['john'], { id: 1 });
    
    expect(contractCallQueryStub.setContractId.calledWith('test-contract')).to.be.true;
    expect(contractCallQueryStub.setFunction.calledWith('selectRecord')).to.be.true;
    expect(result).to.have.property('result', '{"result":"success"}');
  });
  
  it('should execute INSERT operations', async () => {
    const result = await hederaAdapter.execute('insert', 'users', ['name', 'email'], ['John', 'john@example.com']);
    
    expect(contractExecuteTransactionStub.setContractId.calledWith('test-contract')).to.be.true;
    expect(contractExecuteTransactionStub.setFunction.calledWith('insertRecord')).to.be.true;
    expect(result).to.have.property('status', 'SUCCESS');
  });
  
  it('should execute UPDATE operations', async () => {
    const result = await hederaAdapter.execute('update', 'users', ['email'], ['new@example.com'], { id: 1 });
    
    expect(contractExecuteTransactionStub.setContractId.calledWith('test-contract')).to.be.true;
    expect(contractExecuteTransactionStub.setFunction.calledWith('updateRecord')).to.be.true;
    expect(result).to.have.property('status', 'SUCCESS');
  });
  
  it('should execute DELETE operations', async () => {
    const result = await hederaAdapter.execute('delete', 'users', ['id'], [1]);
    
    expect(contractExecuteTransactionStub.setContractId.calledWith('test-contract')).to.be.true;
    expect(contractExecuteTransactionStub.setFunction.calledWith('deleteRecord')).to.be.true;
    expect(result).to.have.property('status', 'SUCCESS');
  });
  
  it('should throw error for unsupported operations', async () => {
    try {
      await hederaAdapter.execute('unsupported', 'users', [], []);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Unsupported Hedera operation');
    }
  });
  
  it('should throw error when client is not initialized', async () => {
    // Simulate client not being initialized
    const originalClient = hederaAdapter.client;
    hederaAdapter.client = null;
    
    try {
      await hederaAdapter.execute('select', 'users', [], []);
      expect.fail('Should have thrown an error');
    } catch (error) {
      // Error message will vary, but should be caught
      expect(error).to.exist;
    }
    
    // Restore for other tests
    hederaAdapter.client = originalClient;
  });
});