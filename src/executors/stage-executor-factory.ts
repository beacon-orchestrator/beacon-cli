import { WorkflowStage } from '../domain/types';
import { StageExecutor } from './stage-executor';
import { PromptStageExecutor } from './prompt-stage-executor';
import { ClaudeCliService } from '../services/claude-cli-service';
import { NoteRepository } from '../repositories/note-repository';
import { NotesService } from '../services/notes-service';

export class StageExecutorFactory {
  constructor(
    private noteRepository: NoteRepository,
    private notesService: NotesService
  ) {}

  create(stage: WorkflowStage): StageExecutor {
    switch (stage.type) {
      case 'prompt': {
        const aiService = new ClaudeCliService(this.notesService);
        return new PromptStageExecutor(aiService, this.noteRepository, this.notesService);
      }
      default:
        throw new Error(`Unsupported stage type: ${stage.type}`);
    }
  }
}
