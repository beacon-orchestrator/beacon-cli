import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { WorkflowService } from '../services/workflow-service';

export class ListWorkflowsCommand extends BaseCommand {
  readonly name = 'list-workflows';
  readonly description = 'List available workflows in .beacon/workflows/';

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
    const output = await this.workflowService.listWorkflows();
    console.log(output);
  }
}
