import mongoose, { Document, Schema } from 'mongoose';

export interface IGoal extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  target: string;
  current: string;
  deadline: string;
  progress: number;
  completed: boolean;
}

const GoalSchema: Schema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  title: { type: String, required: true },
  target: { type: String, required: true },
  current: { type: String, required: true },
  deadline: { type: String, required: true },
  progress: { type: Number, required: true, default: 0 },
  completed: { type: Boolean, required: true, default: false }
}, {
  timestamps: true,
});

export default mongoose.model<IGoal>('Goal', GoalSchema);
