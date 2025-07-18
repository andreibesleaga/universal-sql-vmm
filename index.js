const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const { startGRPCServer } = require('./grpc/grpcServer');
const { startMQTTServer } = require('./mqtt/mqttServer');
const { startWebSocketServer } = require('./websocket/websocketServer');
const { validateToken } = require('./security');
const morgan = require('morgan');
const logger = require('./logger');
const sqlInterpreter = require('./sqlvm/sqlInterpreter');

// Import new utilities
const { handleError, ErrorTypes, AppError } = require('./utils/errorHandler');
const { validateRequest } = require('./utils/validator');
const { sanitizeRequest } = require('./security/sanitizer');
const { apiLimiter, authLimiter } = require('./security/rateLimiter');

require('dotenv').config();

const app = express();
app.use(morgan('combined', { stream: logger.stream }));
app.use(bodyParser.json({ limit: '1mb' })); // Limit payload size
app.use(helmet());

// Apply rate limiting to all requests
app.use(apiLimiter);

// Apply stricter rate limiting to auth endpoints
app.use('/auth', authLimiter);

// Global error handler
app.use((err, req, res, next) => {
  handleError(err, req, res);
});

// JWT Authentication Middleware
const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return next(new AppError('Authentication token is required', ErrorTypes.AUTHENTICATION));
    }

    try {
        const decoded = validateToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        next(new AppError('Invalid authentication token', ErrorTypes.AUTHENTICATION));
    }
};

// Health Check - no auth required
app.get('/health', (req, res) => res.status(200).send({ status: 'OK', timestamp: new Date().toISOString() }));

// Apply authentication to all routes except health check
app.use('/execute', authenticate);

// SQL Execution Endpoint
app.post('/execute', async (req, res, next) => {
    try {
        const { sql, adapter, options } = req.body;
        
        // Validate request parameters
        validateRequest({ sql, adapter, options });
        
        // Sanitize input
        const sanitized = sanitizeRequest({ sql, adapter, options: options || { timeout: 5000 } });
        
        logger.info('Executing SQL', { sql: sanitized.sql, adapter: sanitized.adapter });
        const result = await sqlInterpreter.execute(sanitized.sql, sanitized.adapter, sanitized.options);
        res.status(200).send(result);
    } catch (error) {
        next(error); // Pass to error handler
    }
});

// Import HTTPS server utility
const { createHttpsServer, generateSelfSignedCerts } = require('./utils/httpsServer');

// Start Servers
const PORT = process.env.PORT || 3000;
let server;

// Use HTTPS in production
if (process.env.NODE_ENV === 'production' && process.env.USE_HTTPS === 'true') {
  try {
    // Create HTTPS server
    server = createHttpsServer(app);
    logger.info('HTTPS server started in production mode');
  } catch (error) {
    logger.error('Failed to start HTTPS server, falling back to HTTP', { error: error.message });
    server = app.listen(PORT, () => logger.info(`HTTP server running on port ${PORT} (HTTPS failed)`));
  }
} else {
  // Use HTTP in development
  server = app.listen(PORT, () => logger.info(`HTTP server running on port ${PORT}`));
}

const grpcServer = startGRPCServer();
const mqttServer = startMQTTServer();
startWebSocketServer(server);

// Import database adapter for connection pool management
const dbAdapter = require('./adapters/dbAdapter');

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Set a timeout for shutdown (30 seconds)
  const shutdownTimeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 30000);
  
  try {
    // Close HTTP/HTTPS server
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
        logger.info('HTTP/HTTPS server closed');
      });
    }
    
    // Close gRPC server
    if (grpcServer) {
      await new Promise((resolve) => {
        grpcServer.tryShutdown(resolve);
        logger.info('gRPC server closed');
      });
    }
    
    // Close MQTT server
    if (mqttServer) {
      await new Promise((resolve) => {
        mqttServer.close(resolve);
        logger.info('MQTT server closed');
      });
    }
    
    // Close database connection pools
    await dbAdapter.closeAllPools();
    logger.info('Database connection pools closed');
    
    // Clear the shutdown timeout
    clearTimeout(shutdownTimeout);
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during graceful shutdown', { error: error.message });
    process.exit(1);
  }
};

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

logger.info('Universal SQL VMM started successfully');
