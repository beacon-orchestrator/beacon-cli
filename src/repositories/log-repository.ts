import { BaseRepository } from './base-repository';
import { CommandLog, CreateCommandLogInput } from '../domain/types';

export class LogRepository extends BaseRepository {
  async create(input: CreateCommandLogInput): Promise<void> {
    const db = this.getConnection();
    await db.run(
      'INSERT INTO command_logs (command, args, timestamp) VALUES (?, ?, ?)',
      input.command,
      JSON.stringify(input.args),
      input.timestamp.toISOString()
    );
  }

  async findRecent(limit: number = 10): Promise<CommandLog[]> {
    const db = this.getConnection();
    const rows = await db.all<Array<{ id: number; command: string; args: string; timestamp: string }>>(
      'SELECT id, command, args, timestamp FROM command_logs ORDER BY timestamp DESC LIMIT ?',
      limit
    );

    return rows.map((row) => ({
      id: row.id,
      command: row.command,
      args: JSON.parse(row.args),
      timestamp: new Date(row.timestamp),
    }));
  }

  async count(): Promise<number> {
    const db = this.getConnection();
    const result = await db.get<{ count: number }>('SELECT COUNT(*) as count FROM command_logs');
    return result?.count || 0;
  }

  async clearAll(): Promise<number> {
    const db = this.getConnection();
    const count = await this.count();
    await db.run('DELETE FROM command_logs');
    return count;
  }
}
