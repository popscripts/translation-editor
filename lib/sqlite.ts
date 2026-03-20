import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "translations.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS translation_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    translations TEXT NOT NULL,
    keys_count INTEGER NOT NULL DEFAULT 0,
    created_date TEXT NOT NULL,
    updated_date TEXT NOT NULL
  )
`);

export type TranslationFileRecord = {
  id: number;
  name: string;
  translations: Record<string, string>;
  keys_count: number;
  created_date: string;
  updated_date: string;
};

type Row = {
  id: number;
  name: string;
  translations: string;
  keys_count: number;
  created_date: string;
  updated_date: string;
};

function parseRow(row: Row): TranslationFileRecord {
  return {
    ...row,
    translations: JSON.parse(row.translations) as Record<string, string>,
  };
}

export function listTranslationFiles(): TranslationFileRecord[] {
  const rows = db
    .prepare(
      `SELECT id, name, translations, keys_count, created_date, updated_date
       FROM translation_files
       ORDER BY datetime(updated_date) DESC`
    )
    .all() as Row[];

  return rows.map(parseRow);
}

export function createTranslationFile(input: {
  name: string;
  translations: Record<string, string>;
  keys_count: number;
}): TranslationFileRecord {
  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO translation_files (name, translations, keys_count, created_date, updated_date)
     VALUES (?, ?, ?, ?, ?)`
  );

  const result = insert.run(
    input.name,
    JSON.stringify(input.translations),
    input.keys_count,
    now,
    now
  );

  const row = db
    .prepare(
      `SELECT id, name, translations, keys_count, created_date, updated_date
       FROM translation_files
       WHERE id = ?`
    )
    .get(result.lastInsertRowid) as Row;

  return parseRow(row);
}

export function updateTranslationFile(
  id: number,
  input: { translations: Record<string, string>; keys_count: number }
): TranslationFileRecord | null {
  const now = new Date().toISOString();
  const update = db.prepare(
    `UPDATE translation_files
     SET translations = ?, keys_count = ?, updated_date = ?
     WHERE id = ?`
  );

  const result = update.run(JSON.stringify(input.translations), input.keys_count, now, id);
  if (result.changes === 0) {
    return null;
  }

  const row = db
    .prepare(
      `SELECT id, name, translations, keys_count, created_date, updated_date
       FROM translation_files
       WHERE id = ?`
    )
    .get(id) as Row;

  return parseRow(row);
}

export function deleteTranslationFile(id: number): boolean {
  const result = db.prepare(`DELETE FROM translation_files WHERE id = ?`).run(id);
  return result.changes > 0;
}
