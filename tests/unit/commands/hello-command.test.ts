import { HelloCommand } from '../../../src/commands/hello-command';
import { HelloService } from '../../../src/services/hello-service';
import { Command } from 'commander';

describe('HelloCommand', () => {
  let helloCommand: HelloCommand;
  let mockHelloService: jest.Mocked<HelloService>;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    mockHelloService = {
      sayHello: jest.fn(),
    } as unknown as jest.Mocked<HelloService>;

    helloCommand = new HelloCommand(mockHelloService);

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('properties', () => {
    it('should have correct name and description', () => {
      expect(helloCommand.name).toBe('hello');
      expect(helloCommand.description).toBe('Say hello and log the interaction');
    });
  });

  describe('execute', () => {
    it('should call service and log the result', async () => {
      mockHelloService.sayHello.mockResolvedValue('Hello, World!');

      await helloCommand.execute({});

      expect(mockHelloService.sayHello).toHaveBeenCalledWith(undefined);
      expect(consoleLogSpy).toHaveBeenCalledWith('Hello, World!');
    });

    it('should pass name option to service', async () => {
      mockHelloService.sayHello.mockResolvedValue('Hello, Alice!');

      await helloCommand.execute({ name: 'Alice' });

      expect(mockHelloService.sayHello).toHaveBeenCalledWith('Alice');
      expect(consoleLogSpy).toHaveBeenCalledWith('Hello, Alice!');
    });
  });

  describe('register', () => {
    it('should register command with program', () => {
      const program = new Command();
      helloCommand.register(program);

      const commands = program.commands;
      expect(commands).toHaveLength(1);
      expect(commands[0].name()).toBe('hello');
    });
  });
});
