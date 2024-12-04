const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const { expect } = require('chai');
const { appToken } = require('../../security');

const PROTO_PATH = __dirname + '/../../grpc/sql_service.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH);
const sqlProto = grpc.loadPackageDefinition(packageDefinition);

describe('gRPC API Integration', () => {
    const client = new sqlProto.SQLService(
        'localhost:50051',
        grpc.credentials.createInsecure()
    );

    var meta = new grpc.Metadata();
    meta.add('authorization', appToken());    

    it('should respond to SQL queries', (done) => {
        client.Execute(
            { sql: "SELECT * FROM test", adapter: "database" },
            meta,
            (err, response) => {
                expect(err).to.be.null;
                expect(response).to.have.property('result');
                done();
            }
        );
    });

    it('should handle errors gracefully', (done) => {
        client.Execute(
            { sql: "", adapter: "unknown" },
            meta,
            (err, response) => {
                expect(err).to.be.null;
                expect(response).to.have.property('error');
                done();
            }
        );
    });
});
