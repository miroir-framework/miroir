// import { describe, it, expect } from 'vitest';
import {

tokenStringQuote,
tokenNameQuote,
tokenComma,
tokenSeparatorForTableColumn,
tokenSeparatorForJsonAttributeAccess,
tokenSeparatorForTestingJsonAttributeAccess,
tokenSeparatorForSelect,
tokenSeparatorForWith,
tokenSeparatorForWithRtn,
protectedSqlAccessForPath,
} from '../src/1_core/SqlGeneratorUtils';


describe("SqlGeneratorUtils", () => {
  it("should export correct token values", () => {
    expect(tokenStringQuote).toBe("'");
    expect(tokenNameQuote).toBe('"');
    expect(tokenComma).toBe(",");
    expect(tokenSeparatorForTableColumn).toBe(".");
    expect(tokenSeparatorForJsonAttributeAccess).toBe(" -> ");
    expect(tokenSeparatorForTestingJsonAttributeAccess).toBe(" ? ");
    expect(tokenSeparatorForSelect).toBe(", ");
    expect(tokenSeparatorForWith).toBe(", ");
    expect(tokenSeparatorForWithRtn).toBe(", \n");
  });

  describe("protectedSqlAccessForPath", () => {
    it("should return empty string for empty path", () => {
      expect(protectedSqlAccessForPath([])).toBe("");
    });

    it("should return quoted name for single element path", () => {
      expect(protectedSqlAccessForPath(["foo"])).toBe('"foo"');
      expect(protectedSqlAccessForPath([123])).toBe('"123"');
    });

    it("should build correct SQL for two-level path", () => {
      expect(protectedSqlAccessForPath(["foo", "bar"])).toBe(
        `CASE WHEN NOT ("foo" ? 'bar') THEN '{"queryFailure": "FailedTransformer_contextReference"}'::jsonb ELSE "foo" -> 'bar' END`
      );
    });

    it('should build correct SQL for three-level path', () => {
      expect(protectedSqlAccessForPath(['foo', 'bar', 'baz'])).toBe(
        `CASE WHEN NOT ("foo" ? 'bar') OR NOT ("foo" -> 'bar' ? 'baz') THEN '{"queryFailure": "FailedTransformer_contextReference"}'::jsonb ELSE "foo" -> 'bar' -> 'baz' END`
      );
    });

    it('should handle numeric path elements', () => {
      expect(protectedSqlAccessForPath(['foo', 0, 'bar'])).toBe(
        `CASE WHEN NOT ("foo" ? '0') OR NOT ("foo" -> '0' ? 'bar') THEN '{"queryFailure": "FailedTransformer_contextReference"}'::jsonb ELSE "foo" -> '0' -> 'bar' END`
      );
    });

    it('should handle mixed string and number path elements', () => {
      expect(protectedSqlAccessForPath([1, 'bar', 2])).toBe(
        `CASE WHEN NOT ("1" ? 'bar') OR NOT ("1" -> 'bar' ? '2') THEN '{"queryFailure": "FailedTransformer_contextReference"}'::jsonb ELSE "1" -> 'bar' -> '2' END`
      );
    });
  });
});