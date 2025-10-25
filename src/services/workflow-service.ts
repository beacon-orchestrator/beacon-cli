import { WorkflowRepository } from '../repositories/workflow-repository';
import { LogRepository } from '../repositories/log-repository';
import { NoteRepository } from '../repositories/note-repository';
import { Workflow, Note } from '../domain/types';
import { WorkflowValidator } from './workflow-validator';
import { StageExecutorFactory } from '../executors/stage-executor-factory';
import chalk from 'chalk';

export class WorkflowService {
  private stageExecutorFactory: StageExecutorFactory;

  constructor(
    private workflowRepository: WorkflowRepository,
    private noteRepository: NoteRepository,
    stageExecutorFactory: StageExecutorFactory,
    private logRepository?: LogRepository
  ) {
    this.stageExecutorFactory = stageExecutorFactory;
  }

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

    // Create workflow run record
    const runId = await this.noteRepository.createWorkflowRun(workflowName);

    try {
      // Load workflow definition
      const definition = await this.workflowRepository.getWorkflowDefinition(
        workflowName
      );

      if (!definition) {
        await this.noteRepository.updateRunStatus(runId, 'failed');
        console.log(
          `Workflow not found: ${workflowName}. Create .beacon/workflows/${workflowName}.yml to get started.`
        );
        return;
      }

      // Validate workflow schema
      const validation = WorkflowValidator.validate(definition);
      if (!validation.valid) {
        await this.noteRepository.updateRunStatus(runId, 'failed');
        console.error(`\nWorkflow validation failed for ${workflowName}.yml:\n`);
        validation.errors.forEach((err) => console.error(`  • ${err}`));
        console.error(`\nFix these errors and try again.\n`);
        throw new Error('Workflow validation failed');
      }

      // Execute each stage using the executor pattern
      console.log(); // Add newline before first stage
      const allNotes: Note[] = [];

      for (let i = 0; i < definition.stages.length; i++) {
        const stage = definition.stages[i];

        // Create stage execution record
        const stageId = await this.noteRepository.createStageExecution(
          runId,
          i,
          stage.title
        );

        // Execute stage with context
        const executor = this.stageExecutorFactory.create(stage);
        await executor.execute(stage, {
          runId,
          stageId,
          previousNotes: allNotes,
          systemPrompt: definition.system_prompt,
        });

        // Collect notes from this stage
        const stageNotes = await this.noteRepository.getNotesForStage(stageId);
        allNotes.push(...stageNotes);
      }

      // Mark workflow run as completed
      await this.noteRepository.updateRunStatus(runId, 'completed');

      console.log(chalk.green.bold('✓') + ` Workflow completed: ` + chalk.cyan(workflowName) + '\n');
    } catch (error) {
      // Mark workflow run as failed
      await this.noteRepository.updateRunStatus(runId, 'failed');
      throw error;
    }
  }
}
