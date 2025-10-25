# Beacon

Turn Claude workflows into repeatable, shareable processes.

Complex tasks overwhelm single AI conversations. Beacon breaks them into focused stages with explicit context passing. Define the workflow once as YAML, run it anytime, share it with your team.

**Why this matters:**

- **Handles complexity** - Multi-step tasks stay focused instead of losing the thread
- **Repeatable** - Run the same workflow on different bugs, PRs, or tasks
- **Shareable** - Team workflows instead of personal Claude conversations
- **Debuggable** - See exactly what information passed between stages

Stop re-explaining the same process to Claude. Define it once, use it everywhere.

## Quick Example

Say you want a repeatable process for fixing bugs. Instead of manually walking Claude through the same steps each time, define the workflow once:

1. Analyze Issue
2. Create Reproduction
3. Write Test
4. Implement Fix
5. Verify Fix
6. Cleanup

This is a lot to ask Claude to do one-shot. Instead, let's break this into a workflow and make it vastly more effective, repeatable, and shareable across teams.

## How It Works

1. **Define workflows** in `.beacon/workflows/*.yml` files in your project
2. **Run workflows** with `beacon new`
3. **Claude executes** each stage, streaming output in real-time
4. **Context persists** - conversation history, files, changes all carry forward

Each stage sends a prompt to Claude CLI. Beacon handles orchestration and streaming.

### Context Passing

Claude automatically maintains conversation context (files read, commands run, changes made). This works fine for simple workflows.

For complex workflows, use **notes** to explicitly pass structured information between stages:

```note
[Stage Name]
Key information here
```

Each ` ```note ` block creates a new entry appended to an array. All previous notes are included in context for subsequent stages.

**Example flow:**

- Stage 1 adds: `[Analysis] Root cause: X, Files: Y`
- Stage 2 sees that, adds: `[Reproduction] File: tests/repro.test.ts`
- Stage 3 sees both, adds: `[Test] Test file: tests/unit/foo.test.ts`

Notes make the information flow explicit and debuggable. You can see exactly what passed between stages.

## Installation

```bash
# Install globally from npm
npm install -g beacon-cli
```

**Prerequisites:**

- Node.js 18 or higher
- [Claude CLI](https://claude.ai/download) installed and configured

## Quick Start

Create your first workflow in under 2 minutes:

```bash
# 1. Create the workflows directory
mkdir -p .beacon/workflows

# 2. Create a workflow file
cat > .beacon/workflows/hello.yml << 'EOF'
stages:
  - title: 'Greet user'
    type: 'prompt'
    prompt: Say hello and tell me a programming joke
EOF

# 3. Run it
beacon new
```

Select your workflow from the interactive menu and watch it run. That's it.

## Use Cases

### Bug Fixing Workflow

The workflow from the Quick Example, implemented in YAML:

````yaml
# .beacon/workflows/fix-bug.yml
stages:
  - title: 'Analyze issue'
    type: 'prompt'
    prompt: |
      Read the GitHub issue and analyze the bug report.

      Create a note with your analysis:
      ```note
      [Analysis]
      Summary: [one-line description]
      Root cause: [your hypothesis]
      Expected behavior: [what should happen]
      Actual behavior: [what's happening]
      Affected files: [list with line numbers]
      Reproduction steps: [numbered list]
      ```

  - title: 'Create reproduction'
    type: 'prompt'
    prompt: |
      Review the analysis note. Using the reproduction steps, create a minimal
      reproduction case in tests/repro/issue-[number].test.ts

      Add a note with the results:
      ```note
      [Reproduction]
      File: tests/repro/issue-[number].test.ts
      Verified: [yes/no - does it reproduce the bug?]
      ```

  - title: 'Write test'
    type: 'prompt'
    prompt: |
      Review the analysis note (root cause, expected behavior, affected files).
      1. Write a proper unit test in the appropriate test file
      2. Test should verify the expected behavior
      3. Run it - confirm it fails due to the bug

      Add a note with test details:
      ```note
      [Test]
      Test file: [path]
      Test name: [function name]
      Status: FAILING (as expected)
      ```

  - title: 'Implement fix'
    type: 'prompt'
    prompt: |
      Review the analysis note (root cause, affected files).
      1. Implement the fix in the affected files
      2. Run the test from the test note - make it pass
      3. Keep changes minimal

      Add a note documenting the fix:
      ```note
      [Fix]
      Applied: [description]
      Changed files: [list]
      Test status: PASSING
      ```

  - title: 'Verify fix'
    type: 'prompt'
    prompt: |
      Review all previous notes.
      1. Run the full test suite - ensure no regressions
      2. Review the fix code one more time for quality
      3. Add code comments if the fix is non-obvious

      Add verification note:
      ```note
      [Verification]
      All tests: PASSING
      Regression check: CLEAR
      Code quality: [any issues?]
      ```

  - title: 'Cleanup'
    type: 'prompt'
    prompt: |
      Review all previous notes to finalize.
      1. Delete the reproduction file from the reproduction note
      2. Commit changes with message referencing the issue number
      3. Update the GitHub issue with summary

      Add completion note:
      ```note
      [Complete]
      Repro file: DELETED
      Committed: [commit SHA]
      Ready for review: YES
      ```
````

### Code Review Workflow

Systematically review PRs with consistent quality checks:

````yaml
# .beacon/workflows/code-review.yml
stages:
  - title: 'Analyze changes'
    type: 'prompt'
    prompt: |
      Review the git diff and catalog potential issues.

      Create a note organizing findings by category:
      ```note
      [Issues Found]
      Bugs: [potential bugs or logic errors]
      Code Quality: [style, complexity, maintainability issues]
      Security: [security concerns or vulnerabilities]
      Performance: [performance implications]
      Testing: [missing tests or test improvements needed]
      ```

  - title: 'Deep dive'
    type: 'prompt'
    prompt: |
      Review the issues note. For each issue found:
      1. Identify the specific file and line number
      2. Explain why it's a concern
      3. Suggest a concrete fix

      Add detailed analysis:
      ```note
      [Detailed Analysis]
      [For each issue: Location, Explanation, Suggested Fix]
      ```

  - title: 'Generate review'
    type: 'prompt'
    prompt: |
      Review all notes. Write a constructive PR review comment that:
      1. Starts with positive observations
      2. Groups issues by severity (blocking, important, nitpicks)
      3. Provides actionable feedback with code examples
      4. Ends with overall recommendation (approve, request changes, needs discussion)
````

### Content Creation Workflow

Research, draft, and polish content with structured handoffs:

````yaml
# .beacon/workflows/blog-post.yml
stages:
  - title: 'Research'
    type: 'prompt'
    prompt: |
      Research the topic and gather information.

      Create a note with research findings:
      ```note
      [Research]
      Topic: [main topic]
      Key points: [3-5 main points to cover]
      Target audience: [who this is for]
      Tone: [formal/casual/technical]
      Sources: [key sources to reference]
      Angle: [unique perspective or hook]
      ```

  - title: 'Outline'
    type: 'prompt'
    prompt: |
      Review the research note. Create a detailed outline.

      Add outline note:
      ```note
      [Outline]
      Introduction: [hook and thesis]
      Section 1: [heading and key points]
      Section 2: [heading and key points]
      Section 3: [heading and key points]
      Conclusion: [main takeaway]
      CTA: [call to action]
      ```

  - title: 'Draft'
    type: 'prompt'
    prompt: |
      Review the outline note. Write a complete first draft following the structure.
      Use the tone and angle from the research note.
      Save as: blog/[topic-slug].md

      Add draft note:
      ```note
      [Draft]
      File: blog/[topic-slug].md
      Word count: [approximate count]
      Sections completed: [list]
      ```

  - title: 'Polish'
    type: 'prompt'
    prompt: |
      Review the draft.
      1. Edit for clarity and conciseness
      2. Add a compelling introduction
      3. Ensure smooth transitions between sections
      4. Add SEO-friendly title and meta description
      5. Check that CTA is clear and actionable

      Add final note:
      ```note
      [Final]
      Changes made: [summary of edits]
      SEO title: [optimized title]
      Meta description: [description]
      Keywords: [target keywords]
      Ready to publish: YES
      ```
````

### Refactoring Workflow

Plan and execute refactoring with clear checkpoints:

````yaml
# .beacon/workflows/refactor.yml
stages:
  - title: 'Analyze code'
    type: 'prompt'
    prompt: |
      Review the target code and identify issues.

      Create analysis note:
      ```note
      [Analysis]
      Target: [files/modules to refactor]
      Code smells: [specific issues found]
      Dependencies: [what depends on this code]
      Test coverage: [current coverage percentage]
      Risk level: [high/medium/low]
      Suggested approach: [refactoring strategy]
      ```

  - title: 'Create plan'
    type: 'prompt'
    prompt: |
      Review the analysis note. Create a step-by-step refactoring plan.
      Each step should be small, testable, and reversible.

      Add plan note:
      ```note
      [Plan]
      Step 1: [specific change - what and why]
      Step 2: [specific change - what and why]
      Step 3: [specific change - what and why]
      ...
      Success criteria: [how we know it's done]
      ```

  - title: 'Execute refactoring'
    type: 'prompt'
    prompt: |
      Review the plan note. Execute each step in order.
      After each step:
      1. Run the tests
      2. Commit if tests pass
      3. Stop and report if tests fail

      Add completion note:
      ```note
      [Complete]
      Steps completed: [list with commit SHAs]
      Tests: PASSING
      Files changed: [list]
      Lines added/removed: [+X -Y]
      ```
````

## Workflow Definition

Workflows are YAML files in `.beacon/workflows/`:

```yaml
stages:
  - title: 'Stage name'
    type: 'prompt'
    prompt: |
      Your prompt here. Multi-line supported.
      Claude receives this exactly as written.
```

**Stage fields:**

- `title`: Stage name (displayed during execution)
- `type`: Currently only `'prompt'` supported
- `prompt`: Text sent to Claude

### Using Notes

Use notes to pass structured information between stages:

````yaml
stages:
  - title: 'Analyze'
    type: 'prompt'
    prompt: |
      Analyze the code and create a note:
      ```note
      [Analysis]
      Files to change: src/foo.ts, src/bar.ts
      Approach: refactor X to use Y
      ```

  - title: 'Execute'
    type: 'prompt'
    prompt: |
      Review the analysis note. Apply the changes to the files listed.
````

**How notes work:**

- Each ` ```note ` block appends a new entry to the array
- All previous notes are automatically in context for later stages
- Use labeled sections like `[Analysis]`, `[Test]`, `[Fix]` to organize

**When to use notes:**

- Complex workflows where implicit context gets messy
- Passing specific info between stages (file paths, decisions, findings)
- Making workflows reusable/debuggable

### Tips

- **Be specific** - Claude can read/write files, run commands. Tell it exactly what to do.
- **One goal per stage** - Keep stages focused.
- **Use multiline prompts** - The `|` syntax preserves formatting.
- **Label your notes** - Makes it easy to reference specific information later.

## Commands

```bash
# Run a workflow interactively
beacon new

# View execution history
beacon logs

# Clear execution history
beacon clear-logs

# Show help
beacon --help

# Show version
beacon --version
```

## Development

```bash
npm run dev          # Run in development mode
npm test             # Run tests
npm run test:coverage # Coverage report
npm run lint         # Lint code
npm run format       # Format code
```

**Architecture:** Clean layers (CLI → Commands → Services → Repositories), SQLite for state.

**Adding commands:** Extend `BaseCommand`, create service, register in `src/index.ts`, write tests.

## Contributing

Contributions welcome. Open an issue to discuss or submit a PR.

Ideas for future work: additional stage types, workflow variables, error handling/retry, pause/resume, workflow sharing.

## License

MIT
