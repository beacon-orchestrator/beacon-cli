import { WorkflowRepository } from '../repositories/workflow-repository';
import { LogRepository } from '../repositories/log-repository';
import { Workflow } from '../domain/types';
import { WorkflowValidator } from './workflow-validator';
import { StageExecutorFactory } from '../executors/stage-executor-factory';
import chalk from 'chalk';

export class WorkflowService {
  constructor(
    private workflowRepository: WorkflowRepository,
    private logRepository?: LogRepository
  ) {}

  async getWorkflows(): Promise<Workflow[]> {
    const result = await this.workflowRepository.getWorkflowFiles();

    if (!result.success) {
      return [];
    }

    const files = result.files || [];

    return files.map((fileName) => ({
      fileName,
      name: fileName.replace(/\.yml$/, ''),
    }));
  }

  async listWorkflows(): Promise<string> {
    const workflows = await this.getWorkflows();

    if (workflows.length === 0) {
      return 'No workflows found. Create .beacon/workflows/ to get started.';
    }

    return workflows.map((w) => w.name).join('\n');
  }

  async runWorkflow(workflowName: string): Promise<void> {
    // Log to database (but don't fail if logging fails)
    try {
      await this.logRepository?.create({
        command: 'new',
        args: { name: workflowName },
        timestamp: new Date(),
      });
    } catch (error) {
      // Logging failure shouldn't stop workflow execution
    }

    // Load workflow definition
    const definition = await this.workflowRepository.getWorkflowDefinition(
      workflowName
    );

    if (!definition) {
      console.log(
        `Workflow not found: ${workflowName}. Create .beacon/workflows/${workflowName}.yml to get started.`
      );
      return;
    }

    // Validate workflow schema
    const validation = WorkflowValidator.validate(definition);
    if (!validation.valid) {
      console.error(`\nWorkflow validation failed for ${workflowName}.yml:\n`);
      validation.errors.forEach((err) => console.error(`  • ${err}`));
      console.error(`\nFix these errors and try again.\n`);
      throw new Error('Workflow validation failed');
    }

    // Execute each stage using the executor pattern
    console.log(); // Add newline before first stage
    for (const stage of definition.stages) {
      const executor = StageExecutorFactory.create(stage);
      await executor.execute(stage);
    }

    console.log(chalk.green.bold('✓') + ` Workflow completed: ` + chalk.cyan(workflowName) + '\n');
  }
}
