/**
 * Jest Test Setup
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:'; // Use in-memory database for tests
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';

// Global test utilities
global.testUtils = {
  // Create a test claim object
  createTestClaim: (overrides = {}) => ({
    id: 'test-claim-' + Date.now(),
    title: 'Test Claim',
    description: 'This is a test claim for testing purposes',
    url: 'https://example.com/test',
    patterns: ['test pattern'],
    confidence: 0.85,
    reasonsFor: 10,
    reasonsAgainst: 20,
    evidenceScore: 0.75,
    category: 'health',
    ...overrides
  }),

  // Create test user
  createTestUser: (overrides = {}) => ({
    username: 'testuser',
    email: 'test@example.com',
    password: 'testpassword123',
    ...overrides
  })
};

// Suppress console.log during tests (optional)
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  };
}
