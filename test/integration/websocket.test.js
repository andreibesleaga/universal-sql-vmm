const WebSocket = require('ws');
const { expect } = require('chai');

describe('WebSocket API Integration', () => {
    let ws;

    before((done) => {
        ws = new WebSocket('ws://localhost:3000');
        ws.on('open', done);
    });

    after(() => {
        ws.close();
    });

    it('should respond to SQL queries', (done) => {
        ws.send(
            JSON.stringify({ sql: "SELECT * FROM users", adapter: "database" })
        );

        ws.on('message', (message) => {
            const response = JSON.parse(message);
            expect(response).to.have.property('result');
            done();
        });
    });

    it('should handle errors gracefully', (done) => {
        ws.send(JSON.stringify({ sql: "", adapter: "unknown" }));

        ws.on('message', (message) => {
            const response = JSON.parse(message);
            expect(response).to.have.property('error');
            done();
        });
    });
});
