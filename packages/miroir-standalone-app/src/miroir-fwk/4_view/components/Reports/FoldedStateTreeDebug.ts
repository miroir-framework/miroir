// Debugging utilities for FoldedStateTree

import { FoldedStateTree } from "./FoldedStateTreeUtils";

export type FoldAction = "fold" | "unfold";
/**
 * Generate a string representation of a path array for debugging
 */
export function pathToString(path: (string | number)[]): string {
  return path.map(segment => 
    typeof segment === 'string' ? segment : `[${segment}]`
  ).join('.');
}

/**
 * Print the current structure of a FoldedStateTree to console
 */
export function printFoldedStateTree(tree: FoldedStateTree, prefix: string = ""): void {
  console.log(`${prefix}Folded State Tree:`);
  printTreeNode(tree, prefix);
}

/**
 * Recursive helper for printFoldedStateTree
 */
function printTreeNode(node: FoldedStateTree | "true", prefix: string = ""): void {
  if (node === "true") {
    console.log(`${prefix}  = true`);
    return;
  }
  
  Object.entries(node).forEach(([key, value]) => {
    if (value === "folded") {
      console.log(`${prefix}  ${key}: true`);
    } else {
      console.log(`${prefix}  ${key}:`);
      printTreeNode(value, `${prefix}    `);
    }
  });
}

/**
 * Debug a call to isNodeFolded
 */
export function debugIsNodeFolded(
  tree: FoldedStateTree | undefined, 
  path: (string | number)[],
  result: boolean
): void {
  console.log(`[DEBUG] isNodeFolded(${pathToString(path)}) => ${result}`);
  console.log(`Path array:`, path);
  console.log(`Tree state:`);
  if (tree) {
    printTreeNode(tree);
  } else {
    // console.log("  <empty>");
  }
}

/**
 * Debug a call to setNodeFolded
 */
export function debugSetNodeFoldedState(
  tree: FoldedStateTree,
  path: (string | number)[],
  folded: FoldAction,
  newTree: FoldedStateTree
): void {
  console.log(`[DEBUG] setNodeFolded(${pathToString(path)}, folded=${folded})`);
  console.log(`Before:`);
  printTreeNode(tree);
  console.log(`After:`);
  printTreeNode(newTree);
}