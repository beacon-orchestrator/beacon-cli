import { NoteRepository } from '../repositories/note-repository';
import { WorkflowRun, StageExecution, Note } from '../domain/types';

export interface WorkflowRunWithDetails {
  run: WorkflowRun;
  stages: Array<{
    stage: StageExecution;
    notes: Note[];
  }>;
}

export class NotesDisplayService {
  constructor(private noteRepository: NoteRepository) {}

  async getRecentRuns(limit: number = 10): Promise<WorkflowRun[]> {
    return this.noteRepository.getRecentRuns(limit);
  }

  async getRunWithNotes(runId: number): Promise<WorkflowRunWithDetails | null> {
    const runs = await this.noteRepository.getRecentRuns(100);
    const run = runs.find((r) => r.id === runId);

    if (!run || !run.id) {
      return null;
    }

    const stages = await this.noteRepository.getStageExecutions(run.id);
    const stagesWithNotes = await Promise.all(
      stages.map(async (stage) => ({
        stage,
        notes: stage.id ? await this.noteRepository.getNotesForStage(stage.id) : [],
      }))
    );

    return {
      run,
      stages: stagesWithNotes,
    };
  }

  async getLatestRunWithNotes(): Promise<WorkflowRunWithDetails | null> {
    const runs = await this.noteRepository.getRecentRuns(1);
    if (runs.length === 0 || !runs[0].id) {
      return null;
    }

    return this.getRunWithNotes(runs[0].id);
  }
}
