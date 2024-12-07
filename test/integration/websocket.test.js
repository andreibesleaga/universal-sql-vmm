const WebSocket = require('ws');
const { expect } = require('chai');
const jwt = require('jsonwebtoken');
const {appToken, getSecret} = require('../../security');

describe('WebSocket Integration Tests', function () {
    this.timeout(5000); // Extend timeout for async operations

    const serverUrl = 'ws://localhost:3000'; // Replace with your WebSocket server URL
    const secretKey = getSecret(); //'JWT_SECRET'; // Ensure this matches the server's JWT secret
    const validToken = appToken();
    const invalidToken = 'invalid-token';

    let ws;

    afterEach(() => {
        if (ws) ws.close();
    });

    it('should handle a valid SELECT query with authentication', (done) => {
        ws = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${validToken}` },
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
            expect(response).to.have.property('result');
            expect(response.result).to.be.an('array'); // Assuming the database returns an array
            done();
        });

        ws.on('error', (error) => {
            done(error);
        });
    });

    it('should reject an invalid token during connection', (done) => {
        ws = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${invalidToken}` },
        });

        ws.on('open', () => {
            done(new Error('Should not connect with an invalid token'));
        });

        ws.on('error', (error) => {
            expect(error.message).to.include('Unexpected server response: 401'); // Server should return 401
            done();
        });
    });

    it('should handle an invalid SQL query gracefully', (done) => {
        ws = new WebSocket(serverUrl, {
            headers: { Authorization: `Bearer ${validToken}` },
        });

        ws.on('open', () => {
            const invalidQuery = {
                sql: "",
                adapter: "unknown",
            };
            ws.send(JSON.stringify(invalidQuery));
        });

        ws.on('message', (message) => {
            const response = JSON.parse(message);
            expect(response).to.have.property('error');
            expect(response.error).to.be.a('string');
            done();
        });

        ws.on('error', (error) => {
            done(error);
        });
    });
});
