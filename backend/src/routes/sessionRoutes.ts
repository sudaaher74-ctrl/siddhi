import express from 'express';
import Session from '../models/Session';
import { protect, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/sessions - Fetch all sessions
router.get('/', protect, async (req: AuthRequest, res) => {
  try {
    const userId = req.user._id;
    const sessions = await Session.find({ user: userId }).sort({ createdAt: -1 });
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/sessions - Create a new session
router.post('/', protect, async (req: AuthRequest, res) => {
  try {
    const session = new Session({
      ...req.body,
      user: req.user._id,
    });
    const savedSession = await session.save();
    res.status(201).json(savedSession);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
