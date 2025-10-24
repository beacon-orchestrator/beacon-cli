-- Initial schema for beacon CLI

CREATE TABLE IF NOT EXISTS command_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  command TEXT NOT NULL,
  args TEXT,
  timestamp TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_command_logs_timestamp ON command_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_command_logs_command ON command_logs(command);
