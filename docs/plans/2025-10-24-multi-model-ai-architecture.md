# Multi-Model AI Architecture Design

**Date:** 2025-10-24
**Status:** Implemented
**Authors:** Architecture Review & Refactoring

## Overview

This document describes the refactoring of beacon-cli's AI integration to support multiple AI providers in the future while maintaining simplicity for the current v1 implementation (Claude CLI only).

## Problem Statement

The original `PromptStageExecutor` violated several software engineering principles:

1. **Single Responsibility Principle (SRP)**: Combined process spawning, JSON stream parsing, UI display, and error handling in a single 138-line class
2. **Tight Coupling**: Direct `spawn('claude', ...)` calls made the code untestable without complex integration tests
3. **Limited Extensibility**: Adding other AI providers would require duplicating all streaming/display logic
4. **Poor Testability**: Tests had to mock the entire `StageExecutorFactory` rather than testing layers independently

## Goals

1. **Future Extensibility**: Make it easy to add OpenAI, Anthropic API, local models, etc.
2. **Better Testability**: Enable independent testing of AI interaction vs. UI orchestration
3. **Code Organization**: Separate concerns following SOLID principles
4. **Reusability**: Allow Claude CLI interaction to be reused in other parts of the codebase
5. **No Breaking Changes**: Maintain backward compatibility with existing workflow YAML files

## Constraints

- Must maintain real-time streaming UX (spinner → content → checkmark)
- No breaking changes to existing `.yml` workflow files
- Keep it simple (YAGNI) - only add what's needed now, make future additions easy
- Minimize new dependencies

## Architecture

### High-Level Design

```
┌─────────────────────────────────────┐
│  WorkflowService                    │  ← Application Layer
│  (orchestration)                    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  PromptStageExecutor                │  ← Application Layer
│  (stage execution + UI)             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  IAiService (interface)             │  ← Abstraction Layer
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  ClaudeCliService                   │  ← Infrastructure Layer
│  (CLI interaction, streaming)       │
└─────────────────────────────────────┘
```

### Component Responsibilities

**1. IAiService (Interface)**
- Contract that all AI providers must implement
- Single method: `executePrompt(prompt: string, callbacks: StreamCallbacks): Promise<void>`
- Makes executor independent of provider implementation

**2. StreamCallbacks (Type)**
- `onStart?()`: Called when first output arrives
- `onToken?(text: string)`: Called for each text chunk
- `onComplete?()`: Called on successful completion
- `onError?(error: Error)`: Called on failure

**3. ClaudeCliService (Implementation)**
- Implements `IAiService` interface
- Handles process spawning with `child_process.spawn()`
- Parses Claude CLI's JSON streaming format
- Manages process lifecycle and error handling
- ~120 lines of focused infrastructure code

**4. PromptStageExecutor (Application Logic)**
- Accepts `IAiService` via constructor dependency injection
- Owns workflow orchestration and UI (chalk formatting, stage indicators)
- Delegates AI interaction to injected service
- Reduced from 138 lines to 50 lines (~64% reduction)

**5. StageExecutorFactory (Factory)**
- Instantiates `ClaudeCliService`
- Injects service into `PromptStageExecutor`
- Centralized location for future provider selection logic

### Key Design Decisions

**Why callbacks instead of return values?**
- Maintains real-time streaming UX
- Executor controls when/how to update UI
- Service stays focused on transport, executor owns presentation
- Future providers (OpenAI streaming, local models) fit same pattern

**Why not add provider configuration now?**
- YAGNI principle - only Claude CLI is supported in v1
- Adding provider selection when there's only one choice is over-engineering
- Interface establishes the extension point for when it's needed
- Future: add `stage.provider` field and `AiServiceFactory` when provider #2 arrives

**Why dependency injection in executor?**
- Enables testing executor with mock service
- Follows Dependency Inversion Principle
- Keeps executor decoupled from concrete service implementation

## File Structure

### New Files

```
src/services/
  ├── ai-service.ts              # Interface: IAiService, StreamCallbacks
  └── claude-cli-service.ts      # Implementation: ClaudeCliService

tests/unit/services/
  └── claude-cli-service.test.ts # Unit tests for service
```

### Modified Files

```
src/executors/
  ├── prompt-stage-executor.ts      # Refactored: inject service, remove spawn logic
  └── stage-executor-factory.ts     # Updated: instantiate service, pass to executor

tests/unit/services/
  └── workflow-service.test.ts      # Updated: mock IAiService instead of factory
```

## Testing Strategy

The refactoring enables three test layers:

**1. Unit Tests: ClaudeCliService**
- Mock `child_process.spawn()`
- Test JSON stream parsing
- Test callback invocation (onStart, onToken, onComplete, onError)
- Test error handling (process exit codes, spawn errors)
- Test incomplete JSON line buffering

**2. Unit Tests: PromptStageExecutor**
- Mock `IAiService`
- Test spinner lifecycle and UI formatting
- Test callback wiring
- Independent of actual process spawning

**3. Integration Tests: WorkflowService**
- Mock service for fast tests
- Or use real `ClaudeCliService` with mocked spawn for deeper integration
- Test workflow orchestration across multiple stages

**Key Improvement:** All layers can be tested independently without running actual Claude CLI.

## Migration Path

1. ✅ Create `IAiService` interface and `StreamCallbacks` type
2. ✅ Create `ClaudeCliService` implementing the interface
3. ✅ Write comprehensive tests for `ClaudeCliService`
4. ✅ Refactor `PromptStageExecutor` to accept and use `IAiService`
5. ✅ Update `StageExecutorFactory` to instantiate service
6. ✅ Update workflow service tests to mock service layer
7. ✅ Verify all 48 tests pass

## Future Extensibility

When adding a second AI provider (e.g., OpenAI):

**1. Create OpenAI Service:**
```typescript
export class OpenAiService implements IAiService {
  async executePrompt(prompt: string, callbacks: StreamCallbacks): Promise<void> {
    // Use OpenAI SDK streaming
  }
}
```

**2. Add Provider Selection:**
```typescript
// Update WorkflowStage type
export interface WorkflowStage {
  title: string;
  type: 'prompt';
  prompt: string;
  provider?: 'claude-cli' | 'openai';  // NEW
}
```

**3. Create AI Service Factory:**
```typescript
export class AiServiceFactory {
  static create(provider: string = 'claude-cli'): IAiService {
    switch (provider) {
      case 'claude-cli':
        return new ClaudeCliService();
      case 'openai':
        return new OpenAiService();
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}
```

**4. Update Stage Executor Factory:**
```typescript
static create(stage: WorkflowStage): StageExecutor {
  const aiService = AiServiceFactory.create(stage.provider);
  return new PromptStageExecutor(aiService);
}
```

**No changes needed to:**
- `PromptStageExecutor` (already uses interface)
- `WorkflowService` (just calls factory)
- Existing workflow YAML files (provider optional, defaults to 'claude-cli')

## Benefits Achieved

1. ✅ **Extensibility**: Clean extension point via `IAiService` interface
2. ✅ **Testability**: Three independent test layers with proper mocking
3. ✅ **Code Organization**:
   - Executor: 50 lines (was 138) - 64% reduction
   - Service: 120 lines of focused infrastructure code
   - Clear separation of concerns
4. ✅ **Reusability**: `ClaudeCliService` can be used anywhere in the codebase
5. ✅ **No Breaking Changes**: All existing workflows work unchanged
6. ✅ **SOLID Principles**:
   - Single Responsibility: Each class has one clear purpose
   - Dependency Inversion: Executor depends on interface, not implementation
   - Open/Closed: Open for extension (new providers), closed for modification

## Metrics

- **Lines of Code Reduced**: 138 → 50 in `PromptStageExecutor` (64% reduction)
- **Test Coverage**: 10 new tests for `ClaudeCliService`
- **All Tests Passing**: 48/48 tests pass
- **No Breaking Changes**: 100% backward compatible

## Conclusion

This refactoring establishes a solid foundation for multi-provider AI support while keeping the current implementation simple and maintainable. The interface-based design makes future extensions straightforward without requiring changes to existing code.
