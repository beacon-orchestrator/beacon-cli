import { LogsCommand } from '../../../src/commands/logs-command';
import { LogsService } from '../../../src/services/logs-service';
import { Command } from 'commander';

describe('LogsCommand', () => {
  let logsCommand: LogsCommand;
  let mockLogsService: jest.Mocked<LogsService>;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    mockLogsService = {
      getRecentLogs: jest.fn(),
    } as unknown as jest.Mocked<LogsService>;

    logsCommand = new LogsCommand(mockLogsService);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('properties', () => {
    it('should have correct name and description', () => {
      expect(logsCommand.name).toBe('logs');
      expect(logsCommand.description).toBe('View recent command logs');
    });
  });

  describe('execute', () => {
    it('should display recent logs', async () => {
      const mockLogs = [
        {
          id: 1,
          command: 'hello',
          args: { name: 'Alice' },
          timestamp: new Date('2024-01-01T12:00:00Z'),
        },
        {
          id: 2,
          command: 'hello',
          args: { name: null },
          timestamp: new Date('2024-01-01T12:01:00Z'),
        },
      ];

      mockLogsService.getRecentLogs.mockResolvedValue(mockLogs);

      await logsCommand.execute({});

      expect(mockLogsService.getRecentLogs).toHaveBeenCalledWith(10);
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should respect limit option', async () => {
      mockLogsService.getRecentLogs.mockResolvedValue([]);

      await logsCommand.execute({ limit: 5 });

      expect(mockLogsService.getRecentLogs).toHaveBeenCalledWith(5);
    });

    it('should display message when no logs exist', async () => {
      mockLogsService.getRecentLogs.mockResolvedValue([]);

      await logsCommand.execute({});

      expect(consoleLogSpy).toHaveBeenCalledWith('No logs found.');
    });
  });

  describe('register', () => {
    it('should register command with program', () => {
      const program = new Command();
      logsCommand.register(program);

      const commands = program.commands;
      expect(commands).toHaveLength(1);
      expect(commands[0].name()).toBe('logs');
    });
  });
});
