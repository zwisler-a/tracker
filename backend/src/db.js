import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

const DB_PATH = process.env.DB_PATH || './data/tracker.db'
mkdirSync(dirname(DB_PATH), { recursive: true })

export const db = await open({ filename: DB_PATH, driver: sqlite3.Database })

await db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL,
    color TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS entries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT    NOT NULL,
    slot        INTEGER NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    UNIQUE(date, slot)
  );

  CREATE TABLE IF NOT EXISTS moods (
    date TEXT PRIMARY KEY,
    mood INTEGER NOT NULL
  );
`)