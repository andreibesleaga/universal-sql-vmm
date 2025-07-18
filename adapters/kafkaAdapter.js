const kafka = require('kafka-node');
const logger = require('../logger');

let client, producer, consumer;

// Use mock Kafka client in test mode
if (process.env.TEST_MODE === 'true') {
    client = { on: () => {} };
    producer = {
        send: (payload, callback) => callback(null, { status: 'success' }),
        on: () => {}
    };
    consumer = {
        addTopics: (topics, callback) => callback(null),
        on: (event, callback) => {
            if (event === 'message') {
                // Simulate a message after a short delay
                setTimeout(() => {
                    callback({ value: JSON.stringify({ data: 'test' }) });
                }, 10);
            }
        }
    };
    logger.info('Using mock Kafka client in test mode');
} else {
    try {
        client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_HOST || 'localhost:9092' });
        producer = new kafka.Producer(client);
        consumer = new kafka.Consumer(client, [], { autoCommit: true });
        
        producer.on('error', (error) => {
            logger.error('Kafka producer error', { error: error.message });
        });
        
        consumer.on('error', (error) => {
            logger.error('Kafka consumer error', { error: error.message });
        });
    } catch (error) {
        logger.error('Kafka initialization failed', { error: error.message });
    }
}

const execute = async (type, topic, columns, values, where) => {
    try {
        if (!client || !producer || !consumer) {
            throw new Error('Kafka is not properly initialized');
        }
        
        logger.info(`Executing Kafka operation: ${type} on topic: ${topic}`, { columns, values, where });

        switch (type) {
        case 'insert':
            const payload = { topic, messages: JSON.stringify(values) };
            return new Promise((resolve, reject) => {
                producer.send([payload], (err, data) => {
                    if (err) {
                        logger.error(`Kafka publish failed`, { error: err.message });
                        reject(err);
                    } else {
                        logger.info(`Kafka publish successful`, { data });
                        resolve(data);
                    }
                });
            });
        case 'select':
            return new Promise((resolve) => {
                consumer.addTopics([topic], () => {
                    consumer.on('message', (message) => {
                        if (matchesFilter(message, where)) {
                            logger.info(`Kafka message consumed`, { message });
                            resolve(message);
                        }
                    });
                });
            });
        case 'delete':
            logger.warn('Kafka delete is not supported.');
            throw new Error('Kafka delete is not natively supported.');
        default:
            logger.error(`Unsupported Kafka operation: ${type}`);
            throw new Error(`Unsupported Kafka operation: ${type}`);
    }
    } catch (error) {
        logger.error(`Kafka operation failed: ${type}`, { error: error.message });
        throw error;
    }
};

module.exports = { execute };
