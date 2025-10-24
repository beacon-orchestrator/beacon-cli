import { LogsService } from '../../../src/services/logs-service';
import { LogRepository } from '../../../src/repositories/log-repository';

describe('LogsService', () => {
  let logsService: LogsService;
  let mockLogRepository: jest.Mocked<LogRepository>;

  beforeEach(() => {
    mockLogRepository = {
      findRecent: jest.fn(),
    } as unknown as jest.Mocked<LogRepository>;

    logsService = new LogsService(mockLogRepository);
  });

  describe('getRecentLogs', () => {
    it('should return recent logs from repository', async () => {
      const mockLogs = [
        {
          id: 1,
          command: 'hello',
          args: { name: 'Test' },
          timestamp: new Date('2024-01-01T00:00:00Z'),
        },
      ];

      mockLogRepository.findRecent.mockResolvedValue(mockLogs);

      const result = await logsService.getRecentLogs(10);

      expect(result).toEqual(mockLogs);
      expect(mockLogRepository.findRecent).toHaveBeenCalledWith(10);
    });

    it('should use default limit of 10', async () => {
      mockLogRepository.findRecent.mockResolvedValue([]);

      await logsService.getRecentLogs();

      expect(mockLogRepository.findRecent).toHaveBeenCalledWith(10);
    });
  });
});
