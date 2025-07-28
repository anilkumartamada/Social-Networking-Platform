const { runQuery, getRow, getAll } = require('../config/database');
const { HTTP_STATUS } = require('../utils/constants');

// Create an event
const createEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, startDate, endDate, location, privacy } = req.body;

        const result = await runQuery(`
            INSERT INTO events (name, description, start_date, end_date, location, privacy, creator_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, description, startDate, endDate, location, privacy || 'public', userId]);

        // Add creator as attending
        await runQuery(`
            INSERT INTO event_rsvps (event_id, user_id, status)
            VALUES (?, ?, 'going')
        `, [result.id, userId]);

        res.status(HTTP_STATUS.CREATED).json({
            success: true,
            event: {
                id: result.id,
                name,
                description,
                startDate,
                endDate,
                location,
                privacy,
                attendeeCount: 1,
                userRsvp: 'going',
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create event'
        });
    }
};

// Get event details
const getEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const userId = req.user?.id;

        const event = await getRow(`
            SELECT e.*, u.first_name, u.last_name,
                   COUNT(DISTINCT er.id) as attendee_count,
                   MAX(CASE WHEN er.user_id = ? THEN er.status ELSE NULL END) as user_rsvp
            FROM events e
            JOIN users u ON e.creator_id = u.id
            LEFT JOIN event_rsvps er ON e.id = er.event_id AND er.status IN ('going', 'interested')
            WHERE e.id = ?
            GROUP BY e.id
        `, [userId || 0, eventId]);

        if (!event) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Event not found'
            });
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            event: {
                id: event.id,
                name: event.name,
                description: event.description,
                startDate: event.start_date,
                endDate: event.end_date,
                location: event.location,
                privacy: event.privacy,
                creator: {
                    name: `${event.first_name} ${event.last_name}`
                },
                attendeeCount: event.attendee_count,
                userRsvp: event.user_rsvp,
                createdAt: event.created_at
            }
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get event details'
        });
    }
};

// RSVP to event
const rsvpToEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { status } = req.body; // 'going', 'interested', 'not_going'
        const userId = req.user.id;

        // Check if event exists
        const event = await getRow('SELECT id FROM events WHERE id = ?', [eventId]);
        if (!event) {
            return res.status(HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check if user already has RSVP
        const existingRsvp = await getRow(`
            SELECT id FROM event_rsvps WHERE event_id = ? AND user_id = ?
        `, [eventId, userId]);

        if (existingRsvp) {
            // Update existing RSVP
            await runQuery(`
                UPDATE event_rsvps SET status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE event_id = ? AND user_id = ?
            `, [status, eventId, userId]);
        } else {
            // Create new RSVP
            await runQuery(`
                INSERT INTO event_rsvps (event_id, user_id, status)
                VALUES (?, ?, ?)
            `, [eventId, userId, status]);
        }

        res.status(HTTP_STATUS.OK).json({
            success: true,
            message: `RSVP updated to ${status}`,
            rsvp: status
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to RSVP to event'
        });
    }
};

// Get event attendees
const getEventAttendees = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const attendees = await getAll(`
            SELECT er.status, er.created_at,
                   u.id, u.first_name, u.last_name, u.profile_picture
            FROM event_rsvps er
            JOIN users u ON er.user_id = u.id
            WHERE er.event_id = ?
            ORDER BY 
                CASE er.status 
                    WHEN 'going' THEN 1 
                    WHEN 'interested' THEN 2 
                    ELSE 3 
                END,
                er.created_at DESC
            LIMIT ? OFFSET ?
        `, [eventId, limit, offset]);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            attendees: attendees.map(attendee => ({
                id: attendee.id,
                name: `${attendee.first_name} ${attendee.last_name}`,
                profilePicture: attendee.profile_picture,
                rsvpStatus: attendee.status,
                rsvpDate: attendee.created_at
            }))
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get event attendees'
        });
    }
};

// Get user's events
const getUserEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type = 'attending', page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        let query = '';
        let params = [];

        if (type === 'attending') {
            query = `
                SELECT e.*, u.first_name, u.last_name, er.status
                FROM events e
                JOIN users u ON e.creator_id = u.id
                JOIN event_rsvps er ON e.id = er.event_id
                WHERE er.user_id = ? AND er.status IN ('going', 'interested')
                ORDER BY e.start_date ASC
                LIMIT ? OFFSET ?
            `;
            params = [userId, limit, offset];
        } else if (type === 'created') {
            query = `
                SELECT e.*, u.first_name, u.last_name, 'going' as status
                FROM events e
                JOIN users u ON e.creator_id = u.id
                WHERE e.creator_id = ?
                ORDER BY e.created_at DESC
                LIMIT ? OFFSET ?
            `;
            params = [userId, limit, offset];
        }

        const events = await getAll(query, params);

        res.status(HTTP_STATUS.OK).json({
            success: true,
            events: events.map(event => ({
                id: event.id,
                name: event.name,
                description: event.description,
                startDate: event.start_date,
                endDate: event.end_date,
                location: event.location,
                privacy: event.privacy,
                creator: {
                    name: `${event.first_name} ${event.last_name}`
                },
                userRsvp: event.status,
                createdAt: event.created_at
            }))
        });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to get user events'
        });
    }
};

module.exports = {
    createEvent,
    getEvent,
    rsvpToEvent,
    getEventAttendees,
    getUserEvents
};