import { Database } from 'sqlite';
import * as fs from 'fs';
import * as path from 'path';

export async function runMigrations(db: Database): Promise<void> {
  // Create migrations tracking table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL
    )
  `);

  // Try both dist and src directories for migrations
  let migrationsDir = path.join(__dirname, 'migrations');

  // If not found in dist, try src (for development)
  if (!fs.existsSync(migrationsDir)) {
    migrationsDir = path.join(__dirname, '../../src/db/migrations');
  }

  // Check if migrations directory exists
  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const migrationName = file.replace('.sql', '');

    // Check if migration already applied
    const existing = await db.get(
      'SELECT id FROM _migrations WHERE name = ?',
      migrationName
    );

    if (existing) {
      continue;
    }

    // Read and execute migration
    const migrationPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    await db.exec(sql);

    // Record migration
    await db.run(
      'INSERT INTO _migrations (name, applied_at) VALUES (?, ?)',
      migrationName,
      new Date().toISOString()
    );

    console.log(`Applied migration: ${migrationName}`);
  }
}
