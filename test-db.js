const dbAdapter = require('./adapters/dbAdapter');
const logger = require('./logger');

async function testDatabase() {
  try {
    // Test SELECT
    console.log('Testing SELECT operation...');
    const selectResult = await dbAdapter.execute('select', 'test', ['*'], null, {});
    console.log('SELECT result:', selectResult);

    // Test INSERT
    console.log('\nTesting INSERT operation...');
    const insertResult = await dbAdapter.execute('insert', 'test', ['value', 'key'], { value: 'Test Value', key: 123 });
    console.log('INSERT result:', insertResult);

    // Test SELECT after INSERT
    console.log('\nTesting SELECT after INSERT...');
    const selectAfterInsert = await dbAdapter.execute('select', 'test', ['*'], null, {});
    console.log('SELECT after INSERT result:', selectAfterInsert);

    console.log('\nAll database tests completed successfully!');
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDatabase();