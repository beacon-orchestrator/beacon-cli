import { Command } from 'commander';
import { select } from '@inquirer/prompts';
import { BaseCommand } from './base-command';
import { WorkflowService } from '../services/workflow-service';

export class NewCommand extends BaseCommand {
  readonly name = 'new';
  readonly description = 'Start a new workflow';

  constructor(private workflowService: WorkflowService) {
    super();
  }

  register(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .action(() => this.execute());
  }

  async execute(): Promise<void> {
    const workflows = await this.workflowService.getWorkflows();

    if (workflows.length === 0) {
      console.log('No workflows found. Create .beacon/workflows/ to get started.');
      return;
    }

    try {
      const choices = workflows.map((w) => ({
        name: w.name,
        value: w.name,
      }));

      const selectedWorkflow = await select({
        message: 'Select a workflow:',
        choices,
      });

      await this.workflowService.runWorkflow(selectedWorkflow);
    } catch (error) {
      // User cancelled (Ctrl+C) - exit silently
      return;
    }
  }
}
