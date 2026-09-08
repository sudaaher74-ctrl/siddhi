import { createClient, Client } from "@libsql/client";
import { env } from "./env";

export let db: Client = createClient({
  url: env.tursoDatabaseUrl,
  authToken: env.tursoAuthToken || undefined,
});

export const setDbClient = (newClient: Client) => {
  db = newClient;
};

export const initTables = async (client: Client = db) => {
  // SQLite table schemas
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT,
      google_id TEXT UNIQUE,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      arrows INTEGER NOT NULL,
      score INTEGER NOT NULL,
      avg REAL NOT NULL,
      tens INTEGER NOT NULL,
      note TEXT DEFAULT '',
      distance TEXT DEFAULT '',
      bow TEXT DEFAULT '',
      arrow_data TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  try {
    await client.execute(`ALTER TABLE sessions ADD COLUMN bow TEXT DEFAULT ''`);
  } catch {
    // Column may already exist
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      target TEXT NOT NULL,
      current TEXT NOT NULL,
      deadline TEXT NOT NULL,
      progress REAL NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      stats TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'New',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
};

const connectDB = async () => {
  try {
    await initTables(db);
    console.log(`Turso / LibSQL Database connected (${env.tursoDatabaseUrl})`);
  } catch (error) {
    console.error("Failed to initialize Turso database:", error);
    process.exit(1);
  }
};

export default connectDB;
