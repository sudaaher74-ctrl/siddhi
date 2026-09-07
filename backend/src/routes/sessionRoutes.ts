import express from 'express';
import Session from '../models/Session';
import { protect, AuthedRequest, requireUser } from '../middleware/authMiddleware';
import { validateBody, validateParams } from '../middleware/validate';
import { sessionSchema, sessionUpdateSchema, objectIdParam } from '../schemas';

const router = express.Router();

// GET /api/sessions - Fetch the signed-in user's sessions
router.get('/', protect, async (req: AuthedRequest, res) => {
  try {
    const sessions = await Session.find({ user: requireUser(req)._id }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ message: 'Could not load sessions' });
  }
});

// GET /api/sessions/:id - Fetch a single session by ID
router.get('/:id', protect, validateParams(objectIdParam), async (req: AuthedRequest, res) => {
  try {
    const session = await Session.findOne({ id: req.params.id, user: requireUser(req)._id });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json(session);
  } catch (error) {
    console.error('Error fetching session:', error);
    res.status(500).json({ message: 'Could not load session' });
  }
});

// POST /api/sessions - Create a new session
router.post('/', protect, validateBody(sessionSchema), async (req: AuthedRequest, res) => {
  try {
    const session = new Session({
      ...req.body,
      user: requireUser(req)._id,
    });
    const savedSession = await session.save();
    res.status(201).json(savedSession);
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ message: 'Could not save session' });
  }
});

// PUT /api/sessions/:id - Update an existing session
router.put('/:id', protect, validateParams(objectIdParam), validateBody(sessionUpdateSchema), async (req: AuthedRequest, res) => {
  try {
    const updated = await Session.findOneAndUpdate(
      { id: req.params.id, user: requireUser(req)._id },
      req.body,
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error updating session:', error);
    res.status(500).json({ message: 'Could not update session' });
  }
});

// DELETE /api/sessions/:id - Delete a session
router.delete('/:id', protect, validateParams(objectIdParam), async (req: AuthedRequest, res) => {
  try {
    const deleted = await Session.findOneAndDelete({ id: req.params.id, user: requireUser(req)._id });
    if (!deleted) {
      return res.status(404).json({ message: 'Session not found' });
    }
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Error deleting session:', error);
    res.status(500).json({ message: 'Could not delete session' });
  }
});

export default router;

