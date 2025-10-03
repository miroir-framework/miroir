import { describe, it, expect } from 'vitest';
import { isNodeFolded, type FoldedStateTree } from '../../src/miroir-fwk/4_view/components/Reports/FoldedStateTreeUtils';

describe('isNodeFolded', () => {
  it('returns false for empty tree', () => {
    const tree: FoldedStateTree = {};
    expect(isNodeFolded(tree, ['path', 'to', 'node'])).toBe(false);
  });

  it('returns false for undefined tree', () => {
    expect(isNodeFolded(undefined, ['path', 'to', 'node'])).toBe(false);
  });

  it('returns false for empty path', () => {
    const tree: FoldedStateTree = {
      'definition': 'folded'
    };
    expect(isNodeFolded(tree, [])).toBe(false);
  });

  it('detects folded state in new nested structure', () => {
    const tree: FoldedStateTree = {
      ROOT: {
        definition: 'folded'
      }
    };
    expect(isNodeFolded(tree, ['ROOT', 'definition'])).toBe(true);
  });

  it('detects folded state for child nodes in nested structure', () => {
    const tree: FoldedStateTree = {
      ROOT: {
        definition: 'folded'
      }
    };
    expect(isNodeFolded(tree, ['ROOT', 'definition', 'child'])).toBe(true);
  });

  it('returns false when node is not folded in nested structure', () => {
    const tree: FoldedStateTree = {
      ROOT: {
        definition: {
          nested: 'folded'
        }
      }
    };
    expect(isNodeFolded(tree, ['ROOT', 'definition'])).toBe(false);
  });

  it('returns false when checking non-existent path', () => {
    const tree: FoldedStateTree = {
      ROOT: {
        definition: 'folded'
      }
    };
    expect(isNodeFolded(tree, ['nonexistent', 'path'])).toBe(false);
  });

  it('handles numeric path segments in nested structure', () => {
    const tree: FoldedStateTree = {
      ROOT: {
        '0': {
          item: 'folded'
        }
      }
    };
    expect(isNodeFolded(tree, ['ROOT', 0, 'item'])).toBe(true);
  });

  it('detects parent folded state prevents child checking', () => {
    const tree: FoldedStateTree = {
      ROOT: 'folded'
    };
    expect(isNodeFolded(tree, ['ROOT', 'any', 'child', 'path'])).toBe(true);
  });

  it('returns false for deeply nested unfolded path', () => {
    const tree: FoldedStateTree = {
      ROOT: {
        level1: {
          level2: {
            level3: {
              item: 'folded'
            }
          }
        }
      }
    };
    expect(isNodeFolded(tree, ['ROOT', 'level1', 'level2'])).toBe(false);
    expect(isNodeFolded(tree, ['ROOT', 'level1', 'level2', 'level3', 'item'])).toBe(true);
  });

  it('handles single element path', () => {
    const tree: FoldedStateTree = {
      ROOT: 'folded'
    };
    expect(isNodeFolded(tree, ['ROOT'])).toBe(true);
  });

  it('handles single element path not folded', () => {
    const tree: FoldedStateTree = {
      ROOT: {
        child: 'folded'
      }
    };
    expect(isNodeFolded(tree, ['ROOT'])).toBe(false);
  });
});