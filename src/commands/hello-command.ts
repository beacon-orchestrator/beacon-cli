import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { HelloService } from '../services/hello-service';

interface HelloOptions {
  name?: string;
}

export class HelloCommand extends BaseCommand {
  readonly name = 'hello';
  readonly description = 'Say hello and log the interaction';

  constructor(private helloService: HelloService) {
    super();
  }

  register(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .option('-n, --name <name>', 'Name to greet')
      .action((options: HelloOptions) => this.execute(options));
  }

  async execute(options: HelloOptions): Promise<void> {
    const message = await this.helloService.sayHello(options.name);
    console.log(message);
  }
}
