/**
 * Load testing script using autocannon
 * 
 * To run this test:
 * 1. Start the server: npm start
 * 2. Run this script: node test/load/loadTest.js
 */
const autocannon = require('autocannon');
const { appToken } = require('../../security');

// Generate a valid token for testing
const token = appToken();

// Define test scenarios
const scenarios = [
  {
    name: 'SELECT Query',
    method: 'POST',
    path: '/execute',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      sql: 'SELECT * FROM test',
      adapter: 'sqlite'
    })
  },
  {
    name: 'INSERT Query',
    method: 'POST',
    path: '/execute',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      sql: 'INSERT INTO test (value, key) VALUES ("Load Test", 999)',
      adapter: 'sqlite'
    })
  }
];

// Run load tests for each scenario
async function runLoadTests() {
  for (const scenario of scenarios) {
    console.log(`Running load test for: ${scenario.name}`);
    
    const result = await autocannon({
      url: 'http://localhost:3000',
      connections: 10,
      pipelining: 1,
      duration: 10,
      requests: [
        {
          method: scenario.method,
          path: scenario.path,
          headers: scenario.headers,
          body: scenario.body
        }
      ]
    });
    
    console.log('='.repeat(50));
    console.log(`Results for: ${scenario.name}`);
    console.log('-'.repeat(50));
    console.log(`Latency (ms):`);
    console.log(`  Avg: ${result.latency.average}`);
    console.log(`  Min: ${result.latency.min}`);
    console.log(`  Max: ${result.latency.max}`);
    console.log(`  p99: ${result.latency.p99}`);
    
    console.log(`Requests/sec: ${result.requests.average}`);
    console.log(`Throughput: ${result.throughput.average} bytes/sec`);
    console.log(`Errors: ${result.errors}`);
    console.log(`Non-2xx responses: ${result.non2xx}`);
    console.log('='.repeat(50));
    console.log();
  }
}

// Run the tests
runLoadTests().catch(console.error);