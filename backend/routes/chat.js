const router = require('express').Router();
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// GET /api/v1/chat/rooms — user's chat rooms
router.get('/rooms', authenticate, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT cr.*,
             p.title AS property_title, p.locality, p.photos,
             o.name AS owner_name, s.name AS seeker_name,
             (SELECT message FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) AS last_message,
             (SELECT created_at FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
             (SELECT COUNT(*) FROM chat_messages WHERE room_id = cr.id AND is_read = false AND sender_id != $1) AS unread_count
      FROM chat_rooms cr
      JOIN properties p ON cr.property_id = p.id
      JOIN users o ON cr.owner_id = o.id
      JOIN users s ON cr.seeker_id = s.id
      WHERE cr.owner_id = $1 OR cr.seeker_id = $1
      ORDER BY last_message_at DESC NULLS LAST
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/v1/chat/rooms/:roomId/messages
router.get('/rooms/:roomId/messages', authenticate, async (req, res) => {
  try {
    const room = await pool.query(
      'SELECT * FROM chat_rooms WHERE id = $1 AND (owner_id = $2 OR seeker_id = $2)',
      [req.params.roomId, req.user.id]
    );
    if (!room.rows.length) return res.status(403).json({ success: false, message: 'Access denied' });

    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { rows } = await pool.query(`
      SELECT m.*, u.name AS sender_name, u.profile_photo AS sender_photo
      FROM chat_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.room_id = $1
      ORDER BY m.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.params.roomId, parseInt(limit), parseInt(offset)]);

    // Mark as read
    pool.query(
      'UPDATE chat_messages SET is_read = true WHERE room_id = $1 AND sender_id != $2 AND is_read = false',
      [req.params.roomId, req.user.id]
    );

    res.json({ success: true, data: rows.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/v1/chat/rooms/:roomId/messages — send message (REST fallback, use Socket.IO for real-time)
router.post('/rooms/:roomId/messages', authenticate, async (req, res) => {
  try {
    const { message, message_type = 'text', file_url } = req.body;
    const room = await pool.query(
      'SELECT * FROM chat_rooms WHERE id = $1 AND (owner_id = $2 OR seeker_id = $2)',
      [req.params.roomId, req.user.id]
    );
    if (!room.rows.length) return res.status(403).json({ success: false, message: 'Access denied' });

    const { rows } = await pool.query(`
      INSERT INTO chat_messages (id, room_id, sender_id, message, message_type, file_url)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [uuidv4(), req.params.roomId, req.user.id, message, message_type, file_url]);

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
