import { NewCommand } from '../../../src/commands/new-command';
import { WorkflowService } from '../../../src/services/workflow-service';
import { Command } from 'commander';
import * as inquirer from '@inquirer/prompts';

// Mock inquirer
jest.mock('@inquirer/prompts');

describe('NewCommand', () => {
  let newCommand: NewCommand;
  let mockWorkflowService: jest.Mocked<WorkflowService>;
  let mockSelect: jest.MockedFunction<typeof inquirer.select>;

  beforeEach(() => {
    mockWorkflowService = {
      getWorkflows: jest.fn(),
      runWorkflow: jest.fn(),
    } as unknown as jest.Mocked<WorkflowService>;

    mockSelect = inquirer.select as jest.MockedFunction<typeof inquirer.select>;
    newCommand = new NewCommand(mockWorkflowService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('properties', () => {
    it('should have correct name and description', () => {
      expect(newCommand.name).toBe('new');
      expect(newCommand.description).toBe('Start a new workflow');
    });
  });

  describe('execute', () => {
    it('should show error message when no workflows found', async () => {
      mockWorkflowService.getWorkflows.mockResolvedValue([]);
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await newCommand.execute();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'No workflows found. Create .beacon/workflows/ to get started.'
      );
      expect(mockSelect).not.toHaveBeenCalled();
      expect(mockWorkflowService.runWorkflow).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should present interactive selection and run selected workflow', async () => {
      mockWorkflowService.getWorkflows.mockResolvedValue([
        { fileName: 'data-processing.yml', name: 'data-processing' },
        { fileName: 'model-training.yml', name: 'model-training' },
      ]);
      mockSelect.mockResolvedValue('data-processing');

      await newCommand.execute();

      expect(mockSelect).toHaveBeenCalledWith({
        message: 'Select a workflow:',
        choices: [
          { name: 'data-processing', value: 'data-processing' },
          { name: 'model-training', value: 'model-training' },
        ],
      });
      expect(mockWorkflowService.runWorkflow).toHaveBeenCalledWith('data-processing');
    });

    it('should handle user cancellation gracefully', async () => {
      mockWorkflowService.getWorkflows.mockResolvedValue([
        { fileName: 'test.yml', name: 'test' },
      ]);
      mockSelect.mockRejectedValue(new Error('User cancelled'));

      await expect(newCommand.execute()).resolves.toBeUndefined();
      expect(mockWorkflowService.runWorkflow).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register command with program', () => {
      const mockProgram = new Command();
      const commandSpy = jest.spyOn(mockProgram, 'command');

      newCommand.register(mockProgram);

      expect(commandSpy).toHaveBeenCalledWith('new');
    });
  });
});
