-- Migration: Add notes support for workflow runs
-- Adds workflow_runs, stage_executions, and notes tables

CREATE TABLE workflow_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_name TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL CHECK(status IN ('running', 'completed', 'failed'))
);

CREATE TABLE stage_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_run_id INTEGER NOT NULL,
  stage_index INTEGER NOT NULL,
  stage_title TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  FOREIGN KEY (workflow_run_id) REFERENCES workflow_runs(id) ON DELETE CASCADE
);

CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_run_id INTEGER NOT NULL,
  stage_execution_id INTEGER,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workflow_run_id) REFERENCES workflow_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (stage_execution_id) REFERENCES stage_executions(id) ON DELETE CASCADE
);

CREATE INDEX idx_notes_workflow_run ON notes(workflow_run_id);
CREATE INDEX idx_notes_stage ON notes(stage_execution_id);
CREATE INDEX idx_stage_executions_run ON stage_executions(workflow_run_id);
