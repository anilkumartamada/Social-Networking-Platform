const request = require('supertest');
const app = require('../src/app');

describe('Auth API', () => {
  let token;
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'securePassword123',
        dateOfBirth: '1990-01-15',
        gender: 'male'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('should login the user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'securePassword123'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('should logout the user', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(res.statusCode);
  });
});
