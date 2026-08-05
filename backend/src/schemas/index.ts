import { z } from 'zod';
import mongoose from 'mongoose';

export const objectIdParam = z.object({
  id: z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), {
    message: 'Invalid id',
  }),
});

/** Accepts a number or a numeric string (older clients post strings). */
const numeric = (label: string, max: number) =>
  z.coerce
    .number({ message: `${label} must be a number` })
    .min(0, `${label} cannot be negative`)
    .max(max, `${label} is unrealistically large`);

const shortText = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

// ---------- auth ----------

export const registerSchema = z.object({
  name: shortText('Name', 100),
  phone: z
    .string()
    .trim()
    .min(6, 'Phone number is too short')
    .max(20, 'Phone number is too long'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(200, 'Password is too long'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ---------- sessions ----------

export const sessionSchema = z
  .object({
    name: shortText('Session name', 120),
    type: z.enum(['Practice', 'Blank Bale', 'Scoring'], {
      message: 'Type must be Practice, Blank Bale or Scoring',
    }),
    distance: z.string().trim().max(20).optional().default(''),
    arrows: numeric('Arrows', 1000),
    score: numeric('Score', 10000),
    avg: numeric('Average', 10),
    tens: numeric('10s + Xs', 1000),
    note: z.string().trim().max(1000, 'Note is too long').optional().default(''),
    // Serialised arrow plot data; capped so a client cannot store megabytes.
    arrowData: z.string().max(100_000, 'Arrow data is too large').optional(),
  })
  .refine((s) => s.tens <= s.arrows, {
    message: 'You cannot have more 10s than arrows shot',
    path: ['tens'],
  })
  .refine((s) => s.score <= s.arrows * 10, {
    message: 'Score is higher than the maximum possible for that many arrows',
    path: ['score'],
  });

// ---------- equipment ----------

export const equipmentSchema = z.object({
  name: shortText('Name', 100),
  type: shortText('Type', 60),
  status: z.enum(['active', 'backup', 'retired']).default('active'),
  stats: z
    .array(
      z.object({
        label: shortText('Stat label', 60),
        value: shortText('Stat value', 60),
      })
    )
    .max(20, 'Too many stats')
    .default([]),
});

// ---------- goals ----------

export const goalSchema = z.object({
  title: shortText('Title', 120),
  target: shortText('Target', 60),
  current: shortText('Current', 60),
  deadline: shortText('Deadline', 40),
  progress: z.coerce.number().min(0).max(100).default(0),
  completed: z.boolean().default(false),
});

export const goalUpdateSchema = goalSchema.partial();

// ---------- feedback ----------

export const feedbackSchema = z.object({
  type: z.enum(['Bug Report', 'Feature Request', 'General Support'], {
    message: 'Choose a valid feedback type',
  }),
  subject: shortText('Subject', 150),
  message: shortText('Message', 5000),
});

// ---------- admin ----------

export const roleSchema = z.object({ role: z.enum(['user', 'admin']) });
export const feedbackStatusSchema = z.object({
  status: z.enum(['New', 'In Progress', 'Resolved']),
});
