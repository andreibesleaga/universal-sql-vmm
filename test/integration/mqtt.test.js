const { expect } = require('chai');
const sinon = require('sinon');
const mqtt = require('mqtt');
const sqlInterpreter = require('../../sqlvm/sqlInterpreter');
const { startMQTTServer } = require('../../mqtt/mqttServer');
const { appToken } = require('../../security');

describe('MQTT Integration Tests', function () {
  let executeStub;
  let token;
  let mqttClient;
  let mqttServer;
  
  beforeEach(() => {
    // Create a test token
    token = appToken();
    
    // Stub the sqlInterpreter.execute method
    executeStub = sinon.stub(sqlInterpreter, 'execute');
    executeStub.resolves({ result: 'success' });
    
    // Mock MQTT client and server
    mqttClient = {
      on: sinon.stub(),
      publish: sinon.stub(),
      subscribe: sinon.stub(),
      end: sinon.stub()
    };
    
    mqttServer = {
      on: sinon.stub()
    };
    
    // Stub mqtt.connect to return our mock client
    sinon.stub(mqtt, 'connect').returns(mqttClient);
    
    // Start MQTT server
    startMQTTServer();
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should handle SQL queries via MQTT', (done) => {
    // Simulate connection event
    const connectCallback = mqttClient.on.args.find(arg => arg[0] === 'connect')[1];
    connectCallback(true);
    
    // Verify subscription to request topic
    expect(mqttClient.subscribe.calledWith('sql/request')).to.be.true;
    
    // Simulate message event
    const messageCallback = mqttClient.on.args.find(arg => arg[0] === 'message')[1];
    messageCallback('sql/request', JSON.stringify({
      sql: "SELECT * FROM test",
      adapter: "database"
    }));
    
    // Wait for async execution
    setTimeout(() => {
      expect(executeStub.calledOnce).to.be.true;
      expect(mqttClient.publish.calledOnce).to.be.true;
      
      const publishArgs = mqttClient.publish.firstCall.args;
      expect(publishArgs[0]).to.equal('sql/response');
      
      const response = JSON.parse(publishArgs[1]);
      expect(response).to.have.property('result', 'success');
      
      done();
    }, 10);
  });
  
  it('should handle SQL execution errors gracefully', (done) => {
    executeStub.rejects(new Error('SQL execution failed'));
    
    // Simulate connection event
    const connectCallback = mqttClient.on.args.find(arg => arg[0] === 'connect')[1];
    connectCallback(true);
    
    // Simulate message event
    const messageCallback = mqttClient.on.args.find(arg => arg[0] === 'message')[1];
    messageCallback('sql/request', JSON.stringify({
      sql: "SELECT * FROM test",
      adapter: "database"
    }));
    
    // Wait for async execution
    setTimeout(() => {
      expect(executeStub.calledOnce).to.be.true;
      expect(mqttClient.publish.calledOnce).to.be.true;
      
      const publishArgs = mqttClient.publish.firstCall.args;
      expect(publishArgs[0]).to.equal('sql/response');
      
      const response = JSON.parse(publishArgs[1]);
      expect(response).to.have.property('error', 'SQL execution failed');
      
      done();
    }, 10);
  });
  
  it('should handle authentication', (done) => {
    // Simulate client-auth event
    const authCallback = mqttClient.on.args.find(arg => arg[0] === 'client-auth')?.[1];
    if (!authCallback) {
      done(new Error('client-auth event handler not found'));
      return;
    }
    
    const authCallbackSpy = sinon.spy();
    
    // Test valid token
    authCallback({ username: 'user' }, { password: Buffer.from(token) }, authCallbackSpy);
    expect(authCallbackSpy.calledWith(null, true)).to.be.true;
    
    // Test invalid token
    authCallbackSpy.resetHistory();
    authCallback({ username: 'user' }, { password: Buffer.from('invalid') }, authCallbackSpy);
    expect(authCallbackSpy.firstCall.args[0]).to.be.instanceOf(Error);
    expect(authCallbackSpy.firstCall.args[1]).to.be.false;
    
    done();
  });
});