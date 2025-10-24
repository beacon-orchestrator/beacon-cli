import { Database } from 'sqlite';
import { DatabaseConnection } from '../db/connection';

export abstract class BaseRepository {
  protected getConnection(): Database {
    return DatabaseConnection.getConnection();
  }
}
