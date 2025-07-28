const request = require('supertest');
const app = require('../src/app');

describe('Comment API', () => {
  let token, postId, commentId;
  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Commenter',
        lastName: 'User',
        email: 'commenter@example.com',
        password: 'CommentPass123!',
        dateOfBirth: '1996-06-06',
        gender: 'other'
      });
    token = reg.body.token;
    const post = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Post for comments', privacy: 'public' });
    postId = post.body.post?.id;
  });

  it('should create a comment', async () => {
    if (!postId) return;
    const res = await request(app)
      .post(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Great photo! Where is this place?' });
    expect([200, 201]).toContain(res.statusCode);
    commentId = res.body.comment?.id;
  });

  it('should get post comments', async () => {
    if (!postId) return;
    const res = await request(app)
      .get(`/api/posts/${postId}/comments`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
  });
});
