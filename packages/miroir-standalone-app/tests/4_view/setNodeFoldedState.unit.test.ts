import { describe, it, expect } from 'vitest';
import { setNodeFolded, isNodeFolded, type FoldedStateTree } from '../../src/miroir-fwk/4_view/components/Reports/FoldedStateTreeUtils';

describe('setNodeFolded', () => {
  describe('when folding nodes', () => {
    it('creates a simple folded node', () => {
      const tree: FoldedStateTree = {};
      const result = setNodeFolded(tree, ['ROOT'], "fold");
      
      expect(result).toEqual({
        'ROOT': 'folded'
      });
      expect(isNodeFolded(result, ['ROOT'])).toBe(true);
    });

    it('creates a deeply nested folded node', () => {
      const tree: FoldedStateTree = {};
      const result = setNodeFolded(tree, ['ROOT', 'level1', 'level2'], "fold");
      
      expect(result).toEqual({
        ROOT: {
          level1: {
            level2: "folded",
          },
        },
      });
      expect(isNodeFolded(result, ['ROOT', 'level1', 'level2'])).toBe(true);
    });

    it('preserves existing nodes when folding a new node', () => {
      const tree: FoldedStateTree = {
        'ROOT': {
          'existingNode': 'folded'
        }
      };
      const result = setNodeFolded(tree, ['ROOT', 'newNode'], "fold");
      
      expect(result).toEqual({
        'ROOT': {
          'existingNode': 'folded',
          'newNode': 'folded'
        }
      });
      expect(isNodeFolded(result, ['ROOT', 'existingNode'])).toBe(true);
      expect(isNodeFolded(result, ['ROOT', 'newNode'])).toBe(true);
    });

    it('does not modify folded parents', () => {
      const tree: FoldedStateTree = {
        'ROOT': 'folded'
      };
      const result = setNodeFolded(tree, ['ROOT', 'child'], "fold");
      
      // Should not add a child to an already folded node
      expect(result).toEqual({
        'ROOT': 'folded'
      });
      expect(isNodeFolded(result, ['ROOT'])).toBe(true);
      expect(isNodeFolded(result, ['ROOT', 'child'])).toBe(true); // Child is also considered folded
    });

    it('handles numeric path segments', () => {
      const tree: FoldedStateTree = {};
      const result = setNodeFolded(tree, ['ROOT', 0, 'item'], "fold");
      
      expect(result).toEqual({
        'ROOT': {
          '0': {
            'item': 'folded'
          }
        }
      });
      expect(isNodeFolded(result, ['ROOT', 0, 'item'])).toBe(true);
    });

    it('prunes child nodes when parent is folded', () => {
      const tree: FoldedStateTree = {
        'ROOT': {
          'node': {
            'child1': 'folded',
            'child2': {
              'grandchild': 'folded'
            }
          }
        }
      };
      const result = setNodeFolded(tree, ['ROOT', 'node'], "fold");
      
      // Node should be folded and its children pruned
      expect(result).toEqual({
        'ROOT': {
          'node': 'folded'
        }
      });
      expect(isNodeFolded(result, ['ROOT', 'node'])).toBe(true);
      expect(isNodeFolded(result, ['ROOT', 'node', 'child1'])).toBe(true);
      expect(isNodeFolded(result, ['ROOT', 'node', 'child2', 'grandchild'])).toBe(true);
    });
  });

  // Testing unfolding nodes
  describe('when unfolding nodes', () => {
    it('removes a simple folded node', () => {
      const tree: FoldedStateTree = {
        'ROOT': 'folded'
      };
      const result = setNodeFolded(tree, ['ROOT'], "unfold");
      
      expect(result).toEqual({});
      expect(isNodeFolded(result, ['ROOT'])).toBe(false);
    });

    it('removes a deeply nested folded node', () => {
      const tree: FoldedStateTree = {
        'ROOT': {
          'level1': {
            'level2': 'folded'
          }
        }
      };
      const result = setNodeFolded(tree, ['ROOT', 'level1', 'level2'], "unfold");
      
      // expect(result).toEqual({
      //   'ROOT': {
      //     'level1': "folded"
      //   }
      // });
      expect(result).toEqual({});
      expect(isNodeFolded(result, ['ROOT', 'level1', 'level2'])).toBe(false);
    });

    it('preserves sibling nodes when unfolding', () => {
      const tree: FoldedStateTree = {
        'ROOT': {
          'node1': 'folded',
          'node2': 'folded'
        }
      };
      const result = setNodeFolded(tree, ['ROOT', 'node1'], "unfold");
      
      expect(result).toEqual({
        'ROOT': {
          'node2': 'folded'
        }
      });
      expect(isNodeFolded(result, ['ROOT', 'node1'])).toBe(false);
      expect(isNodeFolded(result, ['ROOT', 'node2'])).toBe(true);
    });

    it('does nothing when trying to unfold a non-existent path', () => {
      const tree: FoldedStateTree = {
        'ROOT': {
          'node': 'folded'
        }
      };
      const result = setNodeFolded(tree, ['ROOT', 'nonexistent'], "unfold");
      
      expect(result).toEqual({
        'ROOT': {
          'node': 'folded'
        }
      });
    });

    it('handles unfolding with parent folded node', () => {
      const tree: FoldedStateTree = {
        'ROOT': 'folded'
      };
      // Trying to unfold a child of a folded node should not change the tree
      const result = setNodeFolded(tree, ['ROOT', 'child'], "unfold");
      
      expect(result).toEqual({});
      expect(isNodeFolded(result, ['ROOT'])).toBe(false);
      expect(isNodeFolded(result, ['ROOT', 'child'])).toBe(false);
    });

    it('handles empty path for unfolding', () => {
      const tree: FoldedStateTree = {
        'ROOT': 'folded'
      };
      const result = setNodeFolded(tree, [], "unfold");
      
      expect(result).toEqual({});
    });
  });

  // Test fold and unfold operations in sequence
  describe('complex operations', () => {
    it('can fold and then unfold a node', () => {
      let tree: FoldedStateTree = {};
      
      // First fold a node
      tree = setNodeFolded(tree, ['ROOT', 'node'], "fold");
      expect(isNodeFolded(tree, ['ROOT', 'node'])).toBe(true);
      
      // Then unfold it
      tree = setNodeFolded(tree, ['ROOT', 'node'], "unfold");
      expect(isNodeFolded(tree, ['ROOT', 'node'])).toBe(false);
    });

    it('can fold multiple levels and unfold them one by one', () => {
      let tree: FoldedStateTree = {};
      
      // Fold level 3
      tree = setNodeFolded(tree, ['ROOT', 'level1', 'level2', 'level3'], "fold");
      expect(isNodeFolded(tree, ['ROOT', 'level1', 'level2', 'level3'])).toBe(true);
      
      // Unfold level 3
      tree = setNodeFolded(tree, ['ROOT', 'level1', 'level2', 'level3'], "unfold");
      expect(isNodeFolded(tree, ['ROOT', 'level1', 'level2', 'level3'])).toBe(false);
      
      // Fold level 2
      tree = setNodeFolded(tree, ['ROOT', 'level1', 'level2'], "fold");
      expect(isNodeFolded(tree, ['ROOT', 'level1', 'level2'])).toBe(true);
      
      // Unfold level 2
      tree = setNodeFolded(tree, ['ROOT', 'level1', 'level2'], "unfold");
      expect(isNodeFolded(tree, ['ROOT', 'level1', 'level2'])).toBe(false);
    });
    
    it('handles simultaneous folded nodes at different levels', () => {
      let tree: FoldedStateTree = {};
      
      // Fold two different branches
      tree = setNodeFolded(tree, ['ROOT', 'branchA', 'node1'], "fold");
      tree = setNodeFolded(tree, ['ROOT', 'branchB', 'node2'], "fold");
      
      expect(isNodeFolded(tree, ['ROOT', 'branchA', 'node1'])).toBe(true);
      expect(isNodeFolded(tree, ['ROOT', 'branchB', 'node2'])).toBe(true);
      expect(isNodeFolded(tree, ['ROOT', 'branchA'])).toBe(false);
      expect(isNodeFolded(tree, ['ROOT', 'branchB'])).toBe(false);
      
      // Unfold one branch
      tree = setNodeFolded(tree, ['ROOT', 'branchA', 'node1'], "unfold");
      
      expect(isNodeFolded(tree, ['ROOT', 'branchA', 'node1'])).toBe(false);
      expect(isNodeFolded(tree, ['ROOT', 'branchB', 'node2'])).toBe(true);
    });
  });
});