"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Session_1 = __importDefault(require("../models/Session"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// GET /api/sessions - Fetch all sessions
router.get('/', authMiddleware_1.protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const sessions = await Session_1.default.find({ user: userId }).sort({ createdAt: -1 });
        res.json(sessions);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// POST /api/sessions - Create a new session
router.post('/', authMiddleware_1.protect, async (req, res) => {
    try {
        const session = new Session_1.default({
            ...req.body,
            user: req.user._id,
        });
        const savedSession = await session.save();
        res.status(201).json(savedSession);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.default = router;
