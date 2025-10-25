import { WorkflowDefinition } from '../domain/types';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class WorkflowValidator {
  static validate(definition: WorkflowDefinition): ValidationResult {
    const errors: string[] = [];

    if (!definition.stages || definition.stages.length === 0) {
      errors.push('Workflow must have at least one stage');
      return { valid: false, errors };
    }

    definition.stages.forEach((stage, index) => {
      const stageNum = index + 1;

      if (!stage.title || stage.title.trim() === '') {
        errors.push(`Stage ${stageNum}: missing or empty title`);
      }

      if (stage.type !== 'prompt') {
        errors.push(
          `Stage ${stageNum}: type must be 'prompt' (got '${stage.type}')`
        );
      }

      if (!stage.prompt || stage.prompt.trim() === '') {
        errors.push(`Stage ${stageNum}: missing or empty prompt`);
      } else if (stage.prompt.trim().length < 10) {
        errors.push(
          `Stage ${stageNum}: prompt is too short (minimum 10 characters, got ${stage.prompt.trim().length})`
        );
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
