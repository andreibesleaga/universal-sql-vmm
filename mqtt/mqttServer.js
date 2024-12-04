const mqtt = require('mqtt');
const sqlInterpreter = require('../sqlvm/sqlInterpreter');
const logger = require('../logger');
const {validateInput, validateToken} = require('../security');

const startMQTTServer = () => {
    const client = mqtt.connect('mqtt://localhost');
    client.on('connect', (connack) => {
        if (!validateToken(connack.auth)) {
            logger.warn('MQTT: Unauthorized Access');
            client.end();
        }
        logger.info('MQTT server connected');
        client.subscribe('sql/request');
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
};

module.exports = {
    startMQTTServer
};