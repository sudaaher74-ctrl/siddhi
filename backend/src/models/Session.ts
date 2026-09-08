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
  bow?: string;
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
  bow: String(row.bow || ''),
  arrowData: row.arrow_data ? String(row.arrow_data) : undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  async save() {
    const now = new Date().toISOString();
    await db.execute({
      sql: `
        UPDATE sessions
        SET name = ?, type = ?, arrows = ?, score = ?, avg = ?, tens = ?, note = ?, distance = ?, bow = ?, arrow_data = ?, updated_at = ?
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
        this.bow || '',
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
        INSERT INTO sessions (id, user_id, name, type, arrows, score, avg, tens, note, distance, bow, arrow_data, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        this.data.bow || '',
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
      bow: this.data.bow,
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
    if ('user' in query) {
      sql += ' WHERE user_id = ?';
      args.push(String(query.user || ''));
    }
    sql += ' ORDER BY created_at DESC';
    const res = await db.execute({ sql, args });
    return res.rows.map(mapSessionRow);
  });
};

SessionConstructor.findOne = async function (query: { _id?: string; id?: string; user?: any } = {}) {
  const id = query._id || query.id;
  let sql = 'SELECT * FROM sessions WHERE 1=1';
  const args: any[] = [];
  if (id) {
    sql += ' AND id = ?';
    args.push(id);
  }
  if ('user' in query) {
    sql += ' AND user_id = ?';
    args.push(String(query.user || ''));
  }
  sql += ' LIMIT 1';
  const res = await db.execute({ sql, args });
  if (res.rows.length === 0) return null;
  return mapSessionRow(res.rows[0]);
};


SessionConstructor.findById = async function (id: string, userId?: any) {
  return await SessionConstructor.findOne({ id, user: userId });
};

SessionConstructor.findOneAndUpdate = async function (
  query: { _id?: string; id?: string; user?: any },
  updateData: any,
  _options?: any
) {
  const id = query._id || query.id;
  let findSql = 'SELECT * FROM sessions WHERE id = ?';
  const findArgs: any[] = [id];
  if ('user' in query) {
    findSql += ' AND user_id = ?';
    findArgs.push(String(query.user || ''));
  }

  const check = await db.execute({ sql: findSql, args: findArgs });
  if (check.rows.length === 0) return null;

  const current = mapSessionRow(check.rows[0]);
  if (updateData.name !== undefined) current.name = updateData.name;
  if (updateData.type !== undefined) current.type = updateData.type;
  if (updateData.distance !== undefined) current.distance = updateData.distance;
  if (updateData.bow !== undefined) current.bow = updateData.bow;
  if (updateData.arrows !== undefined) current.arrows = Number(updateData.arrows);
  if (updateData.score !== undefined) current.score = Number(updateData.score);
  if (updateData.avg !== undefined) current.avg = Number(updateData.avg);
  if (updateData.tens !== undefined) current.tens = Number(updateData.tens);
  if (updateData.note !== undefined) current.note = updateData.note;
  if (updateData.arrowData !== undefined) current.arrowData = updateData.arrowData;

  await current.save();
  return current;
};

SessionConstructor.findOneAndDelete = async function (query: { _id?: string; id?: string; user?: any }) {
  const id = query._id || query.id;
  if (!id) return null;

  let findSql = 'SELECT * FROM sessions WHERE id = ?';
  const findArgs: any[] = [id];
  if ('user' in query) {
    findSql += ' AND user_id = ?';
    findArgs.push(String(query.user || ''));
  }


  const check = await db.execute({ sql: findSql, args: findArgs });
  if (check.rows.length === 0) return null;

  await db.execute({ sql: 'DELETE FROM sessions WHERE id = ?', args: [id] });
  return mapSessionRow(check.rows[0]);
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
