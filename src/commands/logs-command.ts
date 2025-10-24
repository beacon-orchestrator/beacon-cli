import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { LogsService } from '../services/logs-service';

interface LogsOptions {
  limit?: number;
}

export class LogsCommand extends BaseCommand {
  readonly name = 'logs';
  readonly description = 'View recent command logs';

  constructor(private logsService: LogsService) {
    super();
  }

  register(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .option('-l, --limit <number>', 'Number of logs to display', '10')
      .action((options: LogsOptions) => this.execute(options));
  }

  async execute(options: LogsOptions): Promise<void> {
    const limit = options.limit ? parseInt(String(options.limit), 10) : 10;
    const logs = await this.logsService.getRecentLogs(limit);

    if (logs.length === 0) {
      console.log('No logs found.');
      return;
    }

    console.log('\nRecent command logs:\n');
    logs.forEach((log) => {
      const timestamp = log.timestamp.toISOString().replace('T', ' ').split('.')[0];
      const argsStr = JSON.stringify(log.args);
      console.log(`[${timestamp}] ${log.command} ${argsStr}`);
    });
  }
}
