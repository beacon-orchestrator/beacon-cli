import { BaseRepository } from './base-repository';
import { Note, WorkflowRun, StageExecution } from '../domain/types';

export class NoteRepository extends BaseRepository {
  async createWorkflowRun(workflowName: string): Promise<number> {
    const db = this.getConnection();
    const result = await db.run(
      'INSERT INTO workflow_runs (workflow_name, started_at, status) VALUES (?, ?, ?)',
      workflowName,
      new Date().toISOString(),
      'running'
    );
    return result.lastID!;
  }

  async updateRunStatus(runId: number, status: 'completed' | 'failed'): Promise<void> {
    const db = this.getConnection();
    await db.run(
      'UPDATE workflow_runs SET status = ?, completed_at = ? WHERE id = ?',
      status,
      new Date().toISOString(),
      runId
    );
  }

  async createStageExecution(runId: number, stageIndex: number, stageTitle: string): Promise<number> {
    const db = this.getConnection();
    const result = await db.run(
      'INSERT INTO stage_executions (workflow_run_id, stage_index, stage_title, started_at) VALUES (?, ?, ?, ?)',
      runId,
      stageIndex,
      stageTitle,
      new Date().toISOString()
    );
    return result.lastID!;
  }

  async completeStageExecution(stageId: number): Promise<void> {
    const db = this.getConnection();
    await db.run(
      'UPDATE stage_executions SET completed_at = ? WHERE id = ?',
      new Date().toISOString(),
      stageId
    );
  }

  async addNote(runId: number, stageId: number | undefined, content: string): Promise<void> {
    const db = this.getConnection();
    await db.run(
      'INSERT INTO notes (workflow_run_id, stage_execution_id, content, created_at) VALUES (?, ?, ?, ?)',
      runId,
      stageId || null,
      content,
      new Date().toISOString()
    );
  }

  async getNotesForRun(runId: number): Promise<Note[]> {
    const db = this.getConnection();
    const rows = await db.all<
      Array<{
        id: number;
        workflow_run_id: number;
        stage_execution_id: number | null;
        content: string;
        created_at: string;
      }>
    >('SELECT * FROM notes WHERE workflow_run_id = ? ORDER BY created_at ASC', runId);

    return rows.map((row) => ({
      id: row.id,
      workflowRunId: row.workflow_run_id,
      stageExecutionId: row.stage_execution_id || undefined,
      content: row.content,
      createdAt: new Date(row.created_at),
    }));
  }

  async getNotesForStage(stageId: number): Promise<Note[]> {
    const db = this.getConnection();
    const rows = await db.all<
      Array<{
        id: number;
        workflow_run_id: number;
        stage_execution_id: number | null;
        content: string;
        created_at: string;
      }>
    >('SELECT * FROM notes WHERE stage_execution_id = ? ORDER BY created_at ASC', stageId);

    return rows.map((row) => ({
      id: row.id,
      workflowRunId: row.workflow_run_id,
      stageExecutionId: row.stage_execution_id || undefined,
      content: row.content,
      createdAt: new Date(row.created_at),
    }));
  }

  async getRecentRuns(limit: number = 10): Promise<WorkflowRun[]> {
    const db = this.getConnection();
    const rows = await db.all<
      Array<{
        id: number;
        workflow_name: string;
        started_at: string;
        completed_at: string | null;
        status: string;
      }>
    >('SELECT * FROM workflow_runs ORDER BY started_at DESC LIMIT ?', limit);

    return rows.map((row) => ({
      id: row.id,
      workflowName: row.workflow_name,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      status: row.status as 'running' | 'completed' | 'failed',
    }));
  }

  async getStageExecutions(runId: number): Promise<StageExecution[]> {
    const db = this.getConnection();
    const rows = await db.all<
      Array<{
        id: number;
        workflow_run_id: number;
        stage_index: number;
        stage_title: string;
        started_at: string;
        completed_at: string | null;
      }>
    >('SELECT * FROM stage_executions WHERE workflow_run_id = ? ORDER BY stage_index ASC', runId);

    return rows.map((row) => ({
      id: row.id,
      workflowRunId: row.workflow_run_id,
      stageIndex: row.stage_index,
      stageTitle: row.stage_title,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
    }));
  }
}
