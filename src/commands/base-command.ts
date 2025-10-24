import { Command } from 'commander';

export abstract class BaseCommand {
  abstract readonly name: string;
  abstract readonly description: string;

  abstract register(program: Command): void;
  abstract execute(...args: unknown[]): Promise<void>;
}
