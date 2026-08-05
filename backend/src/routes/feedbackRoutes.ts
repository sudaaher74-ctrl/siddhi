import express, { Response } from 'express';
import { protect, AuthedRequest, requireUser } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validate';
import { feedbackSchema } from '../schemas';
import Feedback from '../models/Feedback';

const router = express.Router();

// POST /api/feedback - Submit new feedback
router.post('/', protect, validateBody(feedbackSchema), async (req: AuthedRequest, res: Response): Promise<void> => {
  try {
    const { type, subject, message } = req.body;

    const feedback = new Feedback({
      user: requireUser(req)._id,
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
