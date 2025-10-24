# Beacon CLI

A TypeScript-based CLI tool for persistent workflow state management with LLM prompting.

## Features

- **Layered Clean Architecture**: Separation of concerns with CLI, Command, Service, and Repository layers
- **SQLite Database**: Persistent state management with automatic migrations
- **Extensible Design**: Easy to add new commands and features
- **Comprehensive Testing**: Unit, integration, and E2E tests with 71% coverage
- **TypeScript**: Full type safety with strict mode enabled

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Link for local use (requires sudo on macOS)
sudo npm link

# Or run directly
node dist/index.js [command]
```

## Usage

```bash
# Show help
beacon --help

# Show version
beacon --version

# Run hello command
beacon hello

# Run hello with name
beacon hello --name "Your Name"
beacon hello -n "Your Name"
```

## Project Structure

```
beacon-cli/
├── src/
│   ├── cli/              # CLI layer (command registry)
│   ├── commands/         # Command layer (command implementations)
│   ├── services/         # Service layer (business logic)
│   ├── repositories/     # Repository layer (data access)
│   ├── db/               # Database connection and migrations
│   ├── domain/           # Domain types and entities
│   └── index.ts          # Main entry point
├── tests/
│   ├── unit/             # Unit tests (mocked dependencies)
│   ├── integration/      # Integration tests (real database)
│   └── helpers/          # Test utilities
├── dist/                 # Compiled JavaScript output
└── package.json
```

## Architecture

The CLI follows a **layered clean architecture** pattern:

1. **CLI Layer** - Entry point, argument parsing (Commander.js)
2. **Command Layer** - Command implementations, thin orchestrators
3. **Service Layer** - Business logic, orchestration
4. **Repository Layer** - Data access, SQL operations
5. **Domain Layer** - Core types and entities

Dependencies flow inward: CLI → Commands → Services → Repositories

## Development

```bash
# Run in development mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## Database

- **Location**: OS-specific application directory
  - macOS: `~/Library/Application Support/beacon/beacon.db`
  - Linux: `~/.config/beacon/beacon.db`
  - Windows: `%APPDATA%/beacon/beacon.db`

- **Schema**: Automatic migrations on startup
- **Migrations**: Located in `src/db/migrations/`

## Adding New Commands

1. Create command class in `src/commands/` extending `BaseCommand`
2. Create service in `src/services/` for business logic
3. Create repository in `src/repositories/` for data access (if needed)
4. Register command in `src/index.ts`
5. Write tests in `tests/unit/`, `tests/integration/`

Example:

```typescript
// src/commands/my-command.ts
export class MyCommand extends BaseCommand {
  readonly name = 'mycommand';
  readonly description = 'Description of my command';

  constructor(private myService: MyService) {
    super();
  }

  register(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .action(() => this.execute());
  }

  async execute(): Promise<void> {
    const result = await this.myService.doSomething();
    console.log(result);
  }
}
```

## Testing Strategy

- **Unit Tests**: Test each layer in isolation with mocks
- **Integration Tests**: Test layer interactions with in-memory database
- **E2E Tests**: Test full CLI execution by spawning processes

## Future Enhancements

This foundation is designed to be extended with:
- YAML-based workflow definitions
- Workflow state management (start, resume, stop)
- LLM integration for prompt management
- Workflow configuration and templates
- Progress tracking and history

## License

MIT
