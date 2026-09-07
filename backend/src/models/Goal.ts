import crypto from 'node:crypto';
import { db } from '../config/db';
import { QueryHelper } from './User';

export interface IGoal {
  _id: string;
  id: string;
  user: string;
  title: string;
  target: string;
  current: string;
  deadline: string;
  progress: number;
  completed: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  save(): Promise<IGoal>;
}

const mapGoalRow = (row: any): IGoal => ({
  _id: String(row.id),
  id: String(row.id),
  user: String(row.user_id),
  title: String(row.title),
  target: String(row.target),
  current: String(row.current),
  deadline: String(row.deadline),
  progress: Number(row.progress),
  completed: Boolean(row.completed),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  async save() {
    const now = new Date().toISOString();
    await db.execute({
      sql: `
        UPDATE goals
        SET title = ?, target = ?, current = ?, deadline = ?, progress = ?, completed = ?, updated_at = ?
        WHERE id = ?
      `,
      args: [
        this.title,
        this.target,
        this.current,
        this.deadline,
        this.progress,
        this.completed ? 1 : 0,
        now,
        this.id,
      ],
    });
    this.updatedAt = now;
    return this;
  },
});

export class GoalModelInstance {
  data: any;
  constructor(data: any) {
    this.data = data;
  }
  async save(): Promise<IGoal> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const userId = String(this.data.user || this.data.userId);

    await db.execute({
      sql: `
        INSERT INTO goals (id, user_id, title, target, current, deadline, progress, completed, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        userId,
        this.data.title,
        this.data.target,
        this.data.current,
        this.data.deadline,
        Number(this.data.progress || 0),
        this.data.completed ? 1 : 0,
        now,
        now,
      ],
    });

    return mapGoalRow({
      id,
      user_id: userId,
      title: this.data.title,
      target: this.data.target,
      current: this.data.current,
      deadline: this.data.deadline,
      progress: this.data.progress || 0,
      completed: this.data.completed || false,
      created_at: now,
      updated_at: now,
    });
  }
}

const GoalConstructor = function (this: any, data: any) {
  return new GoalModelInstance(data);
} as any;

GoalConstructor.find = function (query: { user?: any } = {}) {
  return new QueryHelper<IGoal[]>(async () => {
    let sql = 'SELECT * FROM goals';
    const args: any[] = [];
    if (query.user) {
      sql += ' WHERE user_id = ?';
      args.push(String(query.user));
    }
    sql += ' ORDER BY created_at DESC';
    const res = await db.execute({ sql, args });
    return res.rows.map(mapGoalRow);
  });
};

GoalConstructor.create = async function (data: any) {
  const instance = new GoalModelInstance(data);
  return await instance.save();
};

GoalConstructor.findOneAndUpdate = async function (
  query: { _id?: string; id?: string; user?: any },
  updateData: any,
  _options?: any
) {
  const id = query._id || query.id;
  const userId = query.user ? String(query.user) : undefined;

  let findSql = 'SELECT * FROM goals WHERE id = ?';
  const findArgs: any[] = [id];
  if (userId) {
    findSql += ' AND user_id = ?';
    findArgs.push(userId);
  }

  const check = await db.execute({ sql: findSql, args: findArgs });
  if (check.rows.length === 0) return null;

  const current = mapGoalRow(check.rows[0]);
  if (updateData.title !== undefined) current.title = updateData.title;
  if (updateData.target !== undefined) current.target = updateData.target;
  if (updateData.current !== undefined) current.current = updateData.current;
  if (updateData.deadline !== undefined) current.deadline = updateData.deadline;
  if (updateData.progress !== undefined) current.progress = Number(updateData.progress);
  if (updateData.completed !== undefined) current.completed = Boolean(updateData.completed);

  await current.save();
  return current;
};

GoalConstructor.findOneAndDelete = async function (query: { _id?: string; id?: string; user?: any }) {
  const id = query._id || query.id;
  if (!id) return null;
  const userId = query.user ? String(query.user) : undefined;

  let findSql = 'SELECT * FROM goals WHERE id = ?';
  const findArgs: any[] = [id];
  if (userId) {
    findSql += ' AND user_id = ?';
    findArgs.push(userId);
  }

  const check = await db.execute({ sql: findSql, args: findArgs });
  if (check.rows.length === 0) return null;

  await db.execute({ sql: 'DELETE FROM goals WHERE id = ?', args: [id] });
  return mapGoalRow(check.rows[0]);
};

export default GoalConstructor;
