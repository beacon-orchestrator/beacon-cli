import { HelloService } from '../../../src/services/hello-service';
import { LogRepository } from '../../../src/repositories/log-repository';

describe('HelloService', () => {
  let helloService: HelloService;
  let mockLogRepository: jest.Mocked<LogRepository>;

  beforeEach(() => {
    mockLogRepository = {
      create: jest.fn(),
      findRecent: jest.fn(),
      count: jest.fn(),
    } as unknown as jest.Mocked<LogRepository>;

    helloService = new HelloService(mockLogRepository);
  });

  describe('sayHello', () => {
    it('should return "Hello, World!" when no name is provided', async () => {
      const result = await helloService.sayHello();
      expect(result).toBe('Hello, World!');
    });

    it('should return personalized greeting when name is provided', async () => {
      const result = await helloService.sayHello('Alice');
      expect(result).toBe('Hello, Alice!');
    });

    it('should log the interaction to repository', async () => {
      await helloService.sayHello('Bob');

      expect(mockLogRepository.create).toHaveBeenCalledTimes(1);
      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'hello',
          args: { name: 'Bob' },
          timestamp: expect.any(Date),
        })
      );
    });

    it('should log with null name when no name provided', async () => {
      await helloService.sayHello();

      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'hello',
          args: { name: null },
        })
      );
    });
  });
});
