const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { startGRPCServer } = require('./grpc/grpcServer');
const { startMQTTServer } = require('./mqtt/mqttServer');
const { startWebSocketServer } = require('./websocket/websocketServer');
const {validateToken, validateInput} = require('./security');
const morgan = require('morgan');
const logger = require('./logger');
const sqlInterpreter = require('./sqlvm/sqlInterpreter');

require('dotenv').config();

const app = express();
app.use(morgan('combined', { stream: logger.stream }));
app.use(bodyParser.json());
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.',
});
app.use(limiter);

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

// Health Check
app.get('/health', (req, res) => res.status(200).send({ status: 'OK' }));

// SQL Execution Endpoint
app.post('/execute', async (req, res) => {
    const { sql, adapter, options } = req.body;
    if (!sql || !adapter) return res.status(400).send({ error: 'SQL and adapter are required.' });
    
    validateInput(sql, adapter);

    try {
        logger.info('Executing SQL', { sql, adapter });
        const result = await sqlInterpreter.execute(sql, adapter, options || { timeout: 5000 });
        res.status(200).send(result);
    } catch (error) {
        logger.error('SQL Execution failed', { error: error.message });
        res.status(500).send({ error: error.message });
    }
});

// Start Servers
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => logger.info(`REST server running on port ${PORT}`));
startGRPCServer();
startMQTTServer();
startWebSocketServer(server);
