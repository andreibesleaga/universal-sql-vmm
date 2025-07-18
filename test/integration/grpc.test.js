const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { expect } = require('chai');
const sinon = require('sinon');
const sqlInterpreter = require('../../sqlvm/sqlInterpreter');
const { startGRPCServer } = require('../../grpc/grpcServer');
const { appToken } = require('../../security');

const PROTO_PATH = __dirname + '/../../grpc/sql_service.proto';

describe('gRPC API Integration', () => {
  let server;
  let client;
  let executeStub;
  let token;
  const PORT = 50052;
  
  before(() => {
    // Load proto file
    const packageDefinition = protoLoader.loadSync(PROTO_PATH);
    const sqlProto = grpc.loadPackageDefinition(packageDefinition);
    
    // Create a test token
    token = appToken();
    
    // Stub the sqlInterpreter.execute method
    executeStub = sinon.stub(sqlInterpreter, 'execute');
    executeStub.resolves({ result: 'success' });
    
    // Start gRPC server
    server = new grpc.Server();
    startGRPCServer(server, PORT);
    
    // Create client
    client = new sqlProto.SQLService(
      `localhost:${PORT}`,
      grpc.credentials.createInsecure()
    );
  });
  
  after(() => {
    sinon.restore();
    server.forceShutdown();
  });
  
  it('should respond to SQL queries', (done) => {
    const meta = new grpc.Metadata();
    meta.add('authorization', token);
    
    client.Execute(
      { sql: "SELECT * FROM test", adapter: "database" },
      meta,
      (err, response) => {
        expect(err).to.be.null;
        expect(response).to.have.property('result');
        expect(executeStub.calledOnce).to.be.true;
        done();
      }
    );
  });
  
  it('should handle errors gracefully', (done) => {
    executeStub.rejects(new Error('SQL execution failed'));
    
    const meta = new grpc.Metadata();
    meta.add('authorization', token);
    
    client.Execute(
      { sql: "SELECT * FROM test", adapter: "database" },
      meta,
      (err, response) => {
        expect(err).to.be.null;
        expect(response).to.have.property('error', 'SQL execution failed');
        done();
      }
    );
  });
  
  it('should reject unauthorized requests', (done) => {
    const meta = new grpc.Metadata();
    meta.add('authorization', 'InvalidToken');
    
    client.Execute(
      { sql: "SELECT * FROM test", adapter: "database" },
      meta,
      (err, response) => {
        expect(err).to.not.be.null;
        expect(err.code).to.equal(grpc.status.UNAUTHENTICATED);
        done();
      }
    );
  });
});