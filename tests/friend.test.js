const request = require('supertest');
const app = require('../src/app');

describe('Friend API', () => {
  let token1, token2, userId2;
  beforeAll(async () => {
    const reg1 = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Friend',
        lastName: 'Sender',
        email: 'friendsender@example.com',
        password: 'FriendPass123!',
        dateOfBirth: '1994-04-04',
        gender: 'male'
      });
    token1 = reg1.body.token;
    const reg2 = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Friend',
        lastName: 'Receiver',
        email: 'friendreceiver@example.com',
        password: 'FriendPass456!',
        dateOfBirth: '1995-05-05',
        gender: 'female'
      });
    token2 = reg2.body.token;
    userId2 = reg2.body.userId || reg2.body.user?.id || 2;
  });

  it('should send a friend request', async () => {
    const res = await request(app)
      .post('/api/friends/request')
      .set('Authorization', `Bearer ${token1}`)
      .send({ userId: userId2, message: "Hey! Let's connect" });
    expect([200, 201, 409]).toContain(res.statusCode);
  });

  it('should get friend requests', async () => {
    const res = await request(app)
      .get('/api/friends/requests')
      .set('Authorization', `Bearer ${token2}`);
    expect(res.statusCode).toBe(200);
  });
});
