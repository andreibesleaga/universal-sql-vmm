const request = require('supertest');
const { expect } = require('chai');
const sinon = require('sinon');
const express = require('express');
const bodyParser = require('body-parser');
const { validateToken, validateInput } = require('../../security');
const sqlInterpreter = require('../../sqlvm/sqlInterpreter');

// Create a test app that mimics the main app
const createTestApp = () => {
  const app = express();
  app.use(bodyParser.json());
  
  // JWT Authentication Middleware
  const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).send({ error: 'Unauthorized' });

    try {
      const decoded = validateToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).send({ error: 'Invalid token' });
    }
  };
  app.use(authenticate);

  // SQL Execution Endpoint
  app.post('/execute', async (req, res) => {
    const { sql, adapter, options } = req.body;
    if (!sql || !adapter) return res.status(400).send({ error: 'SQL and adapter are required.' });
    
    try {
      validateInput(sql, adapter);
      const result = await sqlInterpreter.execute(sql, adapter, options || { timeout: 5000 });
      res.status(200).send(result);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
  
  return app;
};

describe('REST API Integration', () => {
  let app;
  let executeStub;
  let token;
  
  beforeEach(() => {
    // Create a test token
    token = 'Bearer ' + require('../../security').appToken();
    
    // Stub the sqlInterpreter.execute method
    executeStub = sinon.stub(sqlInterpreter, 'execute');
    executeStub.resolves({ result: 'success' });
    
    // Create the test app
    app = createTestApp();
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  it('should respond to SQL queries', async () => {
    const res = await request(app)
      .post('/execute')
      .set('Authorization', token)
      .send({
        sql: "SELECT value, key FROM test WHERE key > 30",
        adapter: "database",
      });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('result', 'success');
    expect(executeStub.calledOnce).to.be.true;
  });

  it('should return 400 for missing SQL parameters', async () => {
    const res = await request(app)
      .post('/execute')
      .set('Authorization', token)
      .send({ adapter: 'database' });

    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error');
  });

  it('should return 401 for unauthorized access', async () => {
    const res = await request(app)
      .post('/execute')
      .set('Authorization', 'InvalidToken')
      .send({
        sql: "SELECT * FROM test",
        adapter: "database",
      });

    expect(res.status).to.equal(401);
  });
  
  it('should return 500 for SQL execution errors', async () => {
    executeStub.rejects(new Error('SQL execution failed'));
    
    const res = await request(app)
      .post('/execute')
      .set('Authorization', token)
      .send({
        sql: "SELECT * FROM test",
        adapter: "database",
      });

    expect(res.status).to.equal(500);
    expect(res.body).to.have.property('error', 'SQL execution failed');
  });
});