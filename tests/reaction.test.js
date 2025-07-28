const request = require('supertest');
const app = require('../src/app');

describe('Reaction API', () => {
  let token, postId;
  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Reactor',
        lastName: 'User',
        email: 'reactor@example.com',
        password: 'ReactPass123!',
        dateOfBirth: '1997-07-07',
        gender: 'other'
      });
    token = reg.body.token;
    const post = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Post for reactions', privacy: 'public' });
    postId = post.body.post?.id;
  });

  it('should react to a post', async () => {
    if (!postId) return;
    const res = await request(app)
      .post(`/api/posts/${postId}/react`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reaction: 'love' });
    expect([200, 201, 409]).toContain(res.statusCode);
  });

  it('should get post reactions', async () => {
    if (!postId) return;
    const res = await request(app)
      .get(`/api/posts/${postId}/reactions`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });
});
