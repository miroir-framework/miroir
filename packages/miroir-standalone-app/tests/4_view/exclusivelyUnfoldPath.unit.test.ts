import { describe, it, expect } from 'vitest';
import { exclusivelyUnfoldPath, isNodeFolded, type FoldedStateTree } from '../../src/miroir-fwk/4_view/components/Reports/FoldedStateTreeUtils';

describe('exclusivelyUnfoldPath', () => {
  // TODO: return error when path does not exist in object

  it('unfolds a path in an empty tree', () => {
    const tree: FoldedStateTree = {};
    const object = { ROOT: { level1: { level2: { data: 'value' } } } };
    
    const result = exclusivelyUnfoldPath(tree, object, ['ROOT', 'level1', 'level2']);
    
    expect(isNodeFolded(result, ['ROOT', 'level1', 'level2'])).toBe(false);
  });

  it('folds all siblings at each level', () => {
    const tree: FoldedStateTree = {};
    const object = { 
      ROOT: { 
        branch1: { item1: {}, item2: {} }, 
        branch2: { item3: {}, item4: {} }
      }
    };
    
    const result = exclusivelyUnfoldPath(tree, object, ['ROOT', 'branch1']);
    
    // The chosen path should be unfolded
    expect(isNodeFolded(result, ['ROOT', 'branch1'])).toBe(false);
    
    // Siblings should be folded
    expect(isNodeFolded(result, ['ROOT', 'branch2'])).toBe(true);
    expect((result as any).ROOT.branch2).toBe('folded');
  });

  it('unfolds a deep path while folding all siblings', () => {
    const tree: FoldedStateTree = {};
    const object = { 
      ROOT: { 
        branch1: { 
          item1: { subitem1: {}, subitem2: {} },
          item2: {}
        }, 
        branch2: {}
      }
    };
    
    const result = exclusivelyUnfoldPath(tree, object, ['ROOT', 'branch1', 'item1', 'subitem1']);
    
    // The path should be unfolded
    expect(isNodeFolded(result, ['ROOT', 'branch1'])).toBe(false);
    expect(isNodeFolded(result, ['ROOT', 'branch1', 'item1'])).toBe(false);
    expect(isNodeFolded(result, ['ROOT', 'branch1', 'item1', 'subitem1'])).toBe(false);
    
    // Siblings at each level should be folded
    expect(isNodeFolded(result, ['ROOT', 'branch2'])).toBe(true);
    expect(isNodeFolded(result, ['ROOT', 'branch1', 'item2'])).toBe(true);
    expect(isNodeFolded(result, ['ROOT', 'branch1', 'item1', 'subitem2'])).toBe(true);
  });

  it('handles already folded nodes in the tree', () => {
    let tree: FoldedStateTree = {
      ROOT: {
        branch1: {
          item1: 'folded'
        },
        branch2: 'folded'
      }
    };
    
    const object = { 
      ROOT: { 
        branch1: { 
          item1: { subitem1: {}, subitem2: {} },
          item2: {}
        }, 
        branch2: { item3: {} }
      }
    };
    
    const result = exclusivelyUnfoldPath(tree, object, ['ROOT', 'branch1', 'item1']);
    
    // The path should be unfolded, including the previously folded item1
    expect(isNodeFolded(result, ['ROOT', 'branch1'])).toBe(false);
    expect(isNodeFolded(result, ['ROOT', 'branch1', 'item1'])).toBe(false);
    
    // branch2 should still be folded
    expect(isNodeFolded(result, ['ROOT', 'branch2'])).toBe(true);
    
    // item2 should be folded as a sibling of item1
    expect(isNodeFolded(result, ['ROOT', 'branch1', 'item2'])).toBe(true);
  });

  it('preserves existing folded state for non-siblings', () => {
    const tree: FoldedStateTree = {
      ROOT: {
        branch1: {
          item1: 'folded'
        },
        branch2: {
          item2: 'folded'
        },
        branch3: 'folded'
      }
    };
    
    const object = { 
      ROOT: { 
        branch1: { item1: {} },
        branch2: { item2: {} },
        branch3: { item3: {} },
        branch4: { item4: {} }
      }
    };
    
    const result = exclusivelyUnfoldPath(tree, object, ['ROOT', 'branch2']);
    
    // The path we're unfolding
    expect(isNodeFolded(result, ['ROOT', 'branch2'])).toBe(false);
    
    // Siblings of branch2 should be folded
    expect(isNodeFolded(result, ['ROOT', 'branch1'])).toBe(true);
    expect(isNodeFolded(result, ['ROOT', 'branch3'])).toBe(true);
    expect(isNodeFolded(result, ['ROOT', 'branch4'])).toBe(true);
    console.log(expect.getState().currentTestName,result);
    // Non-siblings and deeper nodes should maintain their original state
    expect(isNodeFolded(result, ['ROOT', 'branch2', 'item2'])).toBe(false);
  });

  it('handles empty path', () => {
    const tree: FoldedStateTree = {
      ROOT: 'folded'
    };
    
    const object = { ROOT: {} };
    
    const result = exclusivelyUnfoldPath(tree, object, []);
    
    // Should do nothing for empty path
    expect(result).toEqual(tree);
  });

  it('handles null or undefined object', () => {
    const tree: FoldedStateTree = {};
    
    // Test with null object
    let result = exclusivelyUnfoldPath(tree, null, ['path']);
    expect(result).toEqual({});
    
    // Test with undefined object
    result = exclusivelyUnfoldPath(tree, undefined, ['path']);
    expect(result).toEqual({});
  });

  // // it('handles non-existent path values in the data structure', () => {
  // //   const tree: FoldedStateTree = {};
    
  // //   // Object with primitive values that can't be navigated
  // //   const object = { 
  // //     ROOT: { 
  // //       branch1: 'string value',
  // //       branch2: 42,
  // //       branch3: { validObject: {} }
  // //     }
  // //   };
    
  // //   // Try to navigate into a primitive value
  // //   const result = exclusivelyUnfoldPath(tree, object, ['ROOT', 'branch1', 'nonexistent']);
    
  // //   // Should fold the siblings of branch1, but not go further since branch1 is a string
  // //   expect(isNodeFolded(result, ['ROOT', 'branch2'])).toBe(true);
  // //   expect(isNodeFolded(result, ['ROOT', 'branch3'])).toBe(true);
  // //   expect(result.ROOT.branch1).toBeUndefined(); // No folding status for the target path
  // // });

  it('correctly maintains complex tree structures with multiple branches', () => {
    const tree: FoldedStateTree = {
      A: {
        A1: 'folded',
        A2: {
          A2a: 'folded',
          A2b: {}
        }
      },
      B: 'folded'
    };
    
    const object = {
      A: {
        A1: { data: {} },
        A2: {
          A2a: { more: {} },
          A2b: { evenMore: {} }
        },
        A3: {}
      },
      B: { stuff: {} },
      C: { otherStuff: {} }
    };
    
    // Unfold path to A -> A2 -> A2b
    const result = exclusivelyUnfoldPath(tree, object, ['A', 'A2', 'A2b']);
    console.log(expect.getState().currentTestName,result);
    // The path we're unfolding
    expect(isNodeFolded(result, ['A'])).toBe(false);
    expect(isNodeFolded(result, ['A', 'A2'])).toBe(false);
    expect(isNodeFolded(result, ['A', 'A2', 'A2b'])).toBe(false);
    
    // Siblings at each level should be folded
    expect(isNodeFolded(result, ['B'])).toBe(true);
    expect(isNodeFolded(result, ['C'])).toBe(true);
    expect(isNodeFolded(result, ['A', 'A1'])).toBe(true);
    expect(isNodeFolded(result, ['A', 'A3'])).toBe(true);
    expect(isNodeFolded(result, ['A', 'A2', 'A2a'])).toBe(true);
  });
});