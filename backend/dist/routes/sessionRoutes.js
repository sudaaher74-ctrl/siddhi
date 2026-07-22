"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Session_1 = __importDefault(require("../models/Session"));
const router = express_1.default.Router();
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
router.get('/', async (req, res) => {
    try {
        const count = await Session_1.default.countDocuments();
        // Seed data if database is empty
        if (count === 0) {
            await Session_1.default.insertMany(seedSessions);
            console.log('Database seeded with initial sessions');
        }
        const sessions = await Session_1.default.find().sort({ createdAt: -1 });
        res.json(sessions);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// POST /api/sessions - Create a new session
router.post('/', async (req, res) => {
    try {
        const session = new Session_1.default(req.body);
        const savedSession = await session.save();
        res.status(201).json(savedSession);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.default = router;
