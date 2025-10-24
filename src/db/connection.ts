import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { runMigrations } from './migrations';

export class DatabaseConnection {
  private static instance: Database | null = null;

  static async initialize(): Promise<Database> {
    if (this.instance) {
      return this.instance;
    }

    const dbPath = this.getDbPath();
    await this.ensureDirectoryExists(dbPath);

    this.instance = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await runMigrations(this.instance);
    return this.instance;
  }

  static getConnection(): Database {
    if (!this.instance) {
      throw new Error('Database not initialized. Call DatabaseConnection.initialize() first.');
    }
    return this.instance;
  }

  static async close(): Promise<void> {
    if (this.instance) {
      await this.instance.close();
      this.instance = null;
    }
  }

  private static getDbPath(): string {
    const configDir = this.getConfigDirectory();
    return path.join(configDir, 'beacon.db');
  }

  private static getConfigDirectory(): string {
    const platform = os.platform();

    if (platform === 'win32') {
      return path.join(process.env.APPDATA || os.homedir(), 'beacon');
    } else if (platform === 'darwin') {
      return path.join(os.homedir(), 'Library', 'Application Support', 'beacon');
    } else {
      // Linux and other Unix-like systems (XDG standard)
      const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
      return path.join(xdgConfig, 'beacon');
    }
  }

  private static async ensureDirectoryExists(dbPath: string): Promise<void> {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // For testing: allows setting a custom instance (e.g., in-memory database)
  static setInstance(instance: Database): void {
    this.instance = instance;
  }
}
