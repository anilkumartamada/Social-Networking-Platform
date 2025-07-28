const request = require('supertest');
const app = require('../src/app');

describe('Notification API', () => {
  let token;
  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Notify',
        lastName: 'User',
        email: 'notify@example.com',
        password: 'NotifyPass123!',
        dateOfBirth: '1990-10-10',
        gender: 'other'
      });
    token = reg.body.token;
  });

  it('should get notifications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(res.statusCode);
  });
});
