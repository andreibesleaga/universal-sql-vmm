/**
 * Mock adapters for testing
 */
const sinon = require('sinon');

// Create mock functions for all adapters
const createMockAdapter = () => {
  return {
    execute: sinon.stub().resolves({ result: 'mock success' })
  };
};

// Export mock adapters
module.exports = {
  dbAdapter: createMockAdapter(),
  redisAdapter: createMockAdapter(),
  kafkaAdapter: createMockAdapter(),
  ethereumAdapter: createMockAdapter(),
  hederaAdapter: createMockAdapter(),
  hyperledgerAdapter: createMockAdapter()
};