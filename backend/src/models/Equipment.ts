import crypto from 'node:crypto';
import { db } from '../config/db';
import { QueryHelper } from './User';

export interface IEquipment {
  _id: string;
  id: string;
  user: string;
  name: string;
  type: string;
  status: 'active' | 'backup' | 'retired';
  stats: {
    label: string;
    value: string;
  }[];
  createdAt: string | Date;
  updatedAt: string | Date;
  save(): Promise<IEquipment>;
}

const mapEquipmentRow = (row: any): IEquipment => {
  let parsedStats: any[] = [];
  try {
    parsedStats = typeof row.stats === 'string' ? JSON.parse(row.stats) : row.stats || [];
  } catch {
    parsedStats = [];
  }

  return {
    _id: String(row.id),
    id: String(row.id),
    user: String(row.user_id),
    name: String(row.name),
    type: String(row.type),
    status: (row.status as any) || 'active',
    stats: parsedStats,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    async save() {
      const now = new Date().toISOString();
      await db.execute({
        sql: `
          UPDATE equipment
          SET name = ?, type = ?, status = ?, stats = ?, updated_at = ?
          WHERE id = ?
        `,
        args: [
          this.name,
          this.type,
          this.status,
          JSON.stringify(this.stats || []),
          now,
          this.id,
        ],
      });
      this.updatedAt = now;
      return this;
    },
  };
};

export class EquipmentModelInstance {
  data: any;
  constructor(data: any) {
    this.data = data;
  }
  async save(): Promise<IEquipment> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const userId = String(this.data.user || this.data.userId);

    await db.execute({
      sql: `
        INSERT INTO equipment (id, user_id, name, type, status, stats, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        userId,
        this.data.name,
        this.data.type,
        this.data.status || 'active',
        JSON.stringify(this.data.stats || []),
        now,
        now,
      ],
    });

    return mapEquipmentRow({
      id,
      user_id: userId,
      name: this.data.name,
      type: this.data.type,
      status: this.data.status || 'active',
      stats: JSON.stringify(this.data.stats || []),
      created_at: now,
      updated_at: now,
    });
  }
}

const EquipmentConstructor = function (this: any, data: any) {
  return new EquipmentModelInstance(data);
} as any;

EquipmentConstructor.find = function (query: { user?: any } = {}) {
  return new QueryHelper<IEquipment[]>(async () => {
    let sql = 'SELECT * FROM equipment';
    const args: any[] = [];
    if ('user' in query) {
      sql += ' WHERE user_id = ?';
      args.push(String(query.user || ''));
    }
    sql += ' ORDER BY created_at DESC';
    const res = await db.execute({ sql, args });
    return res.rows.map(mapEquipmentRow);
  });
};

EquipmentConstructor.create = async function (data: any) {
  const instance = new EquipmentModelInstance(data);
  return await instance.save();
};

EquipmentConstructor.findOneAndUpdate = async function (
  query: { _id?: string; id?: string; user?: any },
  updateData: any,
  _options?: any
) {
  const id = query._id || query.id;
  let findSql = 'SELECT * FROM equipment WHERE id = ?';
  const findArgs: any[] = [id];
  if ('user' in query) {
    findSql += ' AND user_id = ?';
    findArgs.push(String(query.user || ''));
  }

  const check = await db.execute({ sql: findSql, args: findArgs });
  if (check.rows.length === 0) return null;

  const current = mapEquipmentRow(check.rows[0]);
  if (updateData.name !== undefined) current.name = updateData.name;
  if (updateData.type !== undefined) current.type = updateData.type;
  if (updateData.status !== undefined) current.status = updateData.status;
  if (updateData.stats !== undefined) current.stats = updateData.stats;

  await current.save();
  return current;
};

EquipmentConstructor.findOneAndDelete = async function (query: { _id?: string; id?: string; user?: any }) {
  const id = query._id || query.id;
  if (!id) return null;

  let findSql = 'SELECT * FROM equipment WHERE id = ?';
  const findArgs: any[] = [id];
  if ('user' in query) {
    findSql += ' AND user_id = ?';
    findArgs.push(String(query.user || ''));
  }

  const check = await db.execute({ sql: findSql, args: findArgs });
  if (check.rows.length === 0) return null;


  await db.execute({ sql: 'DELETE FROM equipment WHERE id = ?', args: [id] });
  return mapEquipmentRow(check.rows[0]);
};

EquipmentConstructor.deleteMany = async function (query: { user?: any } = {}) {
  let sql = 'DELETE FROM equipment';
  const args: any[] = [];
  if (query.user) {
    sql += ' WHERE user_id = ?';
    args.push(String(query.user));
  }
  const res = await db.execute({ sql, args });
  return { deletedCount: res.rowsAffected };
};

export default EquipmentConstructor;
