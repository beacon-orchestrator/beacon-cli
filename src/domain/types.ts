// Core types for the beacon CLI

export interface CommandLog {
  id?: number;
  command: string;
  args: Record<string, unknown>;
  timestamp: Date;
}

export interface CreateCommandLogInput {
  command: string;
  args: Record<string, unknown>;
  timestamp: Date;
}

export interface WorkflowStage {
  title: string;
  type: 'prompt';
  prompt: string;
}

export interface WorkflowDefinition {
  system_prompt?: string;
  stages: WorkflowStage[];
}

export interface Workflow {
  fileName: string;
  name: string;
  definition?: WorkflowDefinition;
}

export interface WorkflowRun {
  id?: number;
  workflowName: string;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'completed' | 'failed';
}

export interface StageExecution {
  id?: number;
  workflowRunId: number;
  stageIndex: number;
  stageTitle: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface Note {
  id?: number;
  workflowRunId: number;
  stageExecutionId?: number;
  content: string;
  createdAt: Date;
}

export interface ExecutionContext {
  runId: number;
  stageId: number;
  previousNotes: Note[];
  systemPrompt?: string;
}
