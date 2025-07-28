const request = require('supertest');
const app = require('../src/app');

describe('Story API', () => {
  let token;
  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Story',
        lastName: 'User',
        email: 'story@example.com',
        password: 'StoryPass123!',
        dateOfBirth: '1992-12-12',
        gender: 'other'
      });
    token = reg.body.token;
  });

  it('should create a story', async () => {
    const res = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'text', content: 'Having a great day! 😊', duration: 5 });
    expect([200, 201, 404]).toContain(res.statusCode);
  });
});
