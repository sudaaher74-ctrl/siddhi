import express, { Response } from 'express';
import User from '../models/User';
import Session from '../models/Session';
import { protect, admin, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/admin/stats - Get overview stats
router.get('/stats', protect, admin, async (req: AuthRequest, res: Response) => {
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
router.get('/users', protect, admin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/admin/users/:id/role - Update a user's role
router.put('/users/:id/role', protect, admin, async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Prevent removing the last admin (optional safeguard, simplified here)
    if (user._id.toString() === req.user._id.toString() && role === 'user') {
      res.status(400).json({ message: 'Cannot demote yourself' });
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
router.delete('/users/:id', protect, admin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    if (user._id.toString() === req.user._id.toString()) {
      res.status(400).json({ message: 'Cannot delete yourself' });
      return;
    }

    // Delete associated sessions and equipment (Cascade delete)
    await Session.deleteMany({ user: user._id });
    
    // Dynamically import Equipment to delete it too
    const Equipment = (await import('../models/Equipment')).default;
    await Equipment.deleteMany({ user: user._id });

    await user.deleteOne();
    
    res.json({ message: 'User and all associated data removed' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
