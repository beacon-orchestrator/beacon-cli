import { ClaudeCliService } from '../../../src/services/claude-cli-service';
import { StreamCallbacks } from '../../../src/services/ai-service';
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

jest.mock('child_process');
jest.mock('chalk', () => ({
  hex: jest.fn(() => (text: string) => text),
}));

class MockChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();

  constructor() {
    super();
  }
}

describe('ClaudeCliService', () => {
  let service: ClaudeCliService;
  let mockProcess: MockChildProcess;

  beforeEach(() => {
    service = new ClaudeCliService();
    mockProcess = new MockChildProcess();
    (spawn as jest.Mock).mockReturnValue(mockProcess);

    // Mock console.stderr.write to avoid noise in test output
    jest.spyOn(process.stderr, 'write').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('executePrompt', () => {
    it('should spawn claude CLI with correct arguments', async () => {
      const promise = service.executePrompt('test prompt', {});

      expect(spawn).toHaveBeenCalledWith(
        'claude',
        [
          '--print',
          '--output-format',
          'stream-json',
          '--verbose',
          '--include-partial-messages',
          '--permission-mode',
          'bypassPermissions',
          'test prompt',
        ],
        {
          stdio: ['inherit', 'pipe', 'pipe'],
          shell: false,
        }
      );

      // Complete the process
      mockProcess.emit('close', 0);
      await promise;
    });

    it('should call onStart callback on first text output', async () => {
      const callbacks: StreamCallbacks = {
        onStart: jest.fn(),
        onToken: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      // Emit a valid JSON stream event with text
      const event = JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_delta',
          delta: {
            type: 'text_delta',
            text: 'Hello',
          },
        },
      });
      mockProcess.stdout.emit('data', Buffer.from(event + '\n'));

      expect(callbacks.onStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onToken).toHaveBeenCalledWith('Hello');

      mockProcess.emit('close', 0);
      await promise;
    });

    it('should call onToken for each text delta', async () => {
      const callbacks: StreamCallbacks = {
        onToken: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      // Emit multiple text deltas
      const event1 = JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'Hello' },
        },
      });
      const event2 = JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: ' world' },
        },
      });

      mockProcess.stdout.emit('data', Buffer.from(event1 + '\n' + event2 + '\n'));

      expect(callbacks.onToken).toHaveBeenCalledTimes(2);
      expect(callbacks.onToken).toHaveBeenNthCalledWith(1, 'Hello');
      expect(callbacks.onToken).toHaveBeenNthCalledWith(2, ' world');

      mockProcess.emit('close', 0);
      await promise;
    });

    it('should handle incomplete JSON lines correctly', async () => {
      const callbacks: StreamCallbacks = {
        onToken: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      const event = JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'Complete' },
        },
      });

      // Send partial line
      const partial = event.substring(0, event.length / 2);
      mockProcess.stdout.emit('data', Buffer.from(partial));

      // onToken should not be called yet
      expect(callbacks.onToken).not.toHaveBeenCalled();

      // Send rest of line with newline
      const rest = event.substring(event.length / 2) + '\n';
      mockProcess.stdout.emit('data', Buffer.from(rest));

      // Now onToken should be called
      expect(callbacks.onToken).toHaveBeenCalledWith('Complete');

      mockProcess.emit('close', 0);
      await promise;
    });

    it('should ignore non-text-delta events', async () => {
      const callbacks: StreamCallbacks = {
        onToken: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      const nonTextEvent = JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_start',
        },
      });

      mockProcess.stdout.emit('data', Buffer.from(nonTextEvent + '\n'));

      expect(callbacks.onToken).not.toHaveBeenCalled();

      mockProcess.emit('close', 0);
      await promise;
    });

    it('should call onComplete callback on successful completion', async () => {
      const callbacks: StreamCallbacks = {
        onComplete: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      mockProcess.emit('close', 0);
      await promise;

      expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
    });

    it('should call onError and reject on non-zero exit code', async () => {
      const callbacks: StreamCallbacks = {
        onError: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      mockProcess.emit('close', 1);

      await expect(promise).rejects.toThrow('Claude CLI exited with code 1');
      expect(callbacks.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Claude CLI exited with code 1',
        })
      );
    });

    it('should call onError and reject on spawn error', async () => {
      const callbacks: StreamCallbacks = {
        onError: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      const spawnError = new Error('ENOENT: command not found');
      mockProcess.emit('error', spawnError);

      await expect(promise).rejects.toThrow('Failed to spawn claude CLI: ENOENT: command not found');
      expect(callbacks.onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to spawn claude CLI: ENOENT: command not found',
        })
      );
    });

    it('should write stderr data to process.stderr', async () => {
      const promise = service.executePrompt('test', {});

      const errorMessage = 'Warning: something happened';
      mockProcess.stderr.emit('data', Buffer.from(errorMessage));

      expect(process.stderr.write).toHaveBeenCalledWith(Buffer.from(errorMessage));

      mockProcess.emit('close', 0);
      await promise;
    });

    it('should only call onStart once even with multiple tokens', async () => {
      const callbacks: StreamCallbacks = {
        onStart: jest.fn(),
        onToken: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      // Emit three text deltas
      for (let i = 0; i < 3; i++) {
        const event = JSON.stringify({
          type: 'stream_event',
          event: {
            type: 'content_block_delta',
            delta: { type: 'text_delta', text: `token${i}` },
          },
        });
        mockProcess.stdout.emit('data', Buffer.from(event + '\n'));
      }

      expect(callbacks.onStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onToken).toHaveBeenCalledTimes(3);

      mockProcess.emit('close', 0);
      await promise;
    });

    it('should format Write tool usage correctly', async () => {
      const callbacks: StreamCallbacks = {
        onToken: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      // Emit tool_use content_block_start
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_start',
          content_block: { type: 'tool_use', name: 'Write', id: 'tool_1' }
        }
      }) + '\n'));

      // Emit input_json_delta
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_delta',
          delta: { type: 'input_json_delta', partial_json: '{"file_path":"/test.ts"}' }
        }
      }) + '\n'));

      // Emit content_block_stop
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: { type: 'content_block_stop' }
      }) + '\n'));

      expect(callbacks.onToken).toHaveBeenCalledWith(
        expect.stringContaining('[Writing /test.ts]')
      );

      mockProcess.emit('close', 0);
      await promise;
    });

    it('should format Read tool usage correctly', async () => {
      const callbacks: StreamCallbacks = {
        onToken: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_start',
          content_block: { type: 'tool_use', name: 'Read', id: 'tool_1' }
        }
      }) + '\n'));

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_delta',
          delta: { type: 'input_json_delta', partial_json: '{"file_path":"src/index.ts"}' }
        }
      }) + '\n'));

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: { type: 'content_block_stop' }
      }) + '\n'));

      expect(callbacks.onToken).toHaveBeenCalledWith(
        expect.stringContaining('[Reading src/index.ts]')
      );

      mockProcess.emit('close', 0);
      await promise;
    });

    it('should format Edit tool usage with filename only', async () => {
      const callbacks: StreamCallbacks = {
        onToken: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_start',
          content_block: { type: 'tool_use', name: 'Edit', id: 'tool_1' }
        }
      }) + '\n'));

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_delta',
          delta: { type: 'input_json_delta', partial_json: '{"file_path":"src/services/test.ts","old_string":"foo","new_string":"bar"}' }
        }
      }) + '\n'));

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: { type: 'content_block_stop' }
      }) + '\n'));

      expect(callbacks.onToken).toHaveBeenCalledWith(
        expect.stringContaining('[Editing test.ts]')
      );

      mockProcess.emit('close', 0);
      await promise;
    });

    it('should format Bash tool usage with description', async () => {
      const callbacks: StreamCallbacks = {
        onToken: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_start',
          content_block: { type: 'tool_use', name: 'Bash', id: 'tool_1' }
        }
      }) + '\n'));

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_delta',
          delta: { type: 'input_json_delta', partial_json: '{"command":"npm test","description":"Run tests"}' }
        }
      }) + '\n'));

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: { type: 'content_block_stop' }
      }) + '\n'));

      expect(callbacks.onToken).toHaveBeenCalledWith(
        expect.stringContaining('[Running: Run tests]')
      );

      mockProcess.emit('close', 0);
      await promise;
    });

    it('should format Grep tool usage correctly', async () => {
      const callbacks: StreamCallbacks = {
        onToken: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_start',
          content_block: { type: 'tool_use', name: 'Grep', id: 'tool_1' }
        }
      }) + '\n'));

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_delta',
          delta: { type: 'input_json_delta', partial_json: '{"pattern":"TODO"}' }
        }
      }) + '\n'));

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: { type: 'content_block_stop' }
      }) + '\n'));

      expect(callbacks.onToken).toHaveBeenCalledWith(
        expect.stringContaining('[Searching: TODO]')
      );

      mockProcess.emit('close', 0);
      await promise;
    });

    it('should handle tool usage with invalid JSON gracefully', async () => {
      const callbacks: StreamCallbacks = {
        onToken: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_start',
          content_block: { type: 'tool_use', name: 'CustomTool', id: 'tool_1' }
        }
      }) + '\n'));

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_delta',
          delta: { type: 'input_json_delta', partial_json: '{invalid json' }
        }
      }) + '\n'));

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: { type: 'content_block_stop' }
      }) + '\n'));

      expect(callbacks.onToken).toHaveBeenCalledWith(
        expect.stringContaining('[Using CustomTool]')
      );

      mockProcess.emit('close', 0);
      await promise;
    });

    it('should call onStart on first tool usage', async () => {
      const callbacks: StreamCallbacks = {
        onStart: jest.fn(),
        onToken: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      // First event is tool_use, not text
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_start',
          content_block: { type: 'tool_use', name: 'Read', id: 'tool_1' }
        }
      }) + '\n'));

      expect(callbacks.onStart).toHaveBeenCalledTimes(1);

      mockProcess.emit('close', 0);
      await promise;
    });

    it('should insert newline between consecutive text blocks', async () => {
      const callbacks: StreamCallbacks = {
        onToken: jest.fn(),
      };

      const promise = service.executePrompt('test', callbacks);

      // First text block
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_start',
          content_block: { type: 'text', id: 'text_1' }
        }
      }) + '\n'));

      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_delta',
          delta: { type: 'text_delta', text: 'First block' }
        }
      }) + '\n'));

      // Second text block
      mockProcess.stdout.emit('data', Buffer.from(JSON.stringify({
        type: 'stream_event',
        event: {
          type: 'content_block_start',
          content_block: { type: 'text', id: 'text_2' }
        }
      }) + '\n'));

      // Should have inserted newline before second text block
      expect(callbacks.onToken).toHaveBeenCalledWith('\n');

      mockProcess.emit('close', 0);
      await promise;
    });
  });
});
