const request = require('supertest');
const app = require('../src/app');

// You may need to mock authentication or use a test token for protected routes
let testToken;
let createdGroupId;

beforeAll(async () => {
  // Register and login a test user to get a token
  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      firstName: 'Test',
      lastName: 'User',
      email: 'testgroup@example.com',
      password: 'TestPass123!',
      dateOfBirth: '1995-01-01',
      gender: 'other'
    });
  testToken = registerRes.body.token;
});

describe('Group API', () => {
  it('should create a group', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        name: 'Test Group',
        description: 'A group for testing',
        privacy: 'public',
        category: 'Testing',
        coverPhoto: 'test_cover.jpg'
      });
    if (res.statusCode !== 201) {
      console.error('Create group error:', res.body);
    }
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    createdGroupId = res.body.group.id;
  });

  it('should get group details', async () => {
    const res = await request(app)
      .get(`/api/groups/${createdGroupId}`)
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.group.id).toBe(createdGroupId);
  });

  it('should join the group', async () => {
    // Register a new user to join the group
    const joinRes = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Join',
        lastName: 'User',
        email: 'joingroup@example.com',
        password: 'JoinPass123!',
        dateOfBirth: '1996-01-01',
        gender: 'other'
      });
    const joinToken = joinRes.body.token;
    const res = await request(app)
      .post(`/api/groups/${createdGroupId}/join`)
      .set('Authorization', `Bearer ${joinToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should get group members', async () => {
    const res = await request(app)
      .get(`/api/groups/${createdGroupId}/members`)
      .set('Authorization', `Bearer ${testToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.members)).toBe(true);
  });

  it('should update member role (admin only)', async () => {
    // Get the userId of the joined user
    const membersRes = await request(app)
      .get(`/api/groups/${createdGroupId}/members`)
      .set('Authorization', `Bearer ${testToken}`);
    const member = membersRes.body.members.find(m => m.role === 'member');
    expect(member).toBeDefined();
    const res = await request(app)
      .put(`/api/groups/${createdGroupId}/members/${member.id}/role`)
      .set('Authorization', `Bearer ${testToken}`)
      .send({ role: 'moderator' });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should allow group member to post in group', async () => {
    // Login as the joined user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'joingroup@example.com',
        password: 'JoinPass123!'
      });
    const joinToken = loginRes.body.token;
    const res = await request(app)
      .post(`/api/groups/${createdGroupId}/posts`)
      .set('Authorization', `Bearer ${joinToken}`)
      .send({ content: 'Hello group!', privacy: 'public' });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.post.content).toBe('Hello group!');
  });
});
