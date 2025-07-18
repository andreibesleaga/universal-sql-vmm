/**
 * Test runner script
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
if (!fs.existsSync(path.join(__dirname, 'logs'))) {
  fs.mkdirSync(path.join(__dirname, 'logs'));
}

// Ensure wallet directory exists
if (!fs.existsSync(path.join(__dirname, 'wallet'))) {
  fs.mkdirSync(path.join(__dirname, 'wallet'));
}

// Run tests
console.log('Running unit tests...');
try {
  execSync('npx mocha test/unit/**/*.test.js --timeout 5000', { stdio: 'inherit' });
  console.log('Unit tests passed!');
} catch (error) {
  console.error('Unit tests failed!');
  process.exit(1);
}

console.log('\nRunning integration tests...');
try {
  execSync('npx mocha test/integration/**/*.test.js --timeout 5000', { stdio: 'inherit' });
  console.log('Integration tests passed!');
} catch (error) {
  console.error('Integration tests failed!');
  process.exit(1);
}

console.log('\nAll tests passed!');