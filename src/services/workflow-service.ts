import { WorkflowRepository } from '../repositories/workflow-repository';
import { LogRepository } from '../repositories/log-repository';
import { Workflow } from '../domain/types';
import { withLoading } from '../utils/loading';

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

    if (!definition || !definition.stages || definition.stages.length === 0) {
      console.log(
        `No stages defined in workflow: ${workflowName}. Add stages to .beacon/workflows/${workflowName}.yml`
      );
      return;
    }

    // Execute each stage with a loading spinner
    for (const stage of definition.stages) {
      await withLoading(`Running stage: ${stage.title}`, async () => {
        // 2 second delay per stage
        await new Promise((resolve) => setTimeout(resolve, 2000));
      });
    }
  }
}
