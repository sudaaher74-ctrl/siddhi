"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Goal_1 = __importDefault(require("../models/Goal"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// GET /api/goals - Fetch all goals
router.get('/', authMiddleware_1.protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const goals = await Goal_1.default.find({ user: userId }).sort({ createdAt: -1 });
        res.json(goals);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// POST /api/goals - Create a new goal
router.post('/', authMiddleware_1.protect, async (req, res) => {
    try {
        const goal = new Goal_1.default({
            ...req.body,
            user: req.user._id,
        });
        const savedGoal = await goal.save();
        res.status(201).json(savedGoal);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// PUT /api/goals/:id/complete - Mark goal as completed or update progress
router.put('/:id', authMiddleware_1.protect, async (req, res) => {
    try {
        const updatedGoal = await Goal_1.default.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, req.body, { new: true });
        if (!updatedGoal) {
            return res.status(404).json({ message: 'Goal not found' });
        }
        res.json(updatedGoal);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
// DELETE /api/goals/:id - Delete a goal
router.delete('/:id', authMiddleware_1.protect, async (req, res) => {
    try {
        const deletedGoal = await Goal_1.default.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!deletedGoal) {
            return res.status(404).json({ message: 'Goal not found' });
        }
        res.json({ message: 'Goal removed' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.default = router;
