// import { describe, it, expect } from 'vitest';
import { extractDoubleBracePatterns } from '../../src/1_core/mustache.js';

describe('mustache.unit', () => {
  describe("extractDoubleBracePatterns", () => {
    it('should extract patterns with double braces', () => {
      const input = 'Hello {{ name }}!';
      const result = extractDoubleBracePatterns(input);
      expect(result).toEqual([
        { content: 'name', start: 6, end: 15 }
      ]);
    });

    it('should extract patterns with name sequences', () => {
      const input = 'Hello {{ user.name }}!';
      const result = extractDoubleBracePatterns(input);
      expect(result).toEqual([
        { content: 'user.name', start: 6, end: 20 }
      ]);
    });

    it('should handle multiple patterns', () => {
      const input = 'Hello {{ name }}! Your age is {{ age }}.';
      const result = extractDoubleBracePatterns(input);
      expect(result).toEqual([
        { content: 'name', start: 6, end: 15 },
        { content: 'age', start: 30, end: 38 }
      ]);
    });

    it('should handle patterns with extra spaces', () => {
      const input = 'Hello {{  name  }}!';
      const result = extractDoubleBracePatterns(input);
      expect(result).toEqual([
        { content: 'name', start: 6, end: 17 }
      ]);
    });

    it('should return an empty array if no patterns are found', () => {
      const input = 'Hello world!';
      const result = extractDoubleBracePatterns(input);
      expect(result).toEqual([]);
    });

    it('should throw an error for empty patterns', () => {
      const input = 'Hello {{  }}!';
      expect(() => extractDoubleBracePatterns(input)).toThrow('Empty pattern found');
    });
  });
});