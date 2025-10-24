import { HelloService } from '../../src/services/hello-service';
import { LogRepository } from '../../src/repositories/log-repository';
import { setupTestDatabase, teardownTestDatabase } from '../helpers/mock-database';

describe('Hello Workflow Integration', () => {
  let helloService: HelloService;
  let logRepository: LogRepository;

  beforeEach(async () => {
    await setupTestDatabase();
    logRepository = new LogRepository();
    helloService = new HelloService(logRepository);
  });

  afterEach(async () => {
    await teardownTestDatabase();
  });

  it('should say hello and persist log to database', async () => {
    const greeting = await helloService.sayHello('Integration Test');

    expect(greeting).toBe('Hello, Integration Test!');

    // Verify log was persisted
    const logs = await logRepository.findRecent(1);
    expect(logs).toHaveLength(1);
    expect(logs[0].command).toBe('hello');
    expect(logs[0].args).toEqual({ name: 'Integration Test' });
  });

  it('should handle multiple hello calls', async () => {
    await helloService.sayHello('First');
    await helloService.sayHello('Second');
    await helloService.sayHello('Third');

    const count = await logRepository.count();
    expect(count).toBe(3);

    const logs = await logRepository.findRecent(10);
    expect(logs).toHaveLength(3);
    expect(logs[0].args).toEqual({ name: 'Third' }); // Most recent first
    expect(logs[2].args).toEqual({ name: 'First' }); // Oldest last
  });

  it('should persist timestamps correctly', async () => {
    const beforeTime = new Date();
    await helloService.sayHello('Test');
    const afterTime = new Date();

    const logs = await logRepository.findRecent(1);
    expect(logs[0].timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
    expect(logs[0].timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
  });
});
