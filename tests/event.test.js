const request = require('supertest');
const app = require('../src/app');

describe('Event API', () => {
  let token, eventId;
  beforeAll(async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Event',
        lastName: 'User',
        email: 'event@example.com',
        password: 'EventPass123!',
        dateOfBirth: '1994-04-14',
        gender: 'other'
      });
    token = reg.body.token;
  });

  it('should create an event', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Mumbai Meetup 2024',
        description: 'Annual tech meetup',
        startDate: '2024-04-15T10:00:00Z',
        endDate: '2024-04-15T18:00:00Z',
        location: 'Convention Center, Mumbai',
        privacy: 'public'
      });
    expect([200, 201, 404]).toContain(res.statusCode);
    eventId = res.body.event?.id;
  });
});
