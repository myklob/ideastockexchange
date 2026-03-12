# Tests

This directory contains all tests for the Idea Stock Exchange project.

## Structure

```
tests/
├── unit/           # Unit tests (isolated, fast)
│   ├── core/       # Core module tests
│   ├── features/   # Feature-specific tests
│   └── lib/        # Library utility tests
├── integration/    # Integration tests (multi-module)
│   ├── api/        # API endpoint tests
│   └── database/   # Database interaction tests
└── e2e/            # End-to-end tests (full user flows)
```

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run e2e tests only
npm run test:e2e

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Naming Conventions

- Test files: `*.test.ts` or `*.spec.ts`
- Test descriptions: Should describe the behavior being tested
- Use kebab-case for test file names matching the source file

## Writing Tests

### Unit Tests
- Test a single function or component in isolation
- Mock all external dependencies
- Should be fast (< 100ms per test)

### Integration Tests
- Test interaction between multiple modules
- Use test database (SQLite in-memory)
- May involve API calls

### E2E Tests
- Test complete user workflows
- Use a test browser environment
- Verify UI behavior matches expectations
