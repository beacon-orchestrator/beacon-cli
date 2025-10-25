import { WorkflowStage, ExecutionContext } from '../domain/types';

export interface StageExecutor {
  execute(stage: WorkflowStage, context?: ExecutionContext): Promise<void>;
}
