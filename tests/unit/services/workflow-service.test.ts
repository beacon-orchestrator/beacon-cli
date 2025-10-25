import { WorkflowService } from '../../../src/services/workflow-service';
import { WorkflowRepository } from '../../../src/repositories/workflow-repository';
import { LogRepository } from '../../../src/repositories/log-repository';
import { ClaudeCliService } from '../../../src/services/claude-cli-service';
import { StreamCallbacks } from '../../../src/services/ai-service';

// Mock chalk
jest.mock('chalk', () => ({
  green: {
    bold: jest.fn((text) => text),
  },
  cyan: jest.fn((text) => text),
  blue: jest.fn((text) => text),
  red: jest.fn((text) => text),
}));

// Mock the ClaudeCliService
jest.mock('../../../src/services/claude-cli-service');

describe('WorkflowService', () => {
  let workflowService: WorkflowService;
  let mockWorkflowRepository: jest.Mocked<WorkflowRepository>;
  let mockLogRepository: jest.Mocked<LogRepository>;

  beforeEach(() => {
    mockWorkflowRepository = {
      getWorkflowFiles: jest.fn(),
      getWorkflowDefinition: jest.fn(),
    } as unknown as jest.Mocked<WorkflowRepository>;

    mockLogRepository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<LogRepository>;

    workflowService = new WorkflowService(mockWorkflowRepository, mockLogRepository);
  });

  describe('getWorkflows', () => {
    it('should return array of Workflow objects with fileName and name', async () => {
      mockWorkflowRepository.getWorkflowFiles.mockResolvedValue({
        success: true,
        files: ['data-processing.yml', 'model-training.yml'],
      });

      const result = await workflowService.getWorkflows();

      expect(result).toEqual([
        { fileName: 'data-processing.yml', name: 'data-processing' },
        { fileName: 'model-training.yml', name: 'model-training' },
      ]);
    });

    it('should return empty array when no workflows found', async () => {
      mockWorkflowRepository.getWorkflowFiles.mockResolvedValue({
        success: true,
        files: [],
      });

      const result = await workflowService.getWorkflows();

      expect(result).toEqual([]);
    });

    it('should return empty array on repository error', async () => {
      mockWorkflowRepository.getWorkflowFiles.mockResolvedValue({
        success: false,
        error: 'Permission denied',
      });

      const result = await workflowService.getWorkflows();

      expect(result).toEqual([]);
    });
  });

  describe('runWorkflow', () => {
    let mockExecutePrompt: jest.Mock;

    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();
      jest.spyOn(console, 'error').mockImplementation();

      // Mock the executePrompt method to call onComplete callback
      mockExecutePrompt = jest.fn().mockImplementation(
        async (prompt: string, callbacks: StreamCallbacks) => {
          callbacks.onComplete?.();
        }
      );

      (ClaudeCliService as jest.Mock).mockImplementation(() => ({
        executePrompt: mockExecutePrompt,
      }));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should execute each stage using the AI service', async () => {
      mockWorkflowRepository.getWorkflowDefinition.mockResolvedValue({
        stages: [
          { title: 'Stage 1', type: 'prompt', prompt: 'Test prompt 1' },
          { title: 'Stage 2', type: 'prompt', prompt: 'Test prompt 2' },
        ],
      });

      await workflowService.runWorkflow('data-processing');

      expect(mockExecutePrompt).toHaveBeenCalledTimes(2);
      expect(mockExecutePrompt).toHaveBeenNthCalledWith(
        1,
        'Test prompt 1',
        expect.any(Object)
      );
      expect(mockExecutePrompt).toHaveBeenNthCalledWith(
        2,
        'Test prompt 2',
        expect.any(Object)
      );
    });

    it('should log workflow execution to database', async () => {
      mockWorkflowRepository.getWorkflowDefinition.mockResolvedValue({
        stages: [{ title: 'Test stage', type: 'prompt', prompt: 'Test prompt that is long enough' }],
      });

      await workflowService.runWorkflow('data-processing');

      expect(mockLogRepository.create).toHaveBeenCalledTimes(1);
      expect(mockLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          command: 'new',
          args: { name: 'data-processing' },
          timestamp: expect.any(Date),
        })
      );
    });

    it('should continue execution even if logging fails', async () => {
      mockLogRepository.create.mockRejectedValue(new Error('Database error'));
      mockWorkflowRepository.getWorkflowDefinition.mockResolvedValue({
        stages: [{ title: 'Test stage', type: 'prompt', prompt: 'Test prompt that is long enough' }],
      });

      await expect(
        workflowService.runWorkflow('test-workflow')
      ).resolves.toBeUndefined();
    });

    it('should validate workflow and throw error on validation failure', async () => {
      mockWorkflowRepository.getWorkflowDefinition.mockResolvedValue({
        stages: [{ title: 'Test stage', type: 'invalid' as 'prompt', prompt: '' }],
      });

      await expect(
        workflowService.runWorkflow('invalid-workflow')
      ).rejects.toThrow('Workflow validation failed');

      expect(mockExecutePrompt).not.toHaveBeenCalled();
    });

    it('should stop execution if AI service throws error', async () => {
      mockExecutePrompt.mockRejectedValueOnce(
        new Error('Claude CLI exited with code 1')
      );

      mockWorkflowRepository.getWorkflowDefinition.mockResolvedValue({
        stages: [
          { title: 'Stage 1', type: 'prompt', prompt: 'Test prompt one that is long enough' },
          { title: 'Stage 2', type: 'prompt', prompt: 'Test prompt two that is long enough' },
        ],
      });

      await expect(
        workflowService.runWorkflow('test-workflow')
      ).rejects.toThrow('Claude CLI exited with code 1');

      expect(mockExecutePrompt).toHaveBeenCalledTimes(1);
    });
  });
});
