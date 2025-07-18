const { expect } = require('chai');
const sinon = require('sinon');
const { ethers } = require('ethers');
const ethereumAdapter = require('../../../adapters/ethereumAdapter');

describe('Ethereum Adapter', () => {
  let contractStub;
  let txReceiptStub;
  
  beforeEach(() => {
    // Create mock transaction receipt
    txReceiptStub = {
      wait: sinon.stub().resolves({ status: 1, transactionHash: '0x123' })
    };
    
    // Create mock contract
    contractStub = {
      selectRecords: sinon.stub().resolves({ result: 'data' }),
      insertRecord: sinon.stub().resolves(txReceiptStub),
      updateRecords: sinon.stub().resolves(txReceiptStub),
      deleteRecords: sinon.stub().resolves(txReceiptStub)
    };
    
    // Add direct reference to the adapter
    ethereumAdapter.contract = contractStub;
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should execute SELECT operations', async () => {
    const result = await ethereumAdapter.execute('select', 'users', ['name', 'email'], ['john'], { id: 1 });
    
    expect(contractStub.selectRecords.calledWith('users', ['name', 'email'], ['john'])).to.be.true;
    expect(result).to.have.property('result', 'data');
  });
  
  it('should execute INSERT operations', async () => {
    const result = await ethereumAdapter.execute('insert', 'users', ['name', 'email'], ['John', 'john@example.com']);
    
    expect(contractStub.insertRecord.calledWith('users', ['name', 'email'], ['John', 'john@example.com'])).to.be.true;
    expect(result).to.have.property('receipt');
    expect(result.receipt).to.have.property('status', 1);
  });
  
  it('should execute UPDATE operations', async () => {
    const result = await ethereumAdapter.execute('update', 'users', ['email'], ['new@example.com'], { id: 1 });
    
    expect(contractStub.updateRecords.calledOnce).to.be.true;
    expect(result).to.have.property('receipt');
    expect(result.receipt).to.have.property('status', 1);
  });
  
  it('should execute DELETE operations', async () => {
    const result = await ethereumAdapter.execute('delete', 'users', ['id'], [1]);
    
    expect(contractStub.deleteRecords.calledWith('users', ['id'], [1])).to.be.true;
    expect(result).to.have.property('receipt');
    expect(result.receipt).to.have.property('status', 1);
  });
  
  it('should throw error for unsupported operations', async () => {
    try {
      await ethereumAdapter.execute('unsupported', 'users', [], []);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Unsupported Ethereum operation');
    }
  });
  
  it('should throw error when contract is not initialized', async () => {
    // Simulate contract not being initialized
    const originalContract = ethereumAdapter.contract;
    ethereumAdapter.contract = null;
    
    try {
      await ethereumAdapter.execute('select', 'users', [], []);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Cannot read');
    }
    
    // Restore for other tests
    ethereumAdapter.contract = originalContract;
  });
});