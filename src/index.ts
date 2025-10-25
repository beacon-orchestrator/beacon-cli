#!/usr/bin/env node

import { Command } from 'commander';
import { CommandRegistry } from './cli/command-registry';
import { LogsCommand } from './commands/logs-command';
import { ClearLogsCommand } from './commands/clear-logs-command';
import { NewCommand } from './commands/new-command';
import { NotesCommand } from './commands/notes-command';
import { DatabaseConnection } from './db/connection';
import { LogRepository } from './repositories/log-repository';
import { WorkflowRepository } from './repositories/workflow-repository';
import { NoteRepository } from './repositories/note-repository';
import { LogsService } from './services/logs-service';
import { ClearLogsService } from './services/clear-logs-service';
import { WorkflowService } from './services/workflow-service';
import { NotesService } from './services/notes-service';
import { NotesDisplayService } from './services/notes-display-service';
import { StageExecutorFactory } from './executors/stage-executor-factory';

async function main() {
  try {
    // Initialize database
    await DatabaseConnection.initialize();

    // Set up dependency injection
    const logRepository = new LogRepository();
    const workflowRepository = new WorkflowRepository();
    const noteRepository = new NoteRepository();
    const notesService = new NotesService();
    const notesDisplayService = new NotesDisplayService(noteRepository);
    const stageExecutorFactory = new StageExecutorFactory(noteRepository, notesService);
    const logsService = new LogsService(logRepository);
    const clearLogsService = new ClearLogsService(logRepository);
    const workflowService = new WorkflowService(
      workflowRepository,
      noteRepository,
      stageExecutorFactory,
      logRepository
    );
    const logsCommand = new LogsCommand(logsService);
    const clearLogsCommand = new ClearLogsCommand(clearLogsService);
    const newCommand = new NewCommand(workflowService);
    const notesCommand = new NotesCommand(notesDisplayService);

    // Create program
    const program = new Command();
    program
      .name('beacon')
      .description('CLI for persistent workflow state management with LLM prompting')
      .version('0.1.0');

    // Register commands
    const registry = new CommandRegistry(program);
    registry.register(newCommand);
    registry.register(notesCommand);
    registry.register(logsCommand);
    registry.register(clearLogsCommand);

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
