const kafka = require('kafka-node');
const logger = require('../logger');

const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const producer = new kafka.Producer(client);
const consumer = new kafka.Consumer(client, [], { autoCommit: true });

const execute = async (type, topic, columns, values, where) => {
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
};

module.exports = { execute };
