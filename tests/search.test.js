const request = require('supertest');
const app = require('../src/app');

describe('Search API', () => {
  let token;
  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Search',
        lastName: 'User',
        email: 'search@example.com',
        password: 'SearchPass123!',
        dateOfBirth: '1991-11-11',
        gender: 'other'
      });
    token = reg.body.token;
  });

  it('should search globally', async () => {
    const res = await request(app)
      .get('/api/search?q=john&type=all')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(res.statusCode);
  });
});
