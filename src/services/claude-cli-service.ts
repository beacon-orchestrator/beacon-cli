import { spawn } from 'child_process';
import chalk from 'chalk';
import { IAiService, StreamCallbacks } from './ai-service';

interface StreamEvent {
  type: string;
  event?: {
    type: string;
    index?: number;
    content_block?: {
      type: string;
      name?: string;
      id?: string;
    };
    delta?: {
      type: 'text_delta' | 'input_json_delta';
      text?: string;
      partial_json?: string;
    };
  };
}

/**
 * AI service implementation for Claude CLI
 * Handles process spawning, JSON stream parsing, and error handling
 */
export class ClaudeCliService implements IAiService {
  /**
   * Creates a parser for Claude CLI's JSON streaming format
   * @param onToken Callback to invoke when text arrives
   * @param onFirstOutput Callback to invoke on first output
   * @returns Function that processes data buffers
   */
  private createJsonStreamParser(
    onToken: (text: string) => void,
    onFirstOutput: () => void
  ): (data: Buffer) => void {
    let buffer = '';
    let hasEmittedFirst = false;
    let isFirstTextBlock = true;
    let currentToolName = '';
    let toolInputBuffer = '';

    return (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split('\n');

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const parsed: StreamEvent = JSON.parse(line);

          // When a new text content block starts (after tool use or other blocks),
          // insert a newline to separate it from previous content
          if (
            parsed.type === 'stream_event' &&
            parsed.event?.type === 'content_block_start' &&
            parsed.event?.content_block?.type === 'text'
          ) {
            if (!isFirstTextBlock) {
              onToken('\n');
            }
            isFirstTextBlock = false;
          }

          // When a tool use starts, capture the tool name
          if (
            parsed.type === 'stream_event' &&
            parsed.event?.type === 'content_block_start' &&
            parsed.event?.content_block?.type === 'tool_use' &&
            parsed.event?.content_block?.name
          ) {
            if (!hasEmittedFirst) {
              hasEmittedFirst = true;
              onFirstOutput();
            }
            currentToolName = parsed.event.content_block.name;
            toolInputBuffer = '';
          }

          // Accumulate tool input parameters
          if (
            parsed.type === 'stream_event' &&
            parsed.event?.type === 'content_block_delta' &&
            parsed.event?.delta?.type === 'input_json_delta' &&
            parsed.event?.delta?.partial_json
          ) {
            toolInputBuffer += parsed.event.delta.partial_json;
          }

          // When tool use stops, display it with parameters
          if (
            parsed.type === 'stream_event' &&
            parsed.event?.type === 'content_block_stop' &&
            currentToolName
          ) {
            const toolInfo = this.formatToolUsage(currentToolName, toolInputBuffer);
            // Very subtle pale yellow - differentiates without popping
            onToken(`\n\n${chalk.hex('#D4C5A9')(toolInfo)}\n`);
            currentToolName = '';
            toolInputBuffer = '';
          }

          // Extract text from content_block_delta events
          if (
            parsed.type === 'stream_event' &&
            parsed.event?.type === 'content_block_delta' &&
            parsed.event?.delta?.type === 'text_delta' &&
            parsed.event?.delta?.text
          ) {
            if (!hasEmittedFirst) {
              hasEmittedFirst = true;
              onFirstOutput();
            }
            onToken(parsed.event.delta.text);
          }
        } catch (err) {
          // Ignore parse errors (likely incomplete JSON)
          continue;
        }
      }
    };
  }

  /**
   * Format tool usage information for display
   */
  private formatToolUsage(toolName: string, inputJson: string): string {
    try {
      const params = JSON.parse(inputJson);

      // Format based on common tools
      if (toolName === 'Write') {
        return `[Writing ${params.file_path}]`;
      } else if (toolName === 'Read') {
        return `[Reading ${params.file_path}]`;
      } else if (toolName === 'Edit') {
        const fileName = params.file_path?.split('/').pop() || params.file_path;
        return `[Editing ${fileName}]`;
      } else if (toolName === 'Bash') {
        const desc = params.description || params.command?.substring(0, 50);
        return `[Running: ${desc}]`;
      } else if (toolName === 'Grep' || toolName === 'Glob') {
        return `[Searching: ${params.pattern || params.path}]`;
      } else {
        // Generic format for other tools
        const firstParam = Object.values(params)[0];
        if (typeof firstParam === 'string' && firstParam.length < 60) {
          return `[${toolName}: ${firstParam}]`;
        }
        return `[Using ${toolName}]`;
      }
    } catch {
      // If JSON parsing fails, just show the tool name
      return `[Using ${toolName}]`;
    }
  }

  /**
   * Execute a prompt using Claude CLI
   * @param prompt The prompt text to send to Claude
   * @param callbacks Callbacks for streaming response handling
   * @returns Promise that resolves when execution completes successfully
   * @throws Error if the Claude CLI fails or is unavailable
   */
  async executePrompt(prompt: string, callbacks: StreamCallbacks): Promise<void> {
    return new Promise((resolve, reject) => {
      // Spawn claude CLI with JSON streaming for true realtime output
      const claude = spawn(
        'claude',
        [
          '--print',
          '--output-format',
          'stream-json',
          '--verbose',
          '--include-partial-messages',
          '--permission-mode',
          'bypassPermissions',
          prompt,
        ],
        {
          stdio: ['inherit', 'pipe', 'pipe'],
          shell: false,
        }
      );

      // Buffer stderr for error context
      let stderrBuffer = '';

      // Create JSON stream parser for stdout
      const parseStdout = this.createJsonStreamParser(
        (text: string) => callbacks.onToken?.(text),
        () => callbacks.onStart?.()
      );

      // Named event handlers for cleanup
      const onStdoutData = (data: Buffer) => {
        parseStdout(data);
      };

      const onStderrData = (data: Buffer) => {
        const chunk = data.toString();
        stderrBuffer += chunk;
        process.stderr.write(data);
      };

      const onClose = (code: number | null) => {
        cleanup();
        if (code === 0) {
          callbacks.onComplete?.();
          resolve();
        } else {
          let errorMessage = `Claude CLI exited with code ${code}`;
          if (stderrBuffer.trim()) {
            errorMessage += `\n${stderrBuffer.trim()}`;
          }
          const error = new Error(errorMessage);
          callbacks.onError?.(error);
          reject(error);
        }
      };

      const onError = (err: Error) => {
        cleanup();
        const error = new Error(`Failed to spawn claude CLI: ${err.message}`);
        callbacks.onError?.(error);
        reject(error);
      };

      // Cleanup function to remove event listeners
      const cleanup = () => {
        claude.stdout.off('data', onStdoutData);
        claude.stderr.off('data', onStderrData);
        claude.off('close', onClose);
        claude.off('error', onError);
        process.off('SIGINT', killHandler);
        process.off('SIGTERM', killHandler);
      };

      // Signal handler to kill child process on interruption
      const killHandler = () => {
        if (!claude.killed) {
          claude.kill('SIGTERM');
        }
      };

      // Register event listeners
      claude.stdout.on('data', onStdoutData);
      claude.stderr.on('data', onStderrData);
      claude.on('close', onClose);
      claude.on('error', onError);

      // Handle process termination signals
      process.once('SIGINT', killHandler);
      process.once('SIGTERM', killHandler);
    });
  }
}
