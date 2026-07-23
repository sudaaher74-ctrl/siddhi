"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Equipment_1 = __importDefault(require("../models/Equipment"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// GET all equipment
router.get('/', authMiddleware_1.protect, async (req, res) => {
    try {
        const equipment = await Equipment_1.default.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(equipment);
    }
    catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});
// POST new equipment
router.post('/', authMiddleware_1.protect, async (req, res) => {
    try {
        const { name, type, status, stats } = req.body;
        const newEquipment = new Equipment_1.default({
            user: req.user._id,
            name,
            type,
            status: status || 'active',
            stats: stats || []
        });
        const savedEquipment = await newEquipment.save();
        res.status(201).json(savedEquipment);
    }
    catch (error) {
        res.status(400).json({ message: 'Failed to create equipment', error });
    }
});
// PUT update equipment
router.put('/:id', authMiddleware_1.protect, async (req, res) => {
    try {
        const { name, type, status, stats } = req.body;
        const updatedEquipment = await Equipment_1.default.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { name, type, status, stats }, { new: true, runValidators: true });
        if (!updatedEquipment) {
            res.status(404).json({ message: 'Equipment not found' });
            return;
        }
        res.status(200).json(updatedEquipment);
    }
    catch (error) {
        res.status(400).json({ message: 'Failed to update equipment', error });
    }
});
// DELETE equipment
router.delete('/:id', authMiddleware_1.protect, async (req, res) => {
    try {
        const deletedEquipment = await Equipment_1.default.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!deletedEquipment) {
            res.status(404).json({ message: 'Equipment not found' });
            return;
        }
        res.status(200).json({ message: 'Equipment deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to delete equipment', error });
    }
});
exports.default = router;
