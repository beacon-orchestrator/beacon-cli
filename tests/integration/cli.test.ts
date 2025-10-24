import { runCLI } from '../helpers/cli-runner';

describe('CLI E2E Tests', () => {
  it('should display help when no command provided', async () => {
    const result = await runCLI([]);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('beacon');
    expect(result.stdout).toContain('CLI for persistent workflow state management');
  });

  it('should execute hello command without name', async () => {
    const result = await runCLI(['hello']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Hello, World!');
  });

  it('should execute hello command with name option', async () => {
    const result = await runCLI(['hello', '--name', 'E2E Test']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Hello, E2E Test!');
  });

  it('should execute hello command with short name option', async () => {
    const result = await runCLI(['hello', '-n', 'Alice']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Hello, Alice!');
  });

  it('should display version', async () => {
    const result = await runCLI(['--version']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('0.1.0');
  });

  it('should display help for hello command', async () => {
    const result = await runCLI(['hello', '--help']);

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('hello');
    expect(result.stdout).toContain('Say hello and log the interaction');
    expect(result.stdout).toContain('--name');
  });
});
