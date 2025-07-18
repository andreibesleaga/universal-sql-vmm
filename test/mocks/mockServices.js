/**
 * Mock services for testing adapters
 */

// Mock Redis
const mockRedis = {
  hmset: jest.fn().mockResolvedValue('OK'),
  hgetall: jest.fn().mockResolvedValue({ key: 'value' }),
  del: jest.fn().mockResolvedValue(1),
  on: jest.fn(),
};

// Mock Kafka
const mockKafkaProducer = {
  send: jest.fn((payload, callback) => callback(null, { status: 'success' })),
  on: jest.fn(),
};

const mockKafkaConsumer = {
  addTopics: jest.fn((topics, callback) => callback(null)),
  on: jest.fn(),
};

const mockKafkaClient = {
  on: jest.fn(),
};

// Mock Ethereum
const mockEthereumContract = {
  selectRecords: jest.fn().mockResolvedValue({ result: 'data' }),
  insertRecord: jest.fn().mockResolvedValue({ 
    wait: jest.fn().mockResolvedValue({ status: 'success' }) 
  }),
  updateRecords: jest.fn().mockResolvedValue({ 
    wait: jest.fn().mockResolvedValue({ status: 'success' }) 
  }),
  deleteRecords: jest.fn().mockResolvedValue({ 
    wait: jest.fn().mockResolvedValue({ status: 'success' }) 
  }),
};

// Mock Hedera
const mockHederaClient = {
  execute: jest.fn().mockResolvedValue({ receipt: { status: 'success' } }),
  getReceipt: jest.fn().mockResolvedValue({ status: 'success' }),
};

const mockHederaContractCallQuery = jest.fn().mockImplementation(() => ({
  setContractId: jest.fn().mockReturnThis(),
  setFunction: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue({
    getString: jest.fn().mockReturnValue('{"result":"success"}')
  })
}));

const mockHederaContractExecuteTransaction = jest.fn().mockImplementation(() => ({
  setContractId: jest.fn().mockReturnThis(),
  setFunction: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue({
    getReceipt: jest.fn().mockResolvedValue({ status: { toString: () => 'SUCCESS' } })
  })
}));

// Mock Hyperledger
const mockHyperledgerContract = {
  evaluateTransaction: jest.fn().mockResolvedValue(Buffer.from(JSON.stringify([{ key: 'value' }]))),
  submitTransaction: jest.fn().mockResolvedValue(Buffer.from('success')),
};

const mockHyperledgerNetwork = {
  getContract: jest.fn().mockReturnValue(mockHyperledgerContract),
};

const mockHyperledgerGateway = {
  connect: jest.fn().mockResolvedValue(true),
  getNetwork: jest.fn().mockResolvedValue(mockHyperledgerNetwork),
  disconnect: jest.fn(),
};

// Mock Knex
const mockKnexBuilder = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  insert: jest.fn().mockResolvedValue([1]),
  update: jest.fn().mockResolvedValue(1),
  del: jest.fn().mockResolvedValue(1),
};

const mockKnex = jest.fn().mockImplementation(() => mockKnexBuilder);
mockKnex.destroy = jest.fn().mockResolvedValue(true);

module.exports = {
  mockRedis,
  mockKafkaProducer,
  mockKafkaConsumer,
  mockKafkaClient,
  mockEthereumContract,
  mockHederaClient,
  mockHederaContractCallQuery,
  mockHederaContractExecuteTransaction,
  mockHyperledgerGateway,
  mockHyperledgerNetwork,
  mockHyperledgerContract,
  mockKnex,
  mockKnexBuilder
};