import chalk from 'chalk';
import { WorkflowStage } from '../domain/types';
import { StageExecutor } from './stage-executor';
import { IAiService } from '../services/ai-service';

export class PromptStageExecutor implements StageExecutor {
  constructor(private aiService: IAiService) {}

  async execute(stage: WorkflowStage): Promise<void> {
    // Print stage indicator with blue arrow
    console.log(chalk.blue('▶') + ` Stage: ${stage.title}`);
    let hasOutput = false;

    await this.aiService.executePrompt(stage.prompt, {
      onStart: () => {
        if (!hasOutput) {
          hasOutput = true;
          // Add newline so content appears below stage title
          process.stdout.write('\n');
        }
      },
      onToken: (text: string) => {
        process.stdout.write(text);
      },
      onComplete: () => {
        if (hasOutput) {
          // Add newline after content, then blank line before completion
          process.stdout.write('\n\n');
        }
        // Print completion indicator with bold green checkmark
        console.log(chalk.green.bold('✔') + ` Stage: ${stage.title}`);
        process.stdout.write('\n');
      },
      onError: (_error: Error) => {
        if (hasOutput) {
          // Add newline after content, then blank line before failure indicator
          process.stdout.write('\n\n');
        }
        // Print failure indicator with red X
        console.log(chalk.red('✖') + ` Stage: ${stage.title}`);
      },
    });
  }
}
