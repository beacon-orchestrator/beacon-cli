import { LogRepository } from '../../../src/repositories/log-repository';
import { setupTestDatabase, teardownTestDatabase } from '../../helpers/mock-database';

describe('LogRepository - clearAll', () => {
  let logRepository: LogRepository;

  beforeEach(async () => {
    await setupTestDatabase();
    logRepository = new LogRepository();
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  it('should delete all logs and return count', async () => {
    // Add some logs
    await logRepository.create({
      command: 'test1',
      args: {},
      timestamp: new Date(),
    });
    await logRepository.create({
      command: 'test2',
      args: {},
      timestamp: new Date(),
    });
    await logRepository.create({
      command: 'test3',
      args: {},
      timestamp: new Date(),
    });

    const deletedCount = await logRepository.clearAll();

    expect(deletedCount).toBe(3);
    const remainingCount = await logRepository.count();
    expect(remainingCount).toBe(0);
  });

  it('should return 0 when no logs exist', async () => {
    const deletedCount = await logRepository.clearAll();

    expect(deletedCount).toBe(0);
  });
});
