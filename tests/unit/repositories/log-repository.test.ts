import { LogRepository } from '../../../src/repositories/log-repository';
import { setupTestDatabase, teardownTestDatabase } from '../../helpers/mock-database';

describe('LogRepository', () => {
  let logRepository: LogRepository;

  beforeEach(async () => {
    await setupTestDatabase();
    logRepository = new LogRepository();
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  describe('create', () => {
    it('should insert a command log into the database', async () => {
      const input = {
        command: 'hello',
        args: { name: 'Test' },
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      await logRepository.create(input);

      const count = await logRepository.count();
      expect(count).toBe(1);
    });

    it('should handle logs without args', async () => {
      const input = {
        command: 'hello',
        args: {},
        timestamp: new Date(),
      };

      await logRepository.create(input);

      const logs = await logRepository.findRecent(1);
      expect(logs).toHaveLength(1);
      expect(logs[0].args).toEqual({});
    });
  });

  describe('findRecent', () => {
    it('should return recent logs in descending order', async () => {
      const log1 = {
        command: 'hello',
        args: { name: 'First' },
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };
      const log2 = {
        command: 'hello',
        args: { name: 'Second' },
        timestamp: new Date('2024-01-02T00:00:00Z'),
      };

      await logRepository.create(log1);
      await logRepository.create(log2);

      const logs = await logRepository.findRecent(10);

      expect(logs).toHaveLength(2);
      expect(logs[0].args).toEqual({ name: 'Second' });
      expect(logs[1].args).toEqual({ name: 'First' });
    });

    it('should respect the limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
        await logRepository.create({
          command: 'test',
          args: { index: i },
          timestamp: new Date(),
        });
      }

      const logs = await logRepository.findRecent(3);
      expect(logs).toHaveLength(3);
    });

    it('should return empty array when no logs exist', async () => {
      const logs = await logRepository.findRecent(10);
      expect(logs).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return 0 when no logs exist', async () => {
      const count = await logRepository.count();
      expect(count).toBe(0);
    });

    it('should return correct count of logs', async () => {
      for (let i = 0; i < 3; i++) {
        await logRepository.create({
          command: 'test',
          args: {},
          timestamp: new Date(),
        });
      }

      const count = await logRepository.count();
      expect(count).toBe(3);
    });
  });
});
