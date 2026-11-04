import Database from "better-sqlite3";

export const db = new Database(process.env.DB_PATH ?? "notes.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE, token TEXT UNIQUE, is_admin INTEGER DEFAULT 0);
  CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT, body TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
`);
