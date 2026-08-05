import express from 'express';
import Session from '../models/Session';
import { protect, AuthedRequest, requireUser } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validate';
import { sessionSchema } from '../schemas';

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

export default router;
