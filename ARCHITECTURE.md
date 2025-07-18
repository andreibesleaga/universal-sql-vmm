# Architecture Documentation

This document provides an overview of the Universal SQL VMM architecture, including component diagrams and explanations of how the system works.

## System Overview

The Universal SQL VMM is a microservice that provides SQL-like operations across multiple backend storage systems through various access protocols. It acts as a virtual machine for SQL operations, translating standard SQL queries into operations that can be executed on different backends.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                     Universal SQL VMM Architecture                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Access Interfaces                             │
├─────────────┬─────────────┬─────────────┬───────────────────────────────┤
│  REST API   │    gRPC     │  WebSocket  │            MQTT              │
└─────────────┴─────────────┴─────────────┴───────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Security Layer                                │
├─────────────┬─────────────┬─────────────┬───────────────────────────────┤
│    JWT      │   Input     │    Rate     │           HTTPS              │
│    Auth     │ Validation  │   Limiting  │                              │
└─────────────┴─────────────┴─────────────┴───────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SQL Interpreter                               │
├─────────────┬─────────────┬─────────────┬───────────────────────────────┤
│    Parse    │  Validate   │  Extract    │         Execute              │
│     SQL     │     SQL     │ Components  │                              │
└─────────────┴─────────────┴─────────────┴───────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Backend Adapters                              │
├─────────────┬─────────────┬─────────────┬───────────────────────────────┤
│  Database   │    Redis    │    Kafka    │        Blockchain            │
│  (SQLite,   │             │             │  (Ethereum, Hedera,          │
│   MySQL)    │             │             │   Hyperledger)               │
└─────────────┴─────────────┴─────────────┴───────────────────────────────┘
```

## Component Descriptions

### Access Interfaces

The service provides multiple interfaces for clients to access the SQL functionality:

1. **REST API**: HTTP-based API for standard web applications
2. **gRPC**: High-performance RPC framework for service-to-service communication
3. **WebSocket**: Real-time bidirectional communication for interactive applications
4. **MQTT**: Lightweight messaging protocol for IoT and pub/sub applications

### Security Layer

The security layer ensures that all requests are properly authenticated and validated:

1. **JWT Authentication**: Verifies user identity using JSON Web Tokens
2. **Input Validation**: Validates and sanitizes all input to prevent injection attacks
3. **Rate Limiting**: Prevents abuse by limiting the number of requests per client
4. **HTTPS**: Encrypts all communication between clients and the server

### SQL Interpreter

The SQL interpreter processes SQL queries and routes them to the appropriate backend:

1. **Parse SQL**: Parses SQL queries into Abstract Syntax Trees (AST)
2. **Validate SQL**: Validates the SQL structure and prevents SQL injection
3. **Extract Components**: Extracts components like tables, columns, and conditions
4. **Execute**: Routes the query to the appropriate backend adapter

### Backend Adapters

The backend adapters translate SQL operations to backend-specific operations:

1. **Database**: Executes SQL directly on relational databases (SQLite, MySQL, PostgreSQL)
2. **Redis**: Translates SQL operations to Redis commands
3. **Kafka**: Translates SQL operations to Kafka publish/subscribe operations
4. **Blockchain**: Translates SQL operations to blockchain operations (Ethereum, Hedera, Hyperledger)

## Request Flow

```
┌──────────┐     ┌───────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Client  │────▶│  Access   │────▶│  Security   │────▶│     SQL     │────▶│   Backend   │
│          │     │ Interface │     │    Layer    │     │ Interpreter │     │   Adapter   │
└──────────┘     └───────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                                  │
                                                                                  ▼
                                                                           ┌─────────────┐
                                                                           │   Storage   │
                                                                           │   Backend   │
                                                                           └─────────────┘
```

1. **Client Request**: The client sends a request to one of the access interfaces
2. **Authentication**: The security layer authenticates the request using JWT
3. **Validation**: The security layer validates and sanitizes the input
4. **SQL Processing**: The SQL interpreter parses and processes the SQL query
5. **Backend Execution**: The appropriate backend adapter executes the operation
6. **Response**: The result is returned to the client through the original interface

## Data Flow for SQL Execution

```
┌──────────┐     ┌───────────┐     ┌─────────────┐     ┌─────────────┐
│   SQL    │────▶│   Parse   │────▶│  Validate   │────▶│   Extract   │
│  Query   │     │           │     │             │     │ Components  │
└──────────┘     └───────────┘     └─────────────┘     └─────────────┘
                                                             │
                                                             ▼
┌──────────┐     ┌───────────┐     ┌─────────────┐     ┌─────────────┐
│  Result  │◀────│  Format   │◀────│   Execute   │◀────│   Route to  │
│          │     │  Result   │     │             │     │   Adapter   │
└──────────┘     └───────────┘     └─────────────┘     └─────────────┘
```

1. **SQL Query**: The client submits an SQL query
2. **Parse**: The query is parsed into an Abstract Syntax Tree (AST)
3. **Validate**: The AST is validated for correctness and security
4. **Extract Components**: SQL components (tables, columns, conditions) are extracted
5. **Route to Adapter**: The query is routed to the appropriate backend adapter
6. **Execute**: The adapter executes the operation on the backend
7. **Format Result**: The result is formatted into a consistent structure
8. **Result**: The result is returned to the client

## Error Handling Flow

```
┌──────────┐     ┌───────────┐     ┌─────────────┐
│   Error  │────▶│ Categorize│────▶│   Log       │
│  Occurs  │     │   Error   │     │   Error     │
└──────────┘     └───────────┘     └─────────────┘
                                         │
                                         ▼
┌──────────┐     ┌───────────┐     ┌─────────────┐
│  Client  │◀────│  Format   │◀────│  Create     │
│ Response │     │  Response │     │ Error Resp  │
└──────────┘     └───────────┘     └─────────────┘
```

1. **Error Occurs**: An error occurs during request processing
2. **Categorize Error**: The error is categorized by type (validation, authentication, etc.)
3. **Log Error**: The error is logged with context for debugging
4. **Create Error Response**: An error response is created with appropriate status code
5. **Format Response**: The response is formatted according to the interface
6. **Client Response**: The error response is returned to the client

## Security Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           Security Components                            │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                 ┌─────────────────┬┴┬─────────────────┐
                 │                 │                   │
                 ▼                 ▼                   ▼
┌───────────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│  Authentication       │ │ Input Security  │ │  Network Security   │
├───────────────────────┤ ├─────────────────┤ ├─────────────────────┤
│ - JWT Token Creation  │ │ - Validation    │ │ - HTTPS             │
│ - Token Validation    │ │ - Sanitization  │ │ - Secure Headers    │
│ - Secret Management   │ │ - Rate Limiting │ │ - TLS Configuration │
└───────────────────────┘ └─────────────────┘ └─────────────────────┘
```

### Authentication Components

1. **JWT Token Creation**: Creates secure JWT tokens with proper claims
2. **Token Validation**: Validates tokens and extracts user information
3. **Secret Management**: Securely manages JWT secrets using environment variables

### Input Security Components

1. **Validation**: Validates all input parameters for correctness
2. **Sanitization**: Sanitizes input to prevent injection attacks
3. **Rate Limiting**: Limits request rates to prevent abuse

### Network Security Components

1. **HTTPS**: Encrypts all communication using TLS
2. **Secure Headers**: Sets secure HTTP headers to prevent common attacks
3. **TLS Configuration**: Configures TLS with secure ciphers and protocols

## Deployment Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           Production Deployment                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                 ┌─────────────────┬┴┬─────────────────┐
                 │                 │                   │
                 ▼                 ▼                   ▼
┌───────────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│  Application          │ │ Infrastructure  │ │  Monitoring         │
├───────────────────────┤ ├─────────────────┤ ├─────────────────────┤
│ - Node.js Application │ │ - Docker        │ │ - Logging           │
│ - Environment Config  │ │ - Load Balancer │ │ - Metrics           │
│ - Dependency Mgmt     │ │ - Database      │ │ - Alerting          │
└───────────────────────┘ └─────────────────┘ └─────────────────────┘
```

### Application Components

1. **Node.js Application**: The core application running in a Node.js environment
2. **Environment Configuration**: Configuration via environment variables
3. **Dependency Management**: Management of npm dependencies

### Infrastructure Components

1. **Docker**: Containerization for consistent deployment
2. **Load Balancer**: Distribution of traffic across multiple instances
3. **Database**: Persistent storage for application data

### Monitoring Components

1. **Logging**: Centralized logging for application events
2. **Metrics**: Collection of performance metrics
3. **Alerting**: Alerts for critical issues

## Conclusion

The Universal SQL VMM architecture provides a flexible and secure way to execute SQL-like operations across multiple backends. The modular design allows for easy extension to support additional backends and protocols, while the security features ensure that all operations are properly authenticated and validated.