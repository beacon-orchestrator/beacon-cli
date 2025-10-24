import { WorkflowRepository } from '../repositories/workflow-repository';

export class WorkflowService {
  constructor(private workflowRepository: WorkflowRepository) {}

  async listWorkflows(): Promise<string> {
    const result = await this.workflowRepository.getWorkflowFiles();

    if (!result.success) {
      return `Error reading workflows: ${result.error}`;
    }

    const files = result.files || [];

    if (files.length === 0) {
      return 'No workflows found. Create .beacon/workflows/ to get started.';
    }

    // Strip .yml extension and return as simple list
    const workflowNames = files.map((file) => file.replace(/\.yml$/, ''));
    return workflowNames.join('\n');
  }
}
