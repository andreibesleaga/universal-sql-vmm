const { expect } = require('chai');
const sinon = require('sinon');
const kafka = require('kafka-node');
const kafkaAdapter = require('../../../adapters/kafkaAdapter');

describe('Kafka Adapter', () => {
  let kafkaClientStub;
  let producerStub;
  let consumerStub;
  
  beforeEach(() => {
    // Create mock Kafka instances
    producerStub = {
      send: sinon.stub().callsFake((payload, callback) => {
        callback(null, { status: 'success' });
      }),
      on: sinon.stub()
    };
    
    consumerStub = {
      addTopics: sinon.stub().callsFake((topics, callback) => {
        callback(null);
      }),
      on: sinon.stub().callsFake((event, callback) => {
        if (event === 'message') {
          callback({ value: '{"data":"test"}' });
        }
      })
    };
    
    kafkaClientStub = {
      on: sinon.stub()
    };
    
    // Stub Kafka constructors
    sinon.stub(kafka, 'KafkaClient').returns(kafkaClientStub);
    sinon.stub(kafka, 'Producer').returns(producerStub);
    sinon.stub(kafka, 'Consumer').returns(consumerStub);
    
    // Add direct references to the adapter
    kafkaAdapter.client = kafkaClientStub;
    kafkaAdapter.producer = producerStub;
    kafkaAdapter.consumer = consumerStub;
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should execute INSERT (publish) operations', async () => {
    const result = await kafkaAdapter.execute('insert', 'test-topic', ['message'], ['test-message']);
    
    expect(producerStub.send.calledOnce).to.be.true;
    const payload = producerStub.send.firstCall.args[0][0];
    expect(payload.topic).to.equal('test-topic');
    expect(payload.messages).to.include('test-message');
    expect(result).to.deep.equal({ status: 'success' });
  });
  
  it('should execute SELECT (consume) operations', async () => {
    // This is a bit tricky since it involves callbacks
    // We'll need to simulate the message event
    const promise = kafkaAdapter.execute('select', 'test-topic', [], [], { key: 'value' });
    
    // Simulate a message being received
    const messageCallback = consumerStub.on.args.find(arg => arg[0] === 'message')[1];
    messageCallback({ value: '{"key":"value"}' });
    
    const result = await promise;
    expect(consumerStub.addTopics.calledWith(['test-topic'])).to.be.true;
    expect(result).to.deep.equal({ value: '{"key":"value"}' });
  });
  
  it('should throw error for unsupported operations', async () => {
    try {
      await kafkaAdapter.execute('delete', 'test-topic', [], []);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Kafka delete is not natively supported');
    }
  });
  
  it('should throw error when Kafka is not initialized', async () => {
    // Simulate Kafka not being initialized
    const originalClient = kafkaAdapter.client;
    kafkaAdapter.client = null;
    
    try {
      await kafkaAdapter.execute('insert', 'test-topic', [], []);
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Kafka is not properly initialized');
    }
    
    // Restore for other tests
    kafkaAdapter.client = originalClient;
  });
});