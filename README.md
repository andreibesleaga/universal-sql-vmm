# Universal SQL Virtual Machine Microservice Gateway

This project provides a microservice with SQL-like operations emulated across multiple backend adapters storages, via different access interfaces.

## Project Summary

This project is a microservice designed to execute SQL-like operations across multiple backends (traditional databases, Redis, Kafka, and blockchain platforms such as Hedera Hashgraph and Hyperledger Fabric).
The service provides a unified interface for handling SQL queries and supports multiple access protocols (via REST, gRPC, WebSocket, MQTT), ensuring versatility and ease of integration.

## Key Features

1. **Multi-Backend SQL Execution**

The microservice routes SQL queries to different backends based on the adapter specified in the request. Supported backends include:

- Relational Databases (e.g., SQLite, MySQL, PostgreSQL) using knex.
- Redis for key-value store emulation.
- Kafka for publish-subscribe messaging with SQL-like operations.
- Hedera Hashgraph for ledger-based SQL operations via smart contracts.
- Hyperledger Fabric for distributed ledger operations using chaincode.
- Ethereum chain for distributed ledger operations using chaincode smart contracts.

2. **Protocol Support**
The service supports multiple communication protocols interfaces, to be accessed from:

- REST API: Accessible via HTTP endpoints.
- gRPC: High-performance, secure communication with authentication via metadata.
- WebSockets: Real-time, bidirectional communication for SQL execution.
- MQTT: Lightweight messaging protocol for IoT and pub/sub applications.

3. **Security**
- JWT Authentication: Ensures secure access to all interfaces (REST, gRPC, WebSocket, MQTT).
- Input Validation: Validates SQL queries and adapter specifications to prevent injection attacks.
- Rate Limiting: Limits the number of requests per client to prevent abuse.
- Encryption: Option to use HTTPS/TLS for REST, gRPC, and WebSocket protocols.

4. **SQL Parsing**
- Uses node-sql-parser library for accurate parsing of SQL queries into structured Abstract Syntax Trees (AST).
- Supports SQL operations (depending on backend adapter used)


5. **Logging and Monitoring**
- Centralized logging with Winston for tracking requests, responses, and errors.
- Separate log files for combined logs (combined.log) and errors (error.log).

6. **Extensibility**
- Modular architecture enables the addition of new adapters or backends with minimal effort.
- Easily extendable to support additional SQL operations or protocols.

## Security Features

1. **JWT Authentication**
   - Secure JWT token generation and validation
   - Environment variable based secret management
   - Token expiration and rotation support

2. **HTTPS Support**
   - Production-ready HTTPS server configuration
   - Self-signed certificate generation for development
   - Automatic fallback to HTTP if HTTPS fails

3. **Input Validation and Sanitization**
   - SQL query validation to prevent injection attacks
   - Input sanitization to prevent XSS attacks
   - Parameter validation for all API endpoints

4. **Rate Limiting**
   - Configurable rate limiting for all endpoints
   - Stricter rate limiting for authentication endpoints
   - Protection against brute force attacks

## Installation and Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/universal-sql-vmm.git
cd universal-sql-vmm
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Initialize the database:
```bash
node migrations/initDb.js
```

5. Start the server:
```bash
# Development mode
npm run dev

# Production mode
NODE_ENV=production npm start
```

## HTTPS Configuration

To enable HTTPS in production:

1. Set the following environment variables in your `.env` file:
```
NODE_ENV=production
USE_HTTPS=true
HTTPS_PORT=3443
HTTPS_KEY_PATH=/path/to/key.pem
HTTPS_CERT_PATH=/path/to/cert.pem
```

2. Generate SSL certificates:
   - For production, use certificates from a trusted CA
   - For development/testing, you can generate self-signed certificates:
   ```bash
   mkdir -p certs
   openssl genrsa -out certs/key.pem 2048
   openssl req -new -key certs/key.pem -out certs/csr.pem -subj "/CN=localhost/O=Universal SQL VMM/C=US"
   openssl x509 -req -days 365 -in certs/csr.pem -signkey certs/key.pem -out certs/cert.pem
   ```

## JWT Configuration

For secure JWT authentication:

1. Set the following environment variables in your `.env` file:
```
JWT_SECRET=your-secure-random-secret
JWT_EXPIRATION=1h
```

2. Generate a secure random secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## API Usage

### REST API

```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "sql": "SELECT * FROM users",
    "adapter": "database"
  }'
```

### WebSocket

Connect to `ws://localhost:3000` and send:

```json
{
  "sql": "SELECT * FROM users",
  "adapter": "database"
}
```

### gRPC

Use a gRPC client to connect to `localhost:50051` and call the `Execute` method.

### MQTT

Publish to the `sql/request` topic and subscribe to `sql/response`.

## Testing

Run tests:

```bash
# Run all tests
npm run test:all

# Run specific tests
npm run test:unit
npm run test:integration
npm run test:functional
npm run test:sql
npm run test:sql:comprehensive
npm run test:load
npm run test:e2e
```

## Recent Updates

### Performance Optimizations

1. **Connection Pooling**
   - Implemented database connection pooling
   - Configurable pool size and timeout settings
   - Improved connection reuse and reliability

2. **Query Caching**
   - Added caching for frequent SQL queries
   - Configurable TTL and cache size
   - Cache statistics for monitoring

3. **Timeout Management**
   - Configurable timeouts for all external services
   - Environment variable based configuration
   - Graceful error handling for timeouts

### Deployment Options

1. **Docker Support**
   - Dockerfile for containerization
   - docker-compose.yml for local deployment
   - Multi-stage builds for smaller images

2. **Kubernetes Deployment**
   - Deployment, Service, and Ingress configurations
   - ConfigMaps and Secrets for configuration
   - Horizontal Pod Autoscaler for scaling

3. **Cloud Deployment Guides**
   - AWS (ECS, EKS) deployment instructions
   - Azure (ACI, AKS) deployment instructions
   - Google Cloud (Cloud Run, GKE) deployment instructions

### Security Enhancements

1. **Enhanced JWT Security**
   - Proper JWT secret management with environment variables
   - Secure token generation and validation
   - Token expiration and rotation support

2. **Improved Error Handling**
   - Centralized error handling system
   - Typed errors for better categorization
   - Consistent error responses across all interfaces

3. **Enhanced Input Validation**
   - Comprehensive SQL validation
   - Input sanitization for all parameters
   - Protection against SQL injection and XSS attacks

### Infrastructure Improvements

1. **HTTPS Support**
   - Production-ready HTTPS server
   - Self-signed certificate generation for development
   - Automatic fallback to HTTP if HTTPS fails

2. **Comprehensive Testing**
   - Unit tests for all components
   - Integration tests for interfaces
   - End-to-end tests with real services
   - Load testing for performance validation

3. **Documentation**
   - Architecture diagrams and explanations
   - Security documentation
   - Production readiness checklist
   - Deployment guides for various environments

## Architecture

For detailed architecture information, including component diagrams and explanations, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Production Readiness

For a checklist of items to ensure production readiness, see [PRODUCTION.md](PRODUCTION.md).

## Security

For detailed security information, see [SECURITY.md](SECURITY.md).

## Deployment

For detailed deployment instructions for Docker, Kubernetes, and cloud environments, see [DEPLOYMENT.md](DEPLOYMENT.md).

## License

Apache License 2.0 - See [LICENSE](LICENSE) for details.