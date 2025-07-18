const mqtt = require('mqtt');
const sqlInterpreter = require('../sqlvm/sqlInterpreter');
const logger = require('../logger');
const {validateInput, validateToken} = require('../security');

const startMQTTServer = () => {
    try {
        // Use mock MQTT client in test mode
        const client = process.env.TEST_MODE === 'true' 
            ? { 
                on: (event, callback) => {
                    if (event === 'connect') {
                        callback(true);
                    }
                },
                subscribe: () => {},
                publish: () => {},
                end: () => {},
                close: (callback) => { if (callback) callback(); }
            } 
            : mqtt.connect('mqtt://localhost');

        client.on('connect', (connack) => {
            if (!(connack)) {
                logger.warn('MQTT: Unauthorized Access');
                client.end();
                return;
            }
            logger.info('MQTT server connected');
            client.subscribe('sql/request');
        });
        
        client.on('error', (error) => {
            logger.error('MQTT connection error', { error: error.message });
        });
        
        client.on('close', () => {
            logger.info('MQTT connection closed');
        });
        
        // Return client instance for graceful shutdown
        return client;

    client.on('client-auth', (client, auth, callback) => {
        try {
            const token = auth.password.toString();
            const decoded = validateToken(token);
            logger.info('MQTT: Authentication successful', { user: decoded.user });
            callback(null, true); // Accept the client connection
        } catch (error) {
            logger.error('MQTT: Authentication failed', { error: error.message });
            callback(new Error('Not authorized'), false); // Reject the connection
        }
    });

    client.on('message', async (topic, message) => {
        logger.info('MQTT: Incoming Request', {
            topic,
            message
        });
        try {
            const {
                sql,
                adapter,
                options
            } = JSON.parse(message.toString());
            
            validateInput(sql, adapter);
            
            const result = await sqlInterpreter.execute(sql, adapter, options || {});
            logger.info('MQTT: Execution Successful', {
                topic,
                sql,
                result
            });
            client.publish('sql/response', JSON.stringify({
                result
            }));
        } catch (error) {
            logger.error('MQTT: Execution Failed', {
                topic,
                error: error.message
            });
            client.publish('sql/response', JSON.stringify({
                error: error.message
            }));
        }
    });
    } catch (error) {
        logger.error('MQTT server initialization failed', { error: error.message });
    }
};

module.exports = {
    startMQTTServer
};