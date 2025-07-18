const WebSocket = require('ws');
const { expect } = require('chai');
const sinon = require('sinon');
const http = require('http');
const { validateToken, validateInput } = require('../../security');
const sqlInterpreter = require('../../sqlvm/sqlInterpreter');
const { startWebSocketServer } = require('../../websocket/websocketServer');

describe('WebSocket Integration Tests', function () {
  let server;
  let executeStub;
  let token;
  const PORT = 8080;
  
  beforeEach((done) => {
    // Create a test token
    token = require('../../security').appToken();
    
    // Stub the sqlInterpreter.execute method
    executeStub = sinon.stub(sqlInterpreter, 'execute');
    executeStub.resolves({ result: 'success' });
    
    // Create HTTP server and start WebSocket server
    server = http.createServer();
    startWebSocketServer(server);
    server.listen(PORT, () => done());
  });
  
  afterEach((done) => {
    sinon.restore();
    server.close(() => done());
  });
  
  it('should handle a valid SQL query with authentication', (done) => {
    const ws = new WebSocket(`ws://localhost:${PORT}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    ws.on('open', () => {
      const query = {
        sql: "SELECT value, key FROM users WHERE key > 30",
        adapter: "database",
      };
      ws.send(JSON.stringify(query));
    });
    
    ws.on('message', (message) => {
      const response = JSON.parse(message);
      expect(response).to.have.property('result', 'success');
      expect(executeStub.calledOnce).to.be.true;
      ws.close();
      done();
    });
    
    ws.on('error', (error) => {
      done(error);
    });
  });
  
  it('should reject an invalid token during connection', (done) => {
    const ws = new WebSocket(`ws://localhost:${PORT}`, {
      headers: { Authorization: 'InvalidToken' }
    });
    
    ws.on('open', () => {
      done(new Error('Should not connect with an invalid token'));
    });
    
    ws.on('error', () => {
      // Expected error
      done();
    });
  });
  
  it('should handle SQL execution errors gracefully', (done) => {
    executeStub.rejects(new Error('SQL execution failed'));
    
    const ws = new WebSocket(`ws://localhost:${PORT}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    ws.on('open', () => {
      const query = {
        sql: "SELECT * FROM users",
        adapter: "database",
      };
      ws.send(JSON.stringify(query));
    });
    
    ws.on('message', (message) => {
      const response = JSON.parse(message);
      expect(response).to.have.property('error', 'SQL execution failed');
      ws.close();
      done();
    });
    
    ws.on('error', (error) => {
      done(error);
    });
  });
});