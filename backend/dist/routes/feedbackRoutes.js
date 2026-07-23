"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const Feedback_1 = __importDefault(require("../models/Feedback"));
const router = express_1.default.Router();
// POST /api/feedback - Submit new feedback
router.post('/', authMiddleware_1.protect, async (req, res) => {
    try {
        const { type, subject, message } = req.body;
        if (!type || !subject || !message) {
            res.status(400).json({ message: 'Please provide type, subject, and message' });
            return;
        }
        const feedback = new Feedback_1.default({
            user: req.user._id,
            type,
            subject,
            message,
        });
        const savedFeedback = await feedback.save();
        res.status(201).json(savedFeedback);
    }
    catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.default = router;
