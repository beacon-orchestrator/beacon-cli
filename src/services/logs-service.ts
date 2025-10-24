import { LogRepository } from '../repositories/log-repository';
import { CommandLog } from '../domain/types';

export class LogsService {
  constructor(private logRepository: LogRepository) {}

  async getRecentLogs(limit: number = 10): Promise<CommandLog[]> {
    return this.logRepository.findRecent(limit);
  }
}
