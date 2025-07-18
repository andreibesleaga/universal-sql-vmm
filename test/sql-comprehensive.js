/**
 * Comprehensive SQL Interpreter Test
 * Tests various SQL types including DML, DDL, DCL, and TCL
 */
const sinon = require('sinon');
const logger = require('../logger');

// Set TEST_MODE environment variable
process.env.TEST_MODE = 'true';

// Import the modules we want to mock
const redisAdapter = require('../adapters/redisAdapter');
const kafkaAdapter = require('../adapters/kafkaAdapter');
const ethereumAdapter = require('../adapters/ethereumAdapter');
const hederaAdapter = require('../adapters/hederaAdapter');
const hyperledgerAdapter = require('../adapters/hyperledgerAdapter');
const dbAdapter = require('../adapters/dbAdapter');

// Create stubs for external adapters
sinon.stub(redisAdapter, 'execute').resolves({ result: 'redis mock' });
sinon.stub(kafkaAdapter, 'execute').resolves({ result: 'kafka mock' });
sinon.stub(ethereumAdapter, 'execute').resolves({ result: 'ethereum mock' });
sinon.stub(hederaAdapter, 'execute').resolves({ result: 'hedera mock' });
sinon.stub(hyperledgerAdapter, 'execute').resolves({ result: 'hyperledger mock' });
sinon.stub(dbAdapter, 'execute').callsFake((type) => {
  return Promise.resolve({ operation: type, success: true });
});

// Now import sqlInterpreter after mocking the adapters
const sqlInterpreter = require('../sqlvm/sqlInterpreter');

async function testSqlInterpreter() {
  try {
    console.log('=== Testing DML Statements ===');
    
    // Test SELECT
    console.log('\nTesting SELECT query...');
    const selectResult = await sqlInterpreter.execute('SELECT * FROM test', 'sqlite');
    console.log('SELECT result:', selectResult);

    // Test INSERT
    console.log('\nTesting INSERT query...');
    const insertResult = await sqlInterpreter.execute(
      "INSERT INTO test VALUES('SQL Interpreter Test', 456)",
      'sqlite'
    );
    console.log('INSERT result:', insertResult);

    // Test UPDATE
    console.log('\nTesting UPDATE query...');
    const updateResult = await sqlInterpreter.execute(
      "UPDATE test SET value = 'Updated Value' WHERE id = 1",
      'sqlite'
    );
    console.log('UPDATE result:', updateResult);

    // Test DELETE
    console.log('\nTesting DELETE query...');
    const deleteResult = await sqlInterpreter.execute(
      "DELETE FROM test WHERE id = 1",
      'sqlite'
    );
    console.log('DELETE result:', deleteResult);

    console.log('\n=== Testing DDL Statements ===');
    
    // Test CREATE TABLE
    console.log('\nTesting CREATE TABLE query...');
    const createTableResult = await sqlInterpreter.execute(
      "CREATE TABLE new_table (id INT PRIMARY KEY, name VARCHAR(255))",
      'sqlite'
    );
    console.log('CREATE TABLE result:', createTableResult);

    // Test ALTER TABLE
    console.log('\nTesting ALTER TABLE query...');
    const alterTableResult = await sqlInterpreter.execute(
      "ALTER TABLE test ADD COLUMN new_column VARCHAR(255)",
      'sqlite'
    );
    console.log('ALTER TABLE result:', alterTableResult);

    // Test DROP TABLE
    console.log('\nTesting DROP TABLE query...');
    const dropTableResult = await sqlInterpreter.execute(
      "DROP TABLE IF EXISTS temp_table",
      'sqlite'
    );
    console.log('DROP TABLE result:', dropTableResult);

    console.log('\n=== Testing DCL Statements ===');
    
    // Test GRANT
    console.log('\nTesting GRANT query...');
    const grantResult = await sqlInterpreter.execute(
      "GRANT SELECT, INSERT ON test TO user1, user2",
      'sqlite'
    );
    console.log('GRANT result:', grantResult);

    // Test REVOKE
    console.log('\nTesting REVOKE query...');
    const revokeResult = await sqlInterpreter.execute(
      "REVOKE SELECT ON test FROM user1",
      'sqlite'
    );
    console.log('REVOKE result:', revokeResult);

    console.log('\n=== Testing TCL Statements ===');
    
    // Test BEGIN TRANSACTION
    console.log('\nTesting BEGIN TRANSACTION query...');
    const beginResult = await sqlInterpreter.execute(
      "BEGIN TRANSACTION",
      'sqlite'
    );
    console.log('BEGIN TRANSACTION result:', beginResult);

    // Test COMMIT
    console.log('\nTesting COMMIT query...');
    const commitResult = await sqlInterpreter.execute(
      "COMMIT",
      'sqlite'
    );
    console.log('COMMIT result:', commitResult);

    // Test ROLLBACK
    console.log('\nTesting ROLLBACK query...');
    const rollbackResult = await sqlInterpreter.execute(
      "ROLLBACK",
      'sqlite'
    );
    console.log('ROLLBACK result:', rollbackResult);

    // Test SAVEPOINT
    console.log('\nTesting SAVEPOINT query...');
    const savepointResult = await sqlInterpreter.execute(
      "SAVEPOINT my_savepoint",
      'sqlite'
    );
    console.log('SAVEPOINT result:', savepointResult);

    console.log('\nAll SQL interpreter tests completed successfully!');
  } catch (error) {
    console.error('SQL interpreter test failed:', error);
  } finally {
    // Restore all stubs
    sinon.restore();
  }
}

testSqlInterpreter();