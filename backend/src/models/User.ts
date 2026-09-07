import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from '../config/db';

export interface IUser {
  _id: string;
  id: string;
  name: string;
  phone?: string;
  email: string;
  password?: string;
  googleId?: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: Date | string;
  updatedAt: Date | string;
  matchPassword(enteredPassword: string): Promise<boolean>;
  save(): Promise<IUser>;
  deleteOne(): Promise<void>;
}

const mapUserRow = (row: any): IUser => {
  const user: IUser = {
    _id: String(row.id),
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: row.phone ? String(row.phone) : undefined,
    password: row.password ? String(row.password) : undefined,
    googleId: row.google_id ? String(row.google_id) : undefined,
    avatar: row.avatar ? String(row.avatar) : undefined,
    role: (row.role as 'user' | 'admin') || 'user',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    async matchPassword(enteredPassword: string) {
      if (!this.password) return false;
      return await bcrypt.compare(enteredPassword, this.password);
    },
    async save() {
      const now = new Date().toISOString();
      await db.execute({
        sql: `
          UPDATE users 
          SET name = ?, email = ?, phone = ?, password = ?, google_id = ?, avatar = ?, role = ?, updated_at = ?
          WHERE id = ?
        `,
        args: [
          this.name,
          this.email.toLowerCase(),
          this.phone || null,
          this.password || null,
          this.googleId || null,
          this.avatar || null,
          this.role,
          now,
          this.id,
        ],
      });
      this.updatedAt = now;
      return this;
    },
    async deleteOne() {
      await db.execute({
        sql: 'DELETE FROM users WHERE id = ?',
        args: [this.id],
      });
    },
  };
  return user;
};

export class QueryHelper<T> implements PromiseLike<T> {
  private executor: () => Promise<T>;
  private excludedFields: string[] = [];

  constructor(executor: () => Promise<T>) {
    this.executor = executor;
  }
  select(fields: string) {
    const parts = fields.split(/\s+/);
    for (const part of parts) {
      if (part.startsWith('-')) {
        this.excludedFields.push(part.slice(1));
      }
    }
    return this;
  }
  sort(_fields: Record<string, number>) {
    return this;
  }
  populate(_path: string, _fields?: string) {
    return this;
  }
  private applyExclusions(val: any): any {
    if (!val || this.excludedFields.length === 0) return val;
    if (Array.isArray(val)) {
      val.forEach((item) => {
        if (item && typeof item === 'object') {
          for (const f of this.excludedFields) {
            delete (item as any)[f];
          }
        }
      });
      return val;
    }
    if (typeof val === 'object') {
      for (const f of this.excludedFields) {
        delete (val as any)[f];
      }
      return val;
    }
    return val;
  }
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.executor().then((val) => {
      const filtered = this.applyExclusions(val);
      return onfulfilled ? onfulfilled(filtered) : (filtered as unknown as TResult1);
    }, onrejected);
  }
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<T | TResult> {
    return this.executor().catch(onrejected);
  }
}

const User = {
  async findOne(query: { email?: string; googleId?: string; _id?: string; id?: string }) {
    let sql = 'SELECT * FROM users WHERE ';
    const args: any[] = [];

    if (query.email) {
      sql += 'LOWER(email) = LOWER(?)';
      args.push(query.email);
    } else if (query.googleId) {
      sql += 'google_id = ?';
      args.push(query.googleId);
    } else if (query._id || query.id) {
      sql += 'id = ?';
      args.push(query._id || query.id);
    } else {
      return null;
    }

    sql += ' LIMIT 1';
    const result = await db.execute({ sql, args });
    if (result.rows.length === 0) return null;
    return mapUserRow(result.rows[0]);
  },

  findById(id: string) {
    return new QueryHelper<IUser | null>(async () => {
      const result = await db.execute({
        sql: 'SELECT * FROM users WHERE id = ? LIMIT 1',
        args: [id],
      });
      if (result.rows.length === 0) return null;
      return mapUserRow(result.rows[0]);
    });
  },

  async findByIdAndDelete(id: string) {
    const user = await this.findOne({ _id: id });
    if (user) {
      await db.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [id] });
    }
    return user;
  },

  find(_query: any = {}) {
    return new QueryHelper<IUser[]>(async () => {
      const result = await db.execute({
        sql: 'SELECT * FROM users ORDER BY created_at DESC',
        args: [],
      });
      return result.rows.map(mapUserRow);
    });
  },

  async create(data: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    googleId?: string;
    avatar?: string;
    role?: 'user' | 'admin';
  }): Promise<IUser> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    let hashedPassword = data.password;
    if (hashedPassword && !hashedPassword.startsWith('$2')) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(hashedPassword, salt);
    }

    await db.execute({
      sql: `
        INSERT INTO users (id, name, email, phone, password, google_id, avatar, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        data.name,
        data.email.toLowerCase(),
        data.phone || null,
        hashedPassword || null,
        data.googleId || null,
        data.avatar || null,
        data.role || 'user',
        now,
        now,
      ],
    });

    return mapUserRow({
      id,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      password: hashedPassword,
      google_id: data.googleId,
      avatar: data.avatar,
      role: data.role || 'user',
      created_at: now,
      updated_at: now,
    });
  },

  async countDocuments(query?: { createdAt?: { $gte?: Date } }) {
    if (query?.createdAt?.$gte) {
      const since = query.createdAt.$gte.toISOString();
      const res = await db.execute({
        sql: 'SELECT COUNT(*) as cnt FROM users WHERE created_at >= ?',
        args: [since],
      });
      return Number(res.rows[0]?.cnt || 0);
    }
    const res = await db.execute({ sql: 'SELECT COUNT(*) as cnt FROM users', args: [] });
    return Number(res.rows[0]?.cnt || 0);
  },
};

export default User;
