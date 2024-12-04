const request = require('supertest');
const { expect } = require('chai');
const app = require('../../index');
const {appToken} = require('../../security');

describe('REST API Integration', () => {
    it('should respond to SQL queries', async () => {
        const res = await request(app)
            .post('/execute')
            .set('Authorization', appToken())
            .send({
                sql: "SELECT value, key FROM test WHERE key > 30",
                adapter: "database",
            });

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('result');
    });

    it('should return 400 for missing SQL parameters', async () => {
        const res = await request(app)
            .post('/execute')
            .set('Authorization', appToken())
            .send({ adapter: 'database' });

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('error');
    });

    it('should return 401 for unauthorized access', async () => {
        const res = await request(app)
            .post('/execute')
            .set('Authorization', 'InvalidToken')
            .send({
                sql: "SELECT * FROM test",
                adapter: "database",
            });

        expect(res.status).to.equal(401);
    });
});
