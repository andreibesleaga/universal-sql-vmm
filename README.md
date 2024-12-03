# Universal SQL Virtual Machine Microservice
This project provides SQL-like operations emulated across multiple backend adapters storages via different access interfaces.


### SQL Microservice: Project Summary

This project is a microservice designed to execute SQL-like operations across multiple backends, including traditional databases, Redis, Kafka, and blockchain platforms such as Hedera Hashgraph and Hyperledger Fabric. The service provides a unified interface for handling SQL queries and supports multiple access protocols, ensuring versatility and ease of integration.

### Key Features

1. Multi-Backend SQL Execution

The microservice routes SQL queries to different backends based on the adapter specified in the request. Supported backends include:

- Relational Databases (e.g., SQLite, MySQL, PostgreSQL) using knex.
- Redis for key-value store emulation.
- Kafka for publish-subscribe messaging with SQL-like operations.
- Hedera Hashgraph for ledger-based SQL operations via smart contracts.
- Hyperledger Fabric for distributed ledger operations using chaincode.

2. Protocol Support
The service supports multiple communication protocols:

- REST API: Accessible via HTTP endpoints.
- gRPC: High-performance, secure communication with authentication via metadata.
- WebSockets: Real-time, bidirectional communication for SQL execution.
- MQTT: Lightweight messaging protocol for IoT and pub/sub applications.

3. Security
- JWT Authentication: Ensures secure access to all interfaces (REST, gRPC, WebSocket, MQTT).
- Input Validation: Validates SQL queries and adapter specifications to prevent injection attacks.
- Rate Limiting: Limits the number of requests per client to prevent abuse.
- Encryption: Option to use HTTPS/TLS for REST, gRPC, and WebSocket protocols.

4. SQL Parsing
- Uses node-sql-parser library for accurate parsing of SQL queries into structured Abstract Syntax Trees (AST).
- Supports SQL operations (depending on backend adapter used):
- SELECT
- INSERT
- UPDATE
- DELETE

5. Logging and Monitoring
- Centralized logging with Winston for tracking requests, responses, and errors.
- Separate log files for combined logs (combined.log) and errors (error.log).

6. Extensibility
- Modular architecture enables the addition of new adapters or backends with minimal effort.
- Easily extendable to support additional SQL operations or protocols.


### How It Works

- SQL Query Parsing:
SQL queries are parsed into AST using node-sql-parser.
Extracted details include operation type (e.g., SELECT), target table, columns, values, and conditions.

- Routing:
Based on the specified adapter, the query is routed to the appropriate backend (e.g., database, Redis, Kafka, blockchain).

- Execution:
Each backend has its adapter implementing standard CRUD-like operations (SELECT, INSERT, UPDATE, DELETE).
Response:

- The result is returned to the client in a consistent format.

### Use Cases
1. Distributed SQL Operations
    Perform SQL operations on traditional databases and distributed ledgers with a single interface.
2. Real-Time Applications
    Use WebSockets or MQTT for real-time SQL execution in applications like IoT or chat systems.
3. Blockchain Data Integration
    Integrate SQL queries with blockchain platforms like Hedera and Hyperledger Fabric for immutable, auditable data storage.
4. Caching with Redis
    Store and query frequently accessed data in Redis using SQL-like syntax.
5. Pub/Sub with Kafka
    Emulate SQL-like operations on Kafka topics for messaging-based workflows.

### Technical Stack
Backend Frameworks and Libraries
Express.js: REST API implementation.
gRPC: High-performance RPC framework.
node-sql-parser: SQL parsing and validation.
Winston: Logging.
Backends
Relational Databases: SQLite, MySQL, PostgreSQL.
Redis: Key-value store.
Kafka: Publish-subscribe messaging.
Hedera Hashgraph: Distributed ledger via smart contracts.
Hyperledger Fabric: Permissioned blockchain via chaincode.
Security
jsonwebtoken: JWT authentication.
helmet: HTTP header security.
express-rate-limit: Throttling requests.


### Key Benefits
- Unified Interface:
A single service to handle SQL operations across diverse backends.

- Versatile Protocols:
Support for REST, gRPC, WebSockets, and MQTT makes it suitable for various client types.

- Blockchain Integration:
SQL support for blockchain backends enables structured query operations on immutable data.

- High Scalability:
Modular architecture and lightweight protocols (e.g., MQTT) allow scaling with ease.
Extensible and Future-Proof:

- New backends and protocols can be added without disrupting existing functionality.




### Input for emulated supported SQL instructions/data:

- REST/API
- gRPC
- MQTT

Adapters:
- SQL DB: 
    MySQL, PostgreSQL, Sqlite
- Blockchain: 
    Ethereum, Hedera, Hyperledger
- Redis
- Kafka


## Key Files Explained

1. adapters/
Holds adapters for all backends:
dbAdapter.js: SQL database support (SQLite, MySQL, PostgreSQL).
redisAdapter.js: Key-value operations mapped to Redis.
kafkaAdapter.js: SQL-like operations on Kafka topics.
blockchainAdapter.js: Ethereum-compatible blockchain integration.
hederaAdapter.js: Hedera Hashgraph integration.
hyperledgerAdapter.js: Hyperledger Fabric integration for SQL-like ledger queries.

2. sqlvm/
Handles SQL parsing and routing:
sqlInterpreter.js: Routes parsed SQL commands to appropriate adapters.

3. grpc/
Implements gRPC access:
grpcServer.js: Handles SQL execution via gRPC.
sql_service.proto: gRPC service definition file.

4. mqtt/
Implements MQTT access:
mqttServer.js: MQTT client and server for SQL operations.

5. websocket/
Implements WebSocket access:
websocketServer.js: WebSocket server for SQL operations.

6. blockchain/
Handles blockchain-related files:
sqlContract.js: Smart contract for Hyperledger Fabric.
connection.json: Connection profile for Hyperledger Fabric.
wallet/: Stores identities for Hyperledger Fabric.

7. logs/
Stores log files:
combined.log: All logs.
error.log: Errors only.

8. migrations/
For database setup:
initDb.js: SQLite schema setup.

9. test/
Holds test cases for unit and integration testing.

10. Root Files
.env: Environment variables (e.g., DB credentials, blockchain keys).
index.js: Main entry point, initializes REST, WebSocket, gRPC, MQTT servers.
logger.js: Winston logger configuration.

### Final Notes
- Environment Variables:
    Add sensitive configurations like blockchain keys, database credentials, and RPC URLs in .env.
- Dependencies:
    Ensure all required Node.js packages (express, knex, @hashgraph/sdk, fabric-network, etc.) are installed.
- Scripts:
    Start server: node index.js
    Initialize database: node migrations/initDb.js
- Documentation:
    Include detailed setup instructions and usage examples in README.md.
    This structure ensures the project is modular, maintainable, and scalable.



#### This project serves as a powerful, extensible platform for SQL-like operations, combining traditional and modern data platforms into a single cohesive system. 🚀


### Here are the step-by-step instructions to install and run the SQL Microservice project:

1. Prerequisites
Ensure the following tools are installed:
- Node.js (v16 or later): Download Node.js
- npm (comes with Node.js): For dependency management.
- Docker (optional): For running Redis, Kafka, or other backends locally.
- gRPC tools (optional): To test the gRPC interface.

2. Clone the Repository
Clone the project repository to your local machine:
git clone https://github.com/andreibesleaga/universal-sql-vmm.git
cd universal-sql-vmm

3. Install Dependencies
Install all necessary packages:
npm install
4. Configure Environment Variables
Create a .env file in the root directory with the following content (adjust values as needed):

#### General Configuration
NODE_ENV=development
PORT=3000

#### JWT Authentication
JWT_SECRET=your-secret-key

#### Database Configuration
DB_CLIENT=sqlite3
DB_FILENAME=./data.sqlite

#### Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

#### Kafka Configuration
KAFKA_BROKER=localhost:9092

#### Blockchain Configuration
HEDERA_OPERATOR_ID=0.0.xxxx
HEDERA_OPERATOR_KEY=302e020100300506032b657004220420...
HEDERA_CONTRACT_ID=0.0.xxxx
HYPERLEDGER_CONNECTION_FILE=./blockchain/connection.json

5. Set Up the Database
If you're using SQLite, initialize the database schema:

node migrations/initDb.js

6. Set Up Redis (Optional)
If Redis is required, run Redis locally using Docker:

docker run --name redis -p 6379:6379 -d redis

7. Set Up Kafka (Optional)
If Kafka is required, run Kafka using Docker Compose. Add the following content to a docker-compose.yml file:

yaml
Copy code
version: '3.7'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - 2181:2181

  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - 9092:9092
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
Run Kafka:

docker-compose up -d

8. Set Up Blockchain Backends
If using Hedera Hashgraph or Hyperledger Fabric:
Deploy the Hedera Smart Contract or Hyperledger Chaincode as described in their respective sections.
Update .env with the blockchain configuration.

9. Run the Microservice
Start the application:

npm start
Or, for development with auto-restart:

npm run dev
The REST server will be running at:
http://localhost:3000

10. Test the Service
REST API
Test with curl or any HTTP client (e.g., Postman):

curl -X POST http://localhost:3000/execute \
-H "Content-Type: application/json" \
-H "Authorization: Bearer your-jwt-token" \
-d '{
    "sql": "SELECT * FROM users",
    "adapter": "database"
}'

gRPC
Use a gRPC client or grpcurl:

grpcurl -plaintext \
-d '{"sql": "SELECT * FROM users", "adapter": "database"}' \
localhost:50051 SQLService.Execute
WebSocket
Connect to the WebSocket server at ws://localhost:3000 and send a message:

json

{
    "sql": "SELECT * FROM users",
    "adapter": "database"
}

MQTT
Publish a message to the sql/request topic and listen for responses on the sql/response topic:

mosquitto_pub -h localhost -t sql/request -m '{"sql": "SELECT * FROM users", "adapter": "database"}'
mosquitto_sub -h localhost -t sql/response

11. Run Tests
Run all unit and integration tests:

npm test

12. Monitor Logs
Check logs for debugging or performance analysis:

tail -f logs/combined.log

13. Deployment
For deployment:

Use a process manager like PM2 to manage the Node.js application:
npm install -g pm2
pm2 start index.js --name universal-sql-vmm
Set up a reverse proxy (e.g., NGINX) for handling HTTPS and load balancing.

