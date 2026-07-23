import express, { Response } from 'express';
import Equipment from '../models/Equipment';
import { protect, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

// GET all equipment
router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const equipment = await Equipment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST new equipment
router.post('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, status, stats } = req.body;
    const newEquipment = new Equipment({
      user: req.user._id,
      name,
      type,
      status: status || 'active',
      stats: stats || []
    });

    const savedEquipment = await newEquipment.save();
    res.status(201).json(savedEquipment);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create equipment', error });
  }
});

// PUT update equipment
router.put('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, status, stats } = req.body;
    
    const updatedEquipment = await Equipment.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, type, status, stats },
      { new: true, runValidators: true }
    );

    if (!updatedEquipment) {
      res.status(404).json({ message: 'Equipment not found' });
      return;
    }

    res.status(200).json(updatedEquipment);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update equipment', error });
  }
});

// DELETE equipment
router.delete('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const deletedEquipment = await Equipment.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    
    if (!deletedEquipment) {
      res.status(404).json({ message: 'Equipment not found' });
      return;
    }

    res.status(200).json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete equipment', error });
  }
});

export default router;
