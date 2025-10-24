import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { runMigrations } from '../../src/db/migrations';
import { DatabaseConnection } from '../../src/db/connection';

export async function createInMemoryDatabase(): Promise<Database> {
  const db = await open({
    filename: ':memory:',
    driver: sqlite3.Database,
  });

  await runMigrations(db);
  return db;
}

export async function setupTestDatabase(): Promise<void> {
  const db = await createInMemoryDatabase();
  DatabaseConnection.setInstance(db);
}

export async function teardownTestDatabase(): Promise<void> {
  await DatabaseConnection.close();
}
