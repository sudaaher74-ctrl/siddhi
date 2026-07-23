import express, { Response } from 'express';
import User from '../models/User';
import Session from '../models/Session';
import Feedback from '../models/Feedback';
import { protect, admin, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/admin/stats - Get overview stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSessions = await Session.countDocuments();
    
    // Get users registered in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsersLastWeek = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      totalUsers,
      totalSessions,
      newUsersLastWeek
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/admin/users - Get all users
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/users/:id/role - Update a user's role
router.put('/users/:id/role', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      res.status(400).json({ message: 'Invalid role' });
      return;
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    user.role = role;
    const updatedUser = await user.save();
    
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/admin/users/:id - Delete a user and their data
router.delete('/users/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Delete associated sessions and equipment (Cascade delete)
    await Session.deleteMany({ user: user._id });
    
    // Dynamically import Equipment to delete it too
    const Equipment = (await import('../models/Equipment')).default;
    await Equipment.deleteMany({ user: user._id });

    await user.deleteOne();
    
    res.json({ message: 'User removed' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/feedback - Get all feedback
router.get('/feedback', async (req: AuthRequest, res: Response) => {
  try {
    const feedbackList = await Feedback.find({})
      .populate('user', 'name email')
      .sort({ createdAt: -1 });
    res.json(feedbackList);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/admin/feedback/:id/status - Update feedback status
router.put('/feedback/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    if (!['New', 'In Progress', 'Resolved'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      res.status(404).json({ message: 'Feedback not found' });
      return;
    }

    feedback.status = status;
    const updatedFeedback = await feedback.save();
    res.json(updatedFeedback);
  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/feedback/:id - Delete feedback
router.delete('/feedback/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const feedback = await Feedback.findByIdAndDelete(req.params.id);
    if (!feedback) {
      res.status(404).json({ message: 'Feedback not found' });
      return;
    }
    res.json({ message: 'Feedback removed' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
