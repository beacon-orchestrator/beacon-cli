import { Command } from 'commander';
import { BaseCommand } from '../commands/base-command';

export class CommandRegistry {
  constructor(private program: Command) {}

  register(command: BaseCommand): void {
    command.register(this.program);
  }

  registerAll(commands: BaseCommand[]): void {
    commands.forEach((command) => this.register(command));
  }
}
