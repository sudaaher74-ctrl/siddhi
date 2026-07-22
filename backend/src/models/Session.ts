import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  name: string;
  type: string;
  arrows: string;
  score: string;
  avg: string;
  tens: string;
  note: string;
  arrowData?: string;
}

const SessionSchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  arrows: { type: String, required: true },
  score: { type: String, required: true },
  avg: { type: String, required: true },
  tens: { type: String, required: true },
  note: { type: String, required: false }, // Made note optional
  arrowData: { type: String, required: false },
}, {
  timestamps: true,
});

export default mongoose.model<ISession>('Session', SessionSchema);
