import chalk from 'chalk';
import { WorkflowStage, ExecutionContext } from '../domain/types';
import { StageExecutor } from './stage-executor';
import { IAiService } from '../services/ai-service';
import { NoteRepository } from '../repositories/note-repository';
import { NotesService } from '../services/notes-service';

export class PromptStageExecutor implements StageExecutor {
  constructor(
    private aiService: IAiService,
    private noteRepository: NoteRepository,
    private notesService: NotesService
  ) {}

  async execute(stage: WorkflowStage, context?: ExecutionContext): Promise<void> {
    // Print stage indicator with blue arrow
    console.log(chalk.blue('▶') + ` Stage: ${stage.title}`);
    let hasOutput = false;
    let fullResponse = '';

    await this.aiService.executePrompt(
      stage.prompt,
      {
        onStart: () => {
          if (!hasOutput) {
            hasOutput = true;
            // Add newline so content appears below stage title
            process.stdout.write('\n');
          }
        },
        onToken: (text: string) => {
          fullResponse += text;
          process.stdout.write(text);
        },
        onComplete: async () => {
          if (hasOutput) {
            // Add newline after content, then blank line before completion
            process.stdout.write('\n\n');
          }

          // Extract and save notes if we have context
          if (context) {
            const extractedNotes = this.notesService.extractNotes(fullResponse);
            for (const noteContent of extractedNotes) {
              await this.noteRepository.addNote(context.runId, context.stageId, noteContent);
            }

            // Mark stage as complete
            await this.noteRepository.completeStageExecution(context.stageId);
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
      },
      context
    );
  }
}
