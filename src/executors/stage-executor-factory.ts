import { WorkflowStage } from '../domain/types';
import { StageExecutor } from './stage-executor';
import { PromptStageExecutor } from './prompt-stage-executor';
import { ClaudeCliService } from '../services/claude-cli-service';

export class StageExecutorFactory {
  static create(stage: WorkflowStage): StageExecutor {
    switch (stage.type) {
      case 'prompt': {
        const aiService = new ClaudeCliService();
        return new PromptStageExecutor(aiService);
      }
      default:
        throw new Error(`Unsupported stage type: ${stage.type}`);
    }
  }
}
