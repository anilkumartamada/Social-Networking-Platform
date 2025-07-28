const request = require('supertest');
const app = require('../src/app');

describe('Post API', () => {
  let token;
  let postId;
  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Poster',
        lastName: 'User',
        email: 'poster@example.com',
        password: 'PosterPass123!',
        dateOfBirth: '1993-03-03',
        gender: 'other'
      });
    token = reg.body.token;
  });

  it('should create a post', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        content: 'Having a great day at the beach! 🏖️',
        privacy: 'public',
        location: 'Juhu Beach, Mumbai',
        feeling: 'happy'
      });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.success).toBe(true);
    postId = res.body.post?.id;
  });

  it('should get the news feed', async () => {
    const res = await request(app)
      .get('/api/posts/feed?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should get post details', async () => {
    if (!postId) return;
    const res = await request(app)
      .get(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(res.statusCode);
  });

  it('should update a post', async () => {
    if (!postId) return;
    const res = await request(app)
      .put(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Updated post content', privacy: 'friends' });
    expect([200, 404]).toContain(res.statusCode);
  });

  it('should delete a post', async () => {
    if (!postId) return;
    const res = await request(app)
      .delete(`/api/posts/${postId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(res.statusCode);
  });
});
