import crypto from 'node:crypto';
import { db } from '../config/db';
import { QueryHelper } from './User';

export interface ISession {
  _id: string;
  id: string;
  user: string;
  name: string;
  type: string;
  arrows: number;
  score: number;
  avg: number;
  tens: number;
  note: string;
  distance?: string;
  arrowData?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  save(): Promise<ISession>;
}

const mapSessionRow = (row: any): ISession => ({
  _id: String(row.id),
  id: String(row.id),
  user: String(row.user_id),
  name: String(row.name),
  type: String(row.type),
  arrows: Number(row.arrows),
  score: Number(row.score),
  avg: Number(row.avg),
  tens: Number(row.tens),
  note: String(row.note || ''),
  distance: String(row.distance || ''),
  arrowData: row.arrow_data ? String(row.arrow_data) : undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  async save() {
    const now = new Date().toISOString();
    await db.execute({
      sql: `
        UPDATE sessions
        SET name = ?, type = ?, arrows = ?, score = ?, avg = ?, tens = ?, note = ?, distance = ?, arrow_data = ?, updated_at = ?
        WHERE id = ?
      `,
      args: [
        this.name,
        this.type,
        this.arrows,
        this.score,
        this.avg,
        this.tens,
        this.note || '',
        this.distance || '',
        this.arrowData || null,
        now,
        this.id,
      ],
    });
    this.updatedAt = now;
    return this;
  },
});

export class SessionModelInstance {
  data: any;
  constructor(data: any) {
    this.data = data;
  }
  async save(): Promise<ISession> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const createdAt = this.data.createdAt
      ? new Date(this.data.createdAt).toISOString()
      : now;
    const userId = String(this.data.user || this.data.userId);

    await db.execute({
      sql: `
        INSERT INTO sessions (id, user_id, name, type, arrows, score, avg, tens, note, distance, arrow_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        userId,
        this.data.name,
        this.data.type,
        Number(this.data.arrows),
        Number(this.data.score),
        Number(this.data.avg),
        Number(this.data.tens),
        this.data.note || '',
        this.data.distance || '',
        this.data.arrowData || null,
        createdAt,
        now,
      ],
    });

    return mapSessionRow({
      id,
      user_id: userId,
      name: this.data.name,
      type: this.data.type,
      arrows: this.data.arrows,
      score: this.data.score,
      avg: this.data.avg,
      tens: this.data.tens,
      note: this.data.note,
      distance: this.data.distance,
      arrow_data: this.data.arrowData,
      created_at: createdAt,
      updated_at: now,
    });
  }
}

// Mimic Mongoose constructor syntax: new Session({ ... })
const SessionConstructor = function (this: any, data: any) {
  return new SessionModelInstance(data);
} as any;

SessionConstructor.find = function (query: { user?: any } = {}) {
  return new QueryHelper<ISession[]>(async () => {
    let sql = 'SELECT * FROM sessions';
    const args: any[] = [];
    if (query.user) {
      sql += ' WHERE user_id = ?';
      args.push(String(query.user));
    }
    sql += ' ORDER BY created_at DESC';
    const res = await db.execute({ sql, args });
    return res.rows.map(mapSessionRow);
  });
};

SessionConstructor.create = async function (data: any) {
  const instance = new SessionModelInstance(data);
  return await instance.save();
};

SessionConstructor.deleteMany = async function (query: { user?: any } = {}) {
  let sql = 'DELETE FROM sessions';
  const args: any[] = [];
  if (query.user) {
    sql += ' WHERE user_id = ?';
    args.push(String(query.user));
  }
  const res = await db.execute({ sql, args });
  return { deletedCount: res.rowsAffected };
};

SessionConstructor.countDocuments = async function () {
  const res = await db.execute({ sql: 'SELECT COUNT(*) as cnt FROM sessions', args: [] });
  return Number(res.rows[0]?.cnt || 0);
};

export default SessionConstructor;
