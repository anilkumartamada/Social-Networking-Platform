const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { validateId, validatePagination } = require('../middleware/validation');

// POST /api/events
router.post('/', authenticateToken, eventController.createEvent);

// GET /api/events/:eventId
router.get('/:eventId', validateId, optionalAuth, eventController.getEvent);

// POST /api/events/:eventId/rsvp
router.post('/:eventId/rsvp', authenticateToken, validateId, eventController.rsvpToEvent);

// GET /api/events/:eventId/attendees
router.get('/:eventId/attendees', validateId, validatePagination, eventController.getEventAttendees);

// GET /api/events/user/events
router.get('/user/events', authenticateToken, validatePagination, eventController.getUserEvents);

module.exports = router;