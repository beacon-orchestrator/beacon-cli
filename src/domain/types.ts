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

export interface Workflow {
  fileName: string;
  name: string;
}
