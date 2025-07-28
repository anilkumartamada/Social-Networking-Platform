const request = require('supertest');
const app = require('../src/app');

describe('User API', () => {
  let token;
  let userId;
  beforeAll(async () => {
    // Register and login a user
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'JanePass123!',
        dateOfBirth: '1992-02-02',
        gender: 'female'
      });
    token = reg.body.token;
    userId = reg.body.userId || reg.body.user?.id || 1;
  });

  it('should get user profile', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
  });

  it('should update user profile', async () => {
    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bio: 'Updated bio',
        location: 'New Delhi, India',
        work: { company: 'New Tech Corp', position: 'Senior Developer' },
        relationshipStatus: 'single'
      });
    expect([200, 201]).toContain(res.statusCode);
    expect(res.body.success).toBe(true);
  });

  it('should get user friends list', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/friends`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 404]).toContain(res.statusCode); // 404 if no friends
  });
});
