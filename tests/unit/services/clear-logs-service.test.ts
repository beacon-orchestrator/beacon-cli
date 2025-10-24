import { ClearLogsService } from '../../../src/services/clear-logs-service';
import { LogRepository } from '../../../src/repositories/log-repository';

describe('ClearLogsService', () => {
  let clearLogsService: ClearLogsService;
  let mockLogRepository: jest.Mocked<LogRepository>;

  beforeEach(() => {
    mockLogRepository = {
      clearAll: jest.fn(),
    } as unknown as jest.Mocked<LogRepository>;

    clearLogsService = new ClearLogsService(mockLogRepository);
  });

  describe('clearAllLogs', () => {
    it('should call repository to clear all logs', async () => {
      await clearLogsService.clearAllLogs();

      expect(mockLogRepository.clearAll).toHaveBeenCalledTimes(1);
    });

    it('should return number of deleted logs', async () => {
      mockLogRepository.clearAll.mockResolvedValue(5);

      const result = await clearLogsService.clearAllLogs();

      expect(result).toBe(5);
    });
  });
});
