import { WorkflowStage } from '../domain/types';

export interface StageExecutor {
  execute(stage: WorkflowStage): Promise<void>;
}
