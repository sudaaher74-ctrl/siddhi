import express from 'express';
import Goal from '../models/Goal';
import { protect, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/goals - Fetch all goals
router.get('/', protect, async (req: AuthRequest, res) => {
  try {
    const userId = req.user._id;
    const goals = await Goal.find({ user: userId }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/goals - Create a new goal
router.post('/', protect, async (req: AuthRequest, res) => {
  try {
    const goal = new Goal({
      ...req.body,
      user: req.user._id,
    });
    const savedGoal = await goal.save();
    res.status(201).json(savedGoal);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/goals/:id/complete - Mark goal as completed or update progress
router.put('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!updatedGoal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json(updatedGoal);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/goals/:id - Delete a goal
router.delete('/:id', protect, async (req: AuthRequest, res) => {
  try {
    const deletedGoal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deletedGoal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json({ message: 'Goal removed' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
