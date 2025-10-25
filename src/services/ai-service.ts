/**
 * Callbacks for streaming AI responses in real-time
 */
export interface StreamCallbacks {
  /**
   * Called when the first output arrives from the AI service
   */
  onStart?: () => void;

  /**
   * Called for each text chunk/token received
   */
  onToken?: (text: string) => void;

  /**
   * Called when the AI service completes successfully
   */
  onComplete?: () => void;

  /**
   * Called when an error occurs during execution
   */
  onError?: (error: Error) => void;
}

/**
 * Interface for AI service providers (Claude CLI, OpenAI, etc.)
 * All AI providers must implement this interface to be usable in workflows
 */
export interface IAiService {
  /**
   * Execute a prompt using the AI service
   * @param prompt The prompt text to send to the AI
   * @param callbacks Callbacks for streaming response handling
   */
  executePrompt(prompt: string, callbacks: StreamCallbacks): Promise<void>;
}
