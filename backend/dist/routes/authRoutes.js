"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const router = express_1.default.Router();
// Helper to generate JWT token
const generateToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d',
    });
};
// POST /api/auth/register - Register a new user
router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userExists = await User_1.default.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const user = await User_1.default.create({ email, password });
        if (user) {
            res.status(201).json({
                _id: user._id,
                email: user.email,
                token: generateToken(user._id.toString()),
            });
        }
        else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
// POST /api/auth/login - Authenticate user & get token
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                email: user.email,
                token: generateToken(user._id.toString()),
            });
        }
        else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
const google_auth_library_1 = require("google-auth-library");
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// POST /api/auth/google - Authenticate with Google
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;
        // Verify Google token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ message: 'Invalid Google token' });
        }
        const email = payload.email.toLowerCase();
        // Check if user exists
        let user = await User_1.default.findOne({ email });
        if (!user) {
            // Create new user if they don't exist
            user = await User_1.default.create({
                email,
                authProvider: 'google',
                googleId: payload.sub
            });
        }
        else {
            // If user exists but used email/password before, we could link the account or just let them in.
            // For simplicity, we just let them log in. We might want to update their googleId.
            if (!user.googleId) {
                user.googleId = payload.sub;
                user.authProvider = 'google'; // or keep as local and add google
                await user.save();
            }
        }
        res.json({
            _id: user._id,
            email: user.email,
            token: generateToken(user._id.toString()),
        });
    }
    catch (error) {
        console.error("Google auth error:", error);
        res.status(500).json({ message: 'Google authentication failed' });
    }
});
exports.default = router;
