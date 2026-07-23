"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../models/User"));
const Session_1 = __importDefault(require("../models/Session"));
const Feedback_1 = __importDefault(require("../models/Feedback"));
const router = express_1.default.Router();
// GET /api/admin/stats - Get overview stats
router.get('/stats', async (req, res) => {
    try {
        const totalUsers = await User_1.default.countDocuments();
        const totalSessions = await Session_1.default.countDocuments();
        // Get users registered in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newUsersLastWeek = await User_1.default.countDocuments({
            createdAt: { $gte: sevenDaysAgo }
        });
        res.json({
            totalUsers,
            totalSessions,
            newUsersLastWeek
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
    try {
        const users = await User_1.default.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// PUT /api/admin/users/:id/role - Update a user's role
router.put('/users/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        if (!['user', 'admin'].includes(role)) {
            res.status(400).json({ message: 'Invalid role' });
            return;
        }
        const user = await User_1.default.findById(req.params.id);
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// DELETE /api/admin/users/:id - Delete a user and their data
router.delete('/users/:id', async (req, res) => {
    try {
        const user = await User_1.default.findById(req.params.id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Delete associated sessions and equipment (Cascade delete)
        await Session_1.default.deleteMany({ user: user._id });
        // Dynamically import Equipment to delete it too
        const Equipment = (await Promise.resolve().then(() => __importStar(require('../models/Equipment')))).default;
        await Equipment.deleteMany({ user: user._id });
        await user.deleteOne();
        res.json({ message: 'User removed' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// GET /api/admin/feedback - Get all feedback
router.get('/feedback', async (req, res) => {
    try {
        const feedbackList = await Feedback_1.default.find({})
            .populate('user', 'name email')
            .sort({ createdAt: -1 });
        res.json(feedbackList);
    }
    catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// PUT /api/admin/feedback/:id/status - Update feedback status
router.put('/feedback/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        if (!['New', 'In Progress', 'Resolved'].includes(status)) {
            res.status(400).json({ message: 'Invalid status' });
            return;
        }
        const feedback = await Feedback_1.default.findById(req.params.id);
        if (!feedback) {
            res.status(404).json({ message: 'Feedback not found' });
            return;
        }
        feedback.status = status;
        const updatedFeedback = await feedback.save();
        res.json(updatedFeedback);
    }
    catch (error) {
        console.error('Error updating feedback status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
// DELETE /api/admin/feedback/:id - Delete feedback
router.delete('/feedback/:id', async (req, res) => {
    try {
        const feedback = await Feedback_1.default.findByIdAndDelete(req.params.id);
        if (!feedback) {
            res.status(404).json({ message: 'Feedback not found' });
            return;
        }
        res.json({ message: 'Feedback removed' });
    }
    catch (error) {
        console.error('Error deleting feedback:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
