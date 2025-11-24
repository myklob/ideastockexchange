/**
 * Integration Tests for API Endpoints
 */

const request = require('supertest');
const app = require('../../backend/src/server');
const { initializeDatabase, closeDatabase, getDatabase } = require('../../backend/src/config/database');

// Test suite setup and teardown
beforeAll(() => {
  initializeDatabase();
});

afterAll(() => {
  closeDatabase();
});

beforeEach(() => {
  // Clear database before each test
  const db = getDatabase();
  db.prepare('DELETE FROM patterns').run();
  db.prepare('DELETE FROM claims').run();
  db.prepare('DELETE FROM users').run();
  db.prepare('DELETE FROM detections').run();
});

describe('Claims API', () => {
  describe('GET /api/claims', () => {
    test('should return empty array when no claims exist', async () => {
      const response = await request(app)
        .get('/api/claims')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.claims).toEqual([]);
      expect(response.body.count).toBe(0);
    });

    test('should return all claims', async () => {
      // Create test claim
      const testClaim = testUtils.createTestClaim();
      await request(app)
        .post('/api/claims')
        .send(testClaim);

      // Get all claims
      const response = await request(app)
        .get('/api/claims')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.claims).toHaveLength(1);
      expect(response.body.claims[0].title).toBe(testClaim.title);
    });

    test('should filter claims by search query', async () => {
      // Create multiple test claims
      await request(app)
        .post('/api/claims')
        .send(testUtils.createTestClaim({ id: 'claim1', title: 'Vaccines cause autism' }));

      await request(app)
        .post('/api/claims')
        .send(testUtils.createTestClaim({ id: 'claim2', title: 'Climate change is a hoax' }));

      // Search for specific claim
      const response = await request(app)
        .get('/api/claims?search=vaccine')
        .expect(200);

      expect(response.body.claims).toHaveLength(1);
      expect(response.body.claims[0].title).toContain('Vaccines');
    });

    test('should filter claims by category', async () => {
      // Create claims with different categories
      await request(app)
        .post('/api/claims')
        .send(testUtils.createTestClaim({ id: 'claim1', category: 'health' }));

      await request(app)
        .post('/api/claims')
        .send(testUtils.createTestClaim({ id: 'claim2', category: 'science' }));

      // Filter by category
      const response = await request(app)
        .get('/api/claims?category=health')
        .expect(200);

      expect(response.body.claims).toHaveLength(1);
      expect(response.body.claims[0].category).toBe('health');
    });
  });

  describe('POST /api/claims', () => {
    test('should create new claim', async () => {
      const testClaim = testUtils.createTestClaim();

      const response = await request(app)
        .post('/api/claims')
        .send(testClaim)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.claim.id).toBe(testClaim.id);
      expect(response.body.claim.title).toBe(testClaim.title);
    });

    test('should fail without required fields', async () => {
      const invalidClaim = {
        id: 'test-claim',
        // Missing required fields
      };

      await request(app)
        .post('/api/claims')
        .send(invalidClaim)
        .expect(400);
    });

    test('should fail with invalid confidence value', async () => {
      const invalidClaim = testUtils.createTestClaim({
        confidence: 1.5 // Invalid: > 1
      });

      await request(app)
        .post('/api/claims')
        .send(invalidClaim)
        .expect(400);
    });

    test('should fail with duplicate ID', async () => {
      const testClaim = testUtils.createTestClaim();

      // Create first claim
      await request(app)
        .post('/api/claims')
        .send(testClaim)
        .expect(201);

      // Try to create duplicate
      await request(app)
        .post('/api/claims')
        .send(testClaim)
        .expect(409);
    });
  });

  describe('GET /api/claims/:id', () => {
    test('should get claim by ID', async () => {
      const testClaim = testUtils.createTestClaim();

      // Create claim
      await request(app)
        .post('/api/claims')
        .send(testClaim);

      // Get claim by ID
      const response = await request(app)
        .get(`/api/claims/${testClaim.id}`)
        .expect(200);

      expect(response.body.claim.id).toBe(testClaim.id);
      expect(response.body.claim.patterns).toEqual(testClaim.patterns);
    });

    test('should return 404 for non-existent claim', async () => {
      await request(app)
        .get('/api/claims/non-existent-id')
        .expect(404);
    });
  });

  describe('PUT /api/claims/:id', () => {
    test('should update claim', async () => {
      const testClaim = testUtils.createTestClaim();

      // Create claim
      await request(app)
        .post('/api/claims')
        .send(testClaim);

      // Update claim
      const updatedData = { title: 'Updated Title' };
      const response = await request(app)
        .put(`/api/claims/${testClaim.id}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.claim.title).toBe('Updated Title');
    });

    test('should return 404 when updating non-existent claim', async () => {
      await request(app)
        .put('/api/claims/non-existent-id')
        .send({ title: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/claims/:id', () => {
    test('should delete claim', async () => {
      const testClaim = testUtils.createTestClaim();

      // Create claim
      await request(app)
        .post('/api/claims')
        .send(testClaim);

      // Delete claim
      await request(app)
        .delete(`/api/claims/${testClaim.id}`)
        .expect(200);

      // Verify deletion
      await request(app)
        .get(`/api/claims/${testClaim.id}`)
        .expect(404);
    });

    test('should return 404 when deleting non-existent claim', async () => {
      await request(app)
        .delete('/api/claims/non-existent-id')
        .expect(404);
    });
  });

  describe('GET /api/claims/stats', () => {
    test('should return statistics', async () => {
      // Create test claims
      await request(app)
        .post('/api/claims')
        .send(testUtils.createTestClaim({ id: 'claim1' }));

      await request(app)
        .post('/api/claims')
        .send(testUtils.createTestClaim({ id: 'claim2' }));

      // Get stats
      const response = await request(app)
        .get('/api/claims/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.stats.totalClaims).toBe(2);
      expect(response.body.stats).toHaveProperty('avgEvidenceScore');
      expect(response.body.stats).toHaveProperty('categoryCounts');
    });
  });
});

describe('Analytics API', () => {
  describe('GET /api/analytics/detections', () => {
    test('should return detection analytics', async () => {
      const response = await request(app)
        .get('/api/analytics/detections')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toHaveProperty('total');
      expect(response.body.analytics).toHaveProperty('today');
      expect(response.body.analytics).toHaveProperty('thisWeek');
      expect(response.body.analytics).toHaveProperty('topClaims');
    });
  });
});

describe('Health Check', () => {
  test('should return healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });
});
