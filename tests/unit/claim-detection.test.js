/**
 * Unit Tests for Claim Detection Logic
 */

describe('Claim Detection', () => {
  describe('Pattern Matching', () => {
    test('should detect exact phrase match', () => {
      const text = 'Some people believe that vaccines cause autism.';
      const pattern = /vaccines cause autism/i;

      expect(pattern.test(text)).toBe(true);
    });

    test('should detect pattern with optional characters', () => {
      const text1 = 'vaccine causes autism';
      const text2 = 'vaccines cause autism';
      const pattern = /vaccines? causes? autism/i;

      expect(pattern.test(text1)).toBe(true);
      expect(pattern.test(text2)).toBe(true);
    });

    test('should be case insensitive', () => {
      const text = 'VACCINES CAUSE AUTISM';
      const pattern = /vaccines cause autism/i;

      expect(pattern.test(text)).toBe(true);
    });

    test('should match with punctuation', () => {
      const text = 'Do vaccines cause autism?';
      const pattern = /vaccines cause autism/i;

      expect(pattern.test(text)).toBe(true);
    });

    test('should not match unrelated text', () => {
      const text = 'Vaccines prevent diseases';
      const pattern = /vaccines cause autism/i;

      expect(pattern.test(text)).toBe(false);
    });
  });

  describe('Confidence Scoring', () => {
    test('should have confidence between 0 and 1', () => {
      const claim = testUtils.createTestClaim();

      expect(claim.confidence).toBeGreaterThanOrEqual(0);
      expect(claim.confidence).toBeLessThanOrEqual(1);
    });

    test('should have evidence score between 0 and 1', () => {
      const claim = testUtils.createTestClaim();

      expect(claim.evidenceScore).toBeGreaterThanOrEqual(0);
      expect(claim.evidenceScore).toBeLessThanOrEqual(1);
    });
  });

  describe('Claim Validation', () => {
    test('should require all mandatory fields', () => {
      const requiredFields = [
        'id',
        'title',
        'description',
        'url',
        'patterns',
        'confidence',
        'evidenceScore',
        'category'
      ];

      const claim = testUtils.createTestClaim();

      requiredFields.forEach(field => {
        expect(claim).toHaveProperty(field);
        expect(claim[field]).toBeDefined();
      });
    });

    test('should have at least one pattern', () => {
      const claim = testUtils.createTestClaim();

      expect(Array.isArray(claim.patterns)).toBe(true);
      expect(claim.patterns.length).toBeGreaterThan(0);
    });

    test('should have valid URL', () => {
      const claim = testUtils.createTestClaim();

      expect(() => new URL(claim.url)).not.toThrow();
    });

    test('should have valid category', () => {
      const validCategories = [
        'health', 'science', 'technology', 'psychology',
        'nutrition', 'economics', 'environment', 'history',
        'language', 'nature', 'conspiracy'
      ];

      const claim = testUtils.createTestClaim();

      expect(validCategories).toContain(claim.category);
    });
  });

  describe('Text Processing', () => {
    test('should handle nested HTML elements', () => {
      const text = 'Some <strong>vaccines</strong> cause <em>autism</em>';
      const cleanText = text.replace(/<[^>]*>/g, '');
      const pattern = /vaccines cause autism/i;

      expect(pattern.test(cleanText)).toBe(true);
    });

    test('should handle extra whitespace', () => {
      const text = 'vaccines  cause  autism';
      const normalizedText = text.replace(/\s+/g, ' ');
      const pattern = /vaccines cause autism/i;

      expect(pattern.test(normalizedText)).toBe(true);
    });

    test('should handle line breaks', () => {
      const text = 'vaccines\ncause\nautism';
      const normalizedText = text.replace(/\s+/g, ' ');
      const pattern = /vaccines cause autism/i;

      expect(pattern.test(normalizedText)).toBe(true);
    });
  });
});
