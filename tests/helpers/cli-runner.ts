import { spawn } from 'child_process';
import * as path from 'path';

export interface CLIResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

export async function runCLI(args: string[]): Promise<CLIResult> {
  return new Promise((resolve) => {
    const cliPath = path.join(__dirname, '../../dist/index.js');
    const child = spawn('node', [cliPath, ...args]);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        exitCode: code || 0,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}
