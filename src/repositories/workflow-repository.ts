import { promises as fs } from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { WorkflowDefinition } from '../domain/types';

export interface WorkflowFilesResult {
  success: boolean;
  files?: string[];
  error?: string;
}

export class WorkflowRepository {
  private readonly workflowsPath: string;

  constructor() {
    // .beacon/workflows in current working directory
    this.workflowsPath = path.join(process.cwd(), '.beacon', 'workflows');
  }

  async getWorkflowFiles(): Promise<WorkflowFilesResult> {
    try {
      // Check if directory exists
      try {
        await fs.access(this.workflowsPath);
      } catch {
        // Directory doesn't exist - return empty array (not an error)
        return { success: true, files: [] };
      }

      // Read directory contents
      const entries = await fs.readdir(this.workflowsPath, { withFileTypes: true });

      // Filter for .yml files only (not directories)
      const ymlFiles = entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.yml'))
        .map((entry) => entry.name);

      return { success: true, files: ymlFiles };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async getWorkflowDefinition(
    workflowName: string
  ): Promise<WorkflowDefinition | null> {
    try {
      const filePath = path.join(this.workflowsPath, `${workflowName}.yml`);
      const fileContents = await fs.readFile(filePath, 'utf-8');
      const parsed = yaml.load(fileContents) as WorkflowDefinition;

      // Validate that stages exist and is an array
      if (!parsed || !Array.isArray(parsed.stages)) {
        return null;
      }

      return parsed;
    } catch (error) {
      return null;
    }
  }
}
