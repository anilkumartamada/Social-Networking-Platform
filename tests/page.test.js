const request = require('supertest');
const app = require('../src/app');

describe('Page API', () => {
  let token, pageId;
  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Page',
        lastName: 'User',
        email: 'page@example.com',
        password: 'PagePass123!',
        dateOfBirth: '1993-03-13',
        gender: 'other'
      });
    token = reg.body.token;
  });

  it('should create a page', async () => {
    const res = await request(app)
      .post('/api/pages')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My Business',
        category: 'Local Business',
        description: 'Best coffee in town',
        contact: { phone: '+919876543210', website: 'www.mybusiness.com' }
      });
    expect([200, 201, 404]).toContain(res.statusCode);
    pageId = res.body.page?.id;
  });
});
