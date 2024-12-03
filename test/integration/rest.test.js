const request = require('supertest');
const { expect } = require('chai');
const app = require('../../index'); // Your Express app

describe('REST API Integration', () => {
    it('should respond to SQL queries', async () => {
        const res = await request(app)
            .post('/execute')
            .send({
                sql: "SELECT name, age FROM users WHERE age > 30",
                adapter: "database",
            });

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('result');
    });

    it('should return 400 for missing SQL parameters', async () => {
        const res = await request(app)
            .post('/execute')
            .send({ adapter: 'database' });

        expect(res.status).to.equal(400);
        expect(res.body).to.have.property('error');
    });

    it('should return 401 for unauthorized access', async () => {
        const res = await request(app)
            .post('/execute')
            .set('Authorization', 'InvalidToken')
            .send({
                sql: "SELECT * FROM users",
                adapter: "database",
            });

        expect(res.status).to.equal(401);
    });
});
