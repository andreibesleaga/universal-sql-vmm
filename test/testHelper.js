/**
 * Test helper functions
 */
const sinon = require('sinon');
const { expect } = require('chai');

// Setup and teardown for mocks
const setupMocks = (mocks) => {
  const sandbox = sinon.createSandbox();
  const stubs = {};

  for (const [path, mockObj] of Object.entries(mocks)) {
    stubs[path] = {};
    for (const [key, value] of Object.entries(mockObj)) {
      stubs[path][key] = sandbox.stub().returns(value);
    }
  }

  return { sandbox, stubs };
};

const teardownMocks = (sandbox) => {
  sandbox.restore();
};

// Helper to test adapter execute function
const testAdapter = async (adapter, type, table, fields, values, where, expectedResult) => {
  const result = await adapter.execute(type, table, fields, values, where);
  expect(result).to.deep.equal(expectedResult);
};

module.exports = {
  setupMocks,
  teardownMocks,
  testAdapter
};