import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  type: string;
  arrows: number;
  score: number;
  avg: number;
  tens: number;
  note: string;
  distance?: string;
  arrowData?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema: Schema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    // Numeric so scores sort and aggregate correctly. Legacy string documents
    // are converted by `npm run migrate:session-numbers`.
    arrows: { type: Number, required: true, min: 0 },
    score: { type: Number, required: true, min: 0 },
    avg: { type: Number, required: true, min: 0 },
    tens: { type: Number, required: true, min: 0 },
    note: { type: String, required: false, default: '' },
    distance: { type: String, required: false, default: '' },
    arrowData: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

// Every read is "this user's sessions, newest first".
SessionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<ISession>('Session', SessionSchema);
