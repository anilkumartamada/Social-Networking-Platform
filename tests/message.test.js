const request = require('supertest');
const app = require('../src/app');

describe('Message API', () => {
  let token1, token2, userId2;
  beforeAll(async () => {
    const reg1 = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Msg',
        lastName: 'Sender',
        email: 'msgsender@example.com',
        password: 'MsgPass123!',
        dateOfBirth: '1998-08-08',
        gender: 'male'
      });
    token1 = reg1.body.token;
    const reg2 = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Msg',
        lastName: 'Receiver',
        email: 'msgreceiver@example.com',
        password: 'MsgPass456!',
        dateOfBirth: '1999-09-09',
        gender: 'female'
      });
    token2 = reg2.body.token;
    userId2 = reg2.body.userId || reg2.body.user?.id || 2;
  });

  it('should send a message', async () => {
    const res = await request(app)
      .post('/api/messages/send')
      .set('Authorization', `Bearer ${token1}`)
      .send({ recipientId: userId2, content: 'Hey! How are you?', attachments: [] });
    expect([200, 201]).toContain(res.statusCode);
  });
});
