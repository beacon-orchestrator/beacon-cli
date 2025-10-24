import { LogRepository } from '../repositories/log-repository';

export class ClearLogsService {
  constructor(private logRepository: LogRepository) {}

  async clearAllLogs(): Promise<number> {
    return this.logRepository.clearAll();
  }
}
