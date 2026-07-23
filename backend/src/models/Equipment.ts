import mongoose, { Document, Schema } from 'mongoose';

export interface IEquipment extends Document {
  name: string;
  type: string;
  status: 'active' | 'backup' | 'retired';
  stats: {
    label: string;
    value: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const EquipmentSchema = new Schema<IEquipment>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['active', 'backup', 'retired'],
      default: 'active'
    },
    stats: [
      {
        label: { type: String, required: true },
        value: { type: String, required: true }
      }
    ]
  },
  {
    timestamps: true
  }
);

export default mongoose.models.Equipment || mongoose.model<IEquipment>('Equipment', EquipmentSchema);
