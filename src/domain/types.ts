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
  // Future: Add description, commands, config, etc.
}

export interface WorkflowDefinition {
  stages: WorkflowStage[];
}

export interface Workflow {
  fileName: string;
  name: string;
  definition?: WorkflowDefinition;
}
