import express, { Request, Response } from 'express';
import Equipment from '../models/Equipment';

const router = express.Router();

// GET all equipment
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const equipment = await Equipment.find().sort({ createdAt: -1 });
    res.status(200).json(equipment);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// POST new equipment
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, status, stats } = req.body;
    const newEquipment = new Equipment({
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
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, status, stats } = req.body;
    
    const updatedEquipment = await Equipment.findByIdAndUpdate(
      req.params.id,
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
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedEquipment = await Equipment.findByIdAndDelete(req.params.id);
    
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
