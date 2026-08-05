/**
 * One-off migration: sessions used to store arrows/score/avg/tens as strings.
 * Converts existing documents to numbers and backfills `distance`/`note`.
 *
 * Run with:  npm run migrate:session-numbers
 * Safe to run more than once — already-numeric documents are skipped.
 */
import mongoose from 'mongoose';
import { env } from '../src/config/env';

const NUMERIC_FIELDS = ['arrows', 'score', 'avg', 'tens'] as const;

const toNumber = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = parseFloat(String(value ?? '0'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const run = async () => {
  await mongoose.connect(env.mongoUri);
  const collection = mongoose.connection.collection('sessions');

  const cursor = collection.find({
    $or: [
      ...NUMERIC_FIELDS.map((f) => ({ [f]: { $type: 'string' } })),
      { distance: { $exists: false } },
      { note: { $exists: false } },
    ],
  });

  let converted = 0;
  for await (const doc of cursor) {
    const update: Record<string, unknown> = {};

    for (const field of NUMERIC_FIELDS) {
      if (typeof doc[field] !== 'number') {
        update[field] = toNumber(doc[field]);
      }
    }
    if (doc.distance === undefined) update.distance = '';
    if (doc.note === undefined) update.note = '';

    if (Object.keys(update).length > 0) {
      await collection.updateOne({ _id: doc._id }, { $set: update });
      converted += 1;
    }
  }

  console.log(`Migration complete. Updated ${converted} session document(s).`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Migration failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
