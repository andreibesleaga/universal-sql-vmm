const { expect } = require('chai');
const mqtt = require('mqtt');
const jwt = require('jsonwebtoken');
const { appToken, getSecret } = require('../../security');

describe('MQTT Integration Tests with Authentication', function () {
    this.timeout(5000); // Extend timeout for async operations

    const brokerUrl = 'mqtt://localhost:1883'; // Replace with your broker URL if needed
    const requestTopic = 'sql/request';
    const responseTopic = 'sql/response';

    const secretKey = getSecret(); //'your-secret-key'; // Ensure this matches the server's secret
    const validToken = appToken(); // jwt.sign({ user: 'test-user' }, secretKey, { expiresIn: '1h' }); // Generate a valid JWT
    const invalidToken = 'invalid-token';

    let client;

    beforeEach((done) => {
        // Connect to MQTT broker with valid token in `auth`
        client = mqtt.connect(brokerUrl, {
            username: 'user', // Optional, if required by the broker
            password: validToken, // Send token in the password/auth field
        });

        client.on('connect', () => {
            console.log('Connected to MQTT broker');
            client.subscribe(responseTopic, (err) => {
                if (err) done(err);
                done();
            });
        });

        client.on('error', (err) => {
            done(err);
        });
    });

    afterEach(() => {
        client.end(); // Close the MQTT connection
    });

    it('should handle a valid SELECT query with authentication', (done) => {
        const query = {
            sql: "SELECT value, key FROM test WHERE key > 30",
            adapter: "database",
        };

        client.once('message', (topic, message) => {
            expect(topic).to.equal(responseTopic);

            const response = JSON.parse(message.toString());
            expect(response).to.have.property('result');
            expect(response.result).to.be.an('array'); // Assuming the database returns an array
            done();
        });

        // Publish the query
        client.publish(requestTopic, JSON.stringify(query));
    });

    it('should reject an invalid token during connection', (done) => {
        const invalidClient = mqtt.connect(brokerUrl, {
            username: 'user',
            password: invalidToken, // Send an invalid token
        });

        invalidClient.on('connect', () => {
            done(new Error('Should not connect with an invalid token'));
        });

        invalidClient.on('error', (err) => {
            expect(err.message).to.include('Not authorized'); // Ensure broker rejects the connection
            invalidClient.end();
            done();
        });
    });

    it('should handle an invalid SQL query gracefully', (done) => {
        const invalidQuery = {
            sql: "",
            adapter: "unknown",
        };

        client.once('message', (topic, message) => {
            expect(topic).to.equal(responseTopic);

            const response = JSON.parse(message.toString());
            expect(response).to.have.property('error');
            expect(response.error).to.be.a('string');
            done();
        });

        // Publish the invalid query
        client.publish(requestTopic, JSON.stringify(invalidQuery));
    });
});
