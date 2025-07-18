/**
 * Functional test runner script
 * This script runs the functional tests with mocks enabled
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Set TEST_MODE environment variable
process.env.TEST_MODE = 'true';

// Ensure logs directory exists
if (!fs.existsSync(path.join(__dirname, 'logs'))) {
  fs.mkdirSync(path.join(__dirname, 'logs'));
}

// Ensure wallet directory exists
if (!fs.existsSync(path.join(__dirname, 'wallet'))) {
  fs.mkdirSync(path.join(__dirname, 'wallet'));
}

// Run functional tests
console.log('Running setup test...');
try {
  execSync('node test-setup.js', { stdio: 'inherit' });
  console.log('Setup test passed!');
} catch (error) {
  console.error('Setup test failed!');
  process.exit(1);
}

console.log('\nRunning database test...');
try {
  execSync('node test-db.js', { stdio: 'inherit' });
  console.log('Database test passed!');
} catch (error) {
  console.error('Database test failed!');
  process.exit(1);
}

console.log('\nRunning SQL interpreter test...');
try {
  execSync('node test-sql.js', { stdio: 'inherit' });
  console.log('SQL interpreter test passed!');
} catch (error) {
  console.error('SQL interpreter test failed!');
  process.exit(1);
}

console.log('\nAll functional tests passed!');