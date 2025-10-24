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

    await withLoading(`Running workflow: ${workflowName}`, async () => {
      // Simulate 2 second delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
    });
  }
}
