const { expect } = require('chai');
const sinon = require('sinon');
const hyperledgerAdapter = require('../../../adapters/hyperledgerAdapter');

describe('Hyperledger Adapter', () => {
  let gatewayStub;
  let networkStub;
  let contractStub;
  
  beforeEach(() => {
    // Create mock contract
    contractStub = {
      evaluateTransaction: sinon.stub().resolves(Buffer.from(JSON.stringify([{ key: 'value' }]))),
      submitTransaction: sinon.stub().resolves(Buffer.from('success'))
    };
    
    // Create mock network
    networkStub = {
      getContract: sinon.stub().returns(contractStub)
    };
    
    // Create mock gateway
    gatewayStub = {
      connect: sinon.stub().resolves(),
      getNetwork: sinon.stub().resolves(networkStub),
      disconnect: sinon.stub()
    };
    
    // Add direct references to the adapter
    hyperledgerAdapter.Gateway = function() { return gatewayStub; };
    hyperledgerAdapter.connectionProfile = { name: 'test-network' };
    hyperledgerAdapter.wallet = { name: 'test-wallet' };
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should execute SELECT operations', async () => {
    const result = await hyperledgerAdapter.execute('select', 'users', ['name', 'email'], ['john'], { id: 1 });
    
    expect(gatewayStub.connect.calledOnce).to.be.true;
    expect(gatewayStub.getNetwork.calledOnce).to.be.true;
    expect(contractStub.evaluateTransaction.calledWith('select')).to.be.true;
    expect(result).to.deep.equal([{ key: 'value' }]);
  });
  
  it('should execute INSERT operations', async () => {
    const result = await hyperledgerAdapter.execute('insert', 'users', ['name', 'email'], ['John', 'john@example.com']);
    
    expect(gatewayStub.connect.calledOnce).to.be.true;
    expect(gatewayStub.getNetwork.calledOnce).to.be.true;
    expect(contractStub.submitTransaction.calledWith('insert')).to.be.true;
    expect(result).to.have.property('status', 'INSERT successful');
  });
  
  it('should execute UPDATE operations', async () => {
    const result = await hyperledgerAdapter.execute('update', 'users', ['email'], ['new@example.com'], { id: 1 });
    
    expect(gatewayStub.connect.calledOnce).to.be.true;
    expect(gatewayStub.getNetwork.calledOnce).to.be.true;
    expect(contractStub.submitTransaction.calledWith('update')).to.be.true;
    expect(result).to.have.property('status', 'UPDATE successful');
  });
  
  it('should execute DELETE operations', async () => {
    const result = await hyperledgerAdapter.execute('delete', 'users', null, null, { id: 1 });
    
    expect(gatewayStub.connect.calledOnce).to.be.true;
    expect(gatewayStub.getNetwork.calledOnce).to.be.true;
    expect(contractStub.submitTransaction.calledWith('delete')).to.be.true;
    expect(result).to.have.property('status', 'DELETE successful');
  });
  
  it('should throw error for unsupported operations', async () => {
    try {
      await hyperledgerAdapter.execute('unsupported', 'users', [], []);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Unsupported Hyperledger Fabric operation');
    }
  });
  
  it('should throw error when Hyperledger is not initialized', async () => {
    // Simulate Hyperledger not being initialized
    const originalGateway = hyperledgerAdapter.Gateway;
    hyperledgerAdapter.Gateway = null;
    
    try {
      await hyperledgerAdapter.execute('select', 'users', [], []);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Hyperledger Fabric is not properly initialized');
    }
    
    // Restore for other tests
    hyperledgerAdapter.Gateway = originalGateway;
  });
  
  it('should disconnect gateway after execution', async () => {
    await hyperledgerAdapter.execute('select', 'users', [], [], {});
    expect(gatewayStub.disconnect.calledOnce).to.be.true;
  });
  
  it('should disconnect gateway even if an error occurs', async () => {
    // Force an error
    gatewayStub.getNetwork.rejects(new Error('Network error'));
    
    try {
      await hyperledgerAdapter.execute('select', 'users', [], [], {});
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(gatewayStub.disconnect.calledOnce).to.be.true;
    }
  });
});