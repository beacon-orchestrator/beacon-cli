import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { NotesDisplayService } from '../services/notes-display-service';
import chalk from 'chalk';

interface NotesOptions {
  run?: number;
  list?: boolean;
}

export class NotesCommand extends BaseCommand {
  readonly name = 'notes';
  readonly description = 'View notes from workflow runs';

  constructor(private notesDisplayService: NotesDisplayService) {
    super();
  }

  register(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .option('-r, --run <id>', 'Show notes for specific run ID')
      .option('-l, --list', 'List recent workflow runs')
      .action((options: NotesOptions) => this.execute(options));
  }

  async execute(options: NotesOptions): Promise<void> {
    if (options.list) {
      await this.listRuns();
      return;
    }

    if (options.run) {
      await this.showRunNotes(options.run);
      return;
    }

    // Default: show notes from latest run
    await this.showLatestNotes();
  }

  private async listRuns(): Promise<void> {
    const runs = await this.notesDisplayService.getRecentRuns(20);

    if (runs.length === 0) {
      console.log('No workflow runs found.');
      return;
    }

    console.log(chalk.bold('\nRecent workflow runs:\n'));
    runs.forEach((run) => {
      const timestamp = run.startedAt.toISOString().replace('T', ' ').split('.')[0];
      const status = this.formatStatus(run.status);
      console.log(`  ${chalk.cyan(run.id)} - ${run.workflowName} ${status} (${timestamp})`);
    });
    console.log();
  }

  private async showRunNotes(runId: number): Promise<void> {
    const runWithNotes = await this.notesDisplayService.getRunWithNotes(runId);

    if (!runWithNotes) {
      console.log(`Run #${runId} not found.`);
      return;
    }

    this.displayRunNotes(runWithNotes);
  }

  private async showLatestNotes(): Promise<void> {
    const runWithNotes = await this.notesDisplayService.getLatestRunWithNotes();

    if (!runWithNotes) {
      console.log('No workflow runs found.');
      return;
    }

    this.displayRunNotes(runWithNotes);
  }

  private displayRunNotes(runWithNotes: {
    run: { id?: number; workflowName: string; startedAt: Date; status: string };
    stages: Array<{ stage: { stageTitle: string }; notes: Array<{ content: string }> }>;
  }): void {
    const { run, stages } = runWithNotes;

    console.log();
    console.log(chalk.bold.cyan(`Workflow: ${run.workflowName}`));
    console.log(chalk.gray(`Run ID: ${run.id} | Status: ${this.formatStatus(run.status)} | ${run.startedAt.toISOString()}`));
    console.log();

    let totalNotes = 0;
    for (const { stage, notes } of stages) {
      if (notes.length > 0) {
        console.log(chalk.bold.blue(`Stage: ${stage.stageTitle}`));
        notes.forEach((note, index) => {
          console.log(chalk.gray(`  Note ${index + 1}:`));
          // Indent the note content
          const indentedContent = note.content
            .split('\n')
            .map((line) => `    ${line}`)
            .join('\n');
          console.log(indentedContent);
          console.log();
          totalNotes++;
        });
      }
    }

    if (totalNotes === 0) {
      console.log(chalk.gray('No notes found in this workflow run.'));
    }

    console.log();
  }

  private formatStatus(status: string): string {
    switch (status) {
      case 'completed':
        return chalk.green('✓ completed');
      case 'failed':
        return chalk.red('✗ failed');
      case 'running':
        return chalk.yellow('⋯ running');
      default:
        return status;
    }
  }
}
