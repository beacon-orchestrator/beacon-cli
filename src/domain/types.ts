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
  stages: WorkflowStage[];
}

export interface Workflow {
  fileName: string;
  name: string;
  definition?: WorkflowDefinition;
}
