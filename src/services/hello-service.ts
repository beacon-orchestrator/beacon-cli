import { LogRepository } from '../repositories/log-repository';

export class HelloService {
  constructor(private logRepository: LogRepository) {}

  async sayHello(name?: string): Promise<string> {
    const greeting = name ? `Hello, ${name}!` : 'Hello, World!';

    // Log the interaction to database
    await this.logRepository.create({
      command: 'hello',
      args: { name: name || null },
      timestamp: new Date(),
    });

    return greeting;
  }
}
