import express from 'express';
import Session from '../models/Session';
import { protect, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

// Seed data based on frontend/lib/data.ts
const seedSessions = [
  {
    name: "70m ranking round",
    type: "Outdoor",
    arrows: "84/108",
    score: "661",
    avg: "9.18",
    tens: "43",
    note: "Grouping tightened after end 8",
  },
  {
    name: "Morning volume block",
    type: "Blank bale",
    arrows: "120",
    score: "—",
    avg: "—",
    tens: "—",
    note: "Release timing +40ms consistent",
  },
  {
    name: "70m ranking round",
    type: "Outdoor",
    arrows: "72",
    score: "648",
    avg: "9.00",
    tens: "36",
    note: "Left drift in gusts > 4 m/s",
  },
  {
    name: "State trials — Q2",
    type: "Tournament",
    arrows: "72",
    score: "672",
    avg: "9.33",
    tens: "48",
    note: "Season best · qualified 3rd",
  },
];

// GET /api/sessions - Fetch all sessions
router.get('/', protect, async (req: AuthRequest, res) => {
  try {
    const userId = req.user._id;
    const count = await Session.countDocuments({ user: userId });
    
    // Seed data if database is empty for this user
    if (count === 0) {
      const userSeeds = seedSessions.map(session => ({ ...session, user: userId }));
      await Session.insertMany(userSeeds);
      console.log(`Database seeded with initial sessions for user ${userId}`);
    }

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
