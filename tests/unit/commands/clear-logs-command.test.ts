import { ClearLogsCommand } from '../../../src/commands/clear-logs-command';
import { ClearLogsService } from '../../../src/services/clear-logs-service';
import { Command } from 'commander';

describe('ClearLogsCommand', () => {
  let clearLogsCommand: ClearLogsCommand;
  let mockClearLogsService: jest.Mocked<ClearLogsService>;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    mockClearLogsService = {
      clearAllLogs: jest.fn(),
    } as unknown as jest.Mocked<ClearLogsService>;

    clearLogsCommand = new ClearLogsCommand(mockClearLogsService);
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('properties', () => {
    it('should have correct name and description', () => {
      expect(clearLogsCommand.name).toBe('clear-logs');
      expect(clearLogsCommand.description).toBe('Clear all command logs');
    });
  });

  describe('execute', () => {
    it('should call service to clear logs', async () => {
      mockClearLogsService.clearAllLogs.mockResolvedValue(3);

      await clearLogsCommand.execute();

      expect(mockClearLogsService.clearAllLogs).toHaveBeenCalledTimes(1);
    });

    it('should display success message with count', async () => {
      mockClearLogsService.clearAllLogs.mockResolvedValue(5);

      await clearLogsCommand.execute();

      expect(consoleLogSpy).toHaveBeenCalledWith('Cleared 5 log(s).');
    });

    it('should handle zero logs cleared', async () => {
      mockClearLogsService.clearAllLogs.mockResolvedValue(0);

      await clearLogsCommand.execute();

      expect(consoleLogSpy).toHaveBeenCalledWith('No logs to clear.');
    });
  });

  describe('register', () => {
    it('should register command with program', () => {
      const program = new Command();
      clearLogsCommand.register(program);

      const commands = program.commands;
      expect(commands).toHaveLength(1);
      expect(commands[0].name()).toBe('clear-logs');
    });
  });
});
