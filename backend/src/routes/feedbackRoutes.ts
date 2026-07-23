import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/authMiddleware';
import Feedback from '../models/Feedback';

const router = express.Router();

// POST /api/feedback - Submit new feedback
router.post('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, subject, message } = req.body;

    if (!type || !subject || !message) {
      res.status(400).json({ message: 'Please provide type, subject, and message' });
      return;
    }

    const feedback = new Feedback({
      user: req.user._id,
      type,
      subject,
      message,
    });

    const savedFeedback = await feedback.save();
    res.status(201).json(savedFeedback);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
