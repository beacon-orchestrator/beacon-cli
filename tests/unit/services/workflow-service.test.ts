import { WorkflowService } from '../../../src/services/workflow-service';
import { WorkflowRepository } from '../../../src/repositories/workflow-repository';
import { LogRepository } from '../../../src/repositories/log-repository';
import * as loadingModule from '../../../src/utils/loading';

// Mock ora
jest.mock('ora', () => {
  return jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn(),
    fail: jest.fn(),
  }));
});

describe('WorkflowService', () => {
  let workflowService: WorkflowService;
  let mockWorkflowRepository: jest.Mocked<WorkflowRepository>;
  let mockLogRepository: jest.Mocked<LogRepository>;

  beforeEach(() => {
    mockWorkflowRepository = {
      getWorkflowFiles: jest.fn(),
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
    let withLoadingSpy: jest.SpyInstance;

    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(console, 'log').mockImplementation();
      withLoadingSpy = jest.spyOn(loadingModule, 'withLoading').mockImplementation(
        async (_message, fn) => await fn()
      );
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('should use withLoading with correct message', async () => {
      const promise = workflowService.runWorkflow('data-processing');

      await jest.advanceTimersByTimeAsync(2000);
      await promise;

      expect(withLoadingSpy).toHaveBeenCalledWith(
        'Running workflow: data-processing',
        expect.any(Function)
      );
    });

    it('should log workflow execution to database', async () => {
      const promise = workflowService.runWorkflow('data-processing');

      // Fast-forward through the 2 second delay
      await jest.advanceTimersByTimeAsync(2000);
      await promise;

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

      const promise = workflowService.runWorkflow('test-workflow');
      await jest.advanceTimersByTimeAsync(2000);

      await expect(promise).resolves.toBeUndefined();
    });
  });
});
