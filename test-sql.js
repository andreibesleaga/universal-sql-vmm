const sinon = require('sinon');
const logger = require('./logger');

// Set TEST_MODE environment variable
process.env.TEST_MODE = 'true';

// Import the modules we want to mock
const redisAdapter = require('./adapters/redisAdapter');
const kafkaAdapter = require('./adapters/kafkaAdapter');
const ethereumAdapter = require('./adapters/ethereumAdapter');
const hederaAdapter = require('./adapters/hederaAdapter');
const hyperledgerAdapter = require('./adapters/hyperledgerAdapter');

// Create stubs for external adapters
sinon.stub(redisAdapter, 'execute').resolves({ result: 'redis mock' });
sinon.stub(kafkaAdapter, 'execute').resolves({ result: 'kafka mock' });
sinon.stub(ethereumAdapter, 'execute').resolves({ result: 'ethereum mock' });
sinon.stub(hederaAdapter, 'execute').resolves({ result: 'hedera mock' });
sinon.stub(hyperledgerAdapter, 'execute').resolves({ result: 'hyperledger mock' });

// Now import sqlInterpreter after mocking the adapters
const sqlInterpreter = require('./sqlvm/sqlInterpreter');

async function testSqlInterpreter() {
  try {
    // Test SELECT
    console.log('Testing SELECT query...');
    const selectResult = await sqlInterpreter.execute('SELECT * FROM test', 'sqlite');
    console.log('SELECT result:', selectResult);

    // Test INSERT
    console.log('\nTesting INSERT query...');
    const insertResult = await sqlInterpreter.execute(
      "INSERT INTO test VALUES('SQL Interpreter Test', 456)",
      'sqlite'
    );
    console.log('INSERT result:', insertResult);

    // Test SELECT after INSERT
    console.log('\nTesting SELECT after INSERT...');
    const selectAfterInsert = await sqlInterpreter.execute('SELECT * FROM test', 'sqlite');
    console.log('SELECT after INSERT result:', selectAfterInsert);

    console.log('\nAll SQL interpreter tests completed successfully!');
  } catch (error) {
    console.error('SQL interpreter test failed:', error);
  } finally {
    // Restore all stubs
    sinon.restore();
  }
}

testSqlInterpreter();