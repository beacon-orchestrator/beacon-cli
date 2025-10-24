#!/usr/bin/env node

import { Command } from 'commander';
import { CommandRegistry } from './cli/command-registry';
import { HelloCommand } from './commands/hello-command';
import { LogsCommand } from './commands/logs-command';
import { ClearLogsCommand } from './commands/clear-logs-command';
import { ListWorkflowsCommand } from './commands/list-workflows-command';
import { NewCommand } from './commands/new-command';
import { DatabaseConnection } from './db/connection';
import { LogRepository } from './repositories/log-repository';
import { WorkflowRepository } from './repositories/workflow-repository';
import { HelloService } from './services/hello-service';
import { LogsService } from './services/logs-service';
import { ClearLogsService } from './services/clear-logs-service';
import { WorkflowService } from './services/workflow-service';

async function main() {
  try {
    // Initialize database
    await DatabaseConnection.initialize();

    // Set up dependency injection
    const logRepository = new LogRepository();
    const workflowRepository = new WorkflowRepository();
    const helloService = new HelloService(logRepository);
    const logsService = new LogsService(logRepository);
    const clearLogsService = new ClearLogsService(logRepository);
    const workflowService = new WorkflowService(workflowRepository, logRepository);
    const helloCommand = new HelloCommand(helloService);
    const logsCommand = new LogsCommand(logsService);
    const clearLogsCommand = new ClearLogsCommand(clearLogsService);
    const listWorkflowsCommand = new ListWorkflowsCommand(workflowService);
    const newCommand = new NewCommand(workflowService);

    // Create program
    const program = new Command();
    program
      .name('beacon')
      .description('CLI for persistent workflow state management with LLM prompting')
      .version('0.1.0');

    // Register commands
    const registry = new CommandRegistry(program);
    registry.register(helloCommand);
    registry.register(logsCommand);
    registry.register(clearLogsCommand);
    registry.register(listWorkflowsCommand);
    registry.register(newCommand);

    // If no command specified, show help and exit successfully
    if (process.argv.length === 2) {
      program.outputHelp();
      process.exit(0);
    }

    // Parse arguments
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
