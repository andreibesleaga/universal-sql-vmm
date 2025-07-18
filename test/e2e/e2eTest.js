/**
 * End-to-End tests with real services
 * 
 * This test uses real services that are freely available:
 * - SQLite database (local file)
 * - Redis (using Redis Labs free tier or local Docker)
 * 
 * To run this test:
 * 1. Start the server: npm start
 * 2. Run this script: node test/e2e/e2eTest.js
 */
const axios = require('axios');
const { appToken } = require('../../security');
const assert = require('assert');

// Configuration
const API_URL = 'http://localhost:3000';
const token = appToken();

// Test cases with real services
const testCases = [
  {
    name: 'SQLite SELECT',
    request: {
      sql: 'SELECT * FROM test LIMIT 5',
      adapter: 'sqlite'
    },
    validate: (response) => {
      assert(Array.isArray(response), 'Response should be an array');
      assert(response.length <= 5, 'Should return at most 5 records');
    }
  },
  {
    name: 'SQLite INSERT',
    request: {
      sql: 'INSERT INTO test (value, key) VALUES ("E2E Test", 888)',
      adapter: 'sqlite'
    },
    validate: (response) => {
      assert(Array.isArray(response), 'Response should be an array');
      assert(response.length > 0, 'Should return the inserted ID');
    }
  },
  {
    name: 'Redis SET (emulated as INSERT)',
    request: {
      sql: 'INSERT INTO cache (key, value) VALUES ("test-key", "test-value")',
      adapter: 'redis'
    },
    validate: (response) => {
      assert(response.key === 'cache', 'Should return the key');
      assert(response.data && typeof response.data === 'object', 'Should return data object');
    }
  },
  {
    name: 'Redis GET (emulated as SELECT)',
    request: {
      sql: 'SELECT * FROM cache WHERE key = "test-key"',
      adapter: 'redis'
    },
    validate: (response) => {
      // In test mode, this will return mock data
      assert(response && typeof response === 'object', 'Should return an object');
    }
  }
];

// Run all test cases
async function runE2ETests() {
  console.log('Starting End-to-End tests...');
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    try {
      console.log(`Running test: ${testCase.name}`);
      
      const response = await axios.post(`${API_URL}/execute`, testCase.request, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      testCase.validate(response.data);
      console.log(`✅ Test passed: ${testCase.name}`);
      passed++;
    } catch (error) {
      console.error(`❌ Test failed: ${testCase.name}`);
      if (error.response) {
        console.error(`Status: ${error.response.status}`);
        console.error('Response:', error.response.data);
      } else {
        console.error(error.message);
      }
      failed++;
    }
  }
  
  console.log('\nTest Summary:');
  console.log(`Total: ${testCases.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run the tests
runE2ETests().catch(console.error);