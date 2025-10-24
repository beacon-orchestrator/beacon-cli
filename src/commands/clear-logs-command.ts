import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { ClearLogsService } from '../services/clear-logs-service';

export class ClearLogsCommand extends BaseCommand {
  readonly name = 'clear-logs';
  readonly description = 'Clear all command logs';

  constructor(private clearLogsService: ClearLogsService) {
    super();
  }

  register(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .action(() => this.execute());
  }

  async execute(): Promise<void> {
    const count = await this.clearLogsService.clearAllLogs();

    if (count === 0) {
      console.log('No logs to clear.');
    } else {
      console.log(`Cleared ${count} log(s).`);
    }
  }
}
