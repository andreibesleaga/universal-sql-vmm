const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Check if logs directory exists
if (!fs.existsSync(path.join(__dirname, 'logs'))) {
  console.error('Logs directory is missing!');
  process.exit(1);
}

// Check if .env file exists
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.error('.env file is missing!');
  process.exit(1);
}

// Check if wallet directory exists
if (!fs.existsSync(path.join(__dirname, 'wallet'))) {
  console.error('Wallet directory is missing!');
  process.exit(1);
}

// Check if connection.json exists
if (!fs.existsSync(path.join(__dirname, 'connection.json'))) {
  console.error('connection.json is missing!');
  process.exit(1);
}

// Test logger
try {
  logger.info('Logger test successful');
  console.log('Logger test passed');
} catch (error) {
  console.error('Logger test failed:', error);
  process.exit(1);
}

// Test security module
try {
  const security = require('./security');
  const token = security.appToken();
  console.log('Token generation successful');
  
  const decoded = security.validateToken(`Bearer ${token}`);
  console.log('Token validation successful');
  
  const encrypted = security.encrypt({ test: 'data' });
  const decrypted = security.decrypt(encrypted);
  if (decrypted.test !== 'data') {
    throw new Error('Encryption/decryption failed');
  }
  console.log('Encryption/decryption test passed');
} catch (error) {
  console.error('Security module test failed:', error);
  process.exit(1);
}

console.log('All setup tests passed!');