const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const sqlInterpreter = require('../sqlvm/sqlInterpreter');
const logger = require('../logger');
const security = require('../security');

// Load gRPC service definition
const PROTO_PATH = __dirname + '/sql_service.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {});
const sqlProto = grpc.loadPackageDefinition(packageDefinition);

/**
 * Middleware to authenticate gRPC requests.
 * Validates the JWT from metadata.
 */
const authenticate = (call, next) => {
    try {
        const metadata = call.metadata.get('authorization');
        if (!metadata || metadata.length === 0) {
            throw new Error('Missing authorization token');
        }

        const token = metadata[0];
        const decoded = security.validateToken(token);
        call.request.user = decoded; // Attach user info to the request
        next();
    } catch (error) {
        logger.error('Authentication failed', { error: error.message });
        const authError = new Error('Authentication failed');
        authError.code = grpc.status.UNAUTHENTICATED;
        next(authError);
    }
};

/**
 * Executes SQL queries after authentication.
 */
const executeSQL = async (call, callback) => {
    try {
        logger.info('Executing SQL', { sql: call.request.sql, adapter: call.request.adapter });

        const result = await sqlInterpreter.execute(call.request.sql, call.request.adapter, {});
        callback(null, { result: JSON.stringify(result) });
    } catch (error) {
        logger.error('SQL execution failed', { error: error.message });
        callback(null, { error: error.message });
    }
};

/**
 * Middleware-enabled gRPC server.
 */
const startGRPCServer = () => {
    const server = new grpc.Server();

    // Add middleware for authentication
    const authenticatedExecuteSQL = (call, callback) =>
        authenticate(call, (err) => {
            if (err) {
                callback(err, null);
            } else {
                security.validateInput(call.request.sql, call.request.adapter);
                executeSQL(call, callback);
            }
        });

    server.addService(sqlProto.SQLService.service, { Execute: authenticatedExecuteSQL });

    server.bindAsync('0.0.0.0:50051', grpc.ServerCredentials.createInsecure(), () => {
        logger.info('gRPC server running on port 50051');
        server.start();
    });
};

module.exports = { startGRPCServer };
