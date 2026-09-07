import crypto from 'node:crypto';
import { db } from '../config/db';
import { QueryHelper } from './User';

export interface IFeedback {
  _id: string;
  id: string;
  user: any;
  type: 'Bug Report' | 'Feature Request' | 'General Support';
  subject: string;
  message: string;
  status: 'New' | 'In Progress' | 'Resolved';
  createdAt: string | Date;
  updatedAt: string | Date;
  save(): Promise<IFeedback>;
}

const mapFeedbackRow = (row: any, userObj?: any): IFeedback => ({
  _id: String(row.id),
  id: String(row.id),
  user: userObj || String(row.user_id),
  type: (row.type as any) || 'General Support',
  subject: String(row.subject),
  message: String(row.message),
  status: (row.status as any) || 'New',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  async save() {
    const now = new Date().toISOString();
    await db.execute({
      sql: `
        UPDATE feedback
        SET type = ?, subject = ?, message = ?, status = ?, updated_at = ?
        WHERE id = ?
      `,
      args: [
        this.type,
        this.subject,
        this.message,
        this.status,
        now,
        this.id,
      ],
    });
    this.updatedAt = now;
    return this;
  },
});

export class FeedbackModelInstance {
  data: any;
  constructor(data: any) {
    this.data = data;
  }
  async save(): Promise<IFeedback> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const userId = String(this.data.user || this.data.userId);

    await db.execute({
      sql: `
        INSERT INTO feedback (id, user_id, type, subject, message, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        userId,
        this.data.type,
        this.data.subject,
        this.data.message,
        this.data.status || 'New',
        now,
        now,
      ],
    });

    return mapFeedbackRow({
      id,
      user_id: userId,
      type: this.data.type,
      subject: this.data.subject,
      message: this.data.message,
      status: this.data.status || 'New',
      created_at: now,
      updated_at: now,
    });
  }
}

const FeedbackConstructor = function (this: any, data: any) {
  return new FeedbackModelInstance(data);
} as any;

FeedbackConstructor.find = function (query: { user?: any } = {}) {
  return new QueryHelper<IFeedback[]>(async () => {
    let sql = `
      SELECT f.*, u.name as user_name, u.email as user_email
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.id
    `;
    const args: any[] = [];
    if (query.user) {
      sql += ' WHERE f.user_id = ?';
      args.push(String(query.user));
    }
    sql += ' ORDER BY f.created_at DESC';
    const res = await db.execute({ sql, args });
    return res.rows.map((row: any) =>
      mapFeedbackRow(row, row.user_name ? { _id: row.user_id, name: row.user_name, email: row.user_email } : undefined)
    );
  });
};

FeedbackConstructor.findById = function (id: string) {
  return new QueryHelper<IFeedback | null>(async () => {
    const res = await db.execute({
      sql: 'SELECT * FROM feedback WHERE id = ? LIMIT 1',
      args: [id],
    });
    if (res.rows.length === 0) return null;
    return mapFeedbackRow(res.rows[0]);
  });
};

FeedbackConstructor.findByIdAndDelete = async function (id: string) {
  const item = await this.findById(id);
  if (item) {
    await db.execute({ sql: 'DELETE FROM feedback WHERE id = ?', args: [id] });
  }
  return item;
};

export default FeedbackConstructor;
