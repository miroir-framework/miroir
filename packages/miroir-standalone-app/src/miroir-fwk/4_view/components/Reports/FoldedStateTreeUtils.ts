import { pathToString, type FoldAction } from "./FoldedStateTreeDebug";


/**
 * Safely resolves a path on the folded state tree
 * 
 * @param tree - The folded state tree to access
 * @param path - Path array to navigate
 * @returns The node at the path, or undefined if not found
 */
function safeResolvePathOnTree(
  tree: FoldedStateTree | undefined,
  path: (string | number)[]
): FoldedStateTree | "folded" | undefined {
  if (!tree || path.length === 0) return tree;
  
  // Manually navigate the path to avoid resolvePathOnObject exceptions
  let current: any = tree;
  
  for (let i = 0; i < path.length; i++) {
    if (typeof current !== 'object' || current === null || current === "folded") {
      return undefined;
    }
    
    const segment = String(path[i]);
    current = current[segment];
    
    if (current === undefined) {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Check if a node is folded at a specific path
 * 
 * @param tree - The folded state tree
 * @param path - Path array to check
 * @returns True if the node or any of its parents is folded
 */
export function isNodeFolded(
  tree: FoldedStateTree | undefined,
  path: (string | number)[]
): boolean {
  if (!tree || path.length === 0) return false;

  for (let i = 1; i <= path.length; i++) {
    const partialPath = path.slice(0, i);
    const node = safeResolvePathOnTree(tree, partialPath);
    // console.log(`  Checking nested path: ${pathToString(partialPath)}, result: ${node === "true" ? "folded" : "not folded"}`);
    if (node === "folded") {
      return true;
    }
  }
  
  return false;
}

/**
 * Set a node's folded state in the tree
 * 
 * @param tree - The current folded state tree
 * @param path - Path array to the node
 * @param foldAction - Whether to fold the node
 * @returns A new folded state tree with the updated state
 */
export function setNodeFolded(
  tree: FoldedStateTree,
  path: (string | number)[],
  foldAction: FoldAction
): FoldedStateTree {
  // console.log(`Setting node fold state: ${pathToString(path)} to ${foldAction ? "folded" : "unfolded"}`);
  
  const newTree = { ...tree };
  
  if (foldAction == "fold") {
    // Folding: Create the path and set the leaf to "true" in the nested structure
    let current = newTree;
    
    for (let i = 0; i < path.length - 1; i++) {
      const segment = String(path[i]);
      // console.log(`  Creating path segment: ${segment}`);
      if (current[segment] === "folded") {
        // If parent node is already folded, we should stop
        // console.log(`  Parent node ${segment} is already folded, stopping`);
        // debugSetNodeFoldedState(tree, path, foldAction, newTree);
        return newTree;
      }
      
      if (!current[segment]) {
        // console.log(`  Creating new object for segment: ${segment}`);
        current[segment] = {};
      }
      
      current = current[segment] as FoldedStateTree;
    }
    
    if (path.length > 0) {
      const lastSegment = String(path[path.length - 1]);
      // console.log(`  Setting leaf node ${lastSegment} to "folded"`);
      current[lastSegment] = "folded";
    }
    
  } else {
    if (path.length === 0) return {};
    
    // Check if any part of the path is in the legacy flat format that needs to be removed
    for (let i = 1; i <= path.length; i++) {
      const partialPath = path.slice(0, i);
      const partialStringPath = pathToString(partialPath);
      if (newTree[partialStringPath] === "folded") {
        // console.log(`  Removing partial legacy string path key: ${partialStringPath}`);
        delete newTree[partialStringPath];
      }
    }
    
    // Handle nested structure
    let current = newTree;
    let validPath = true;
    
    for (let i = 0; i < path.length - 1; i++) {
      const segment = String(path[i]);
      // console.log(`  Traversing path segment: ${segment}`);
      
      if (!current[segment] || current[segment] === "folded") {
        // Can't unfold if the path doesn't exist or parent is folded
        // console.log(`  Can't unfold: path segment ${segment} doesn't exist or is folded`);
        validPath = false;
        break;
      }
      
      current = current[segment] as FoldedStateTree;
    }
    
    if (validPath && path.length > 0) {
      const lastSegment = String(path[path.length - 1]);
      // console.log(`  Removing leaf node ${lastSegment}`);
      
      if (current[lastSegment]) {
        delete current[lastSegment];
        
        // Clean up empty parents
        cleanupEmptyParents(newTree, path.slice(0, -1));
      }
    }
  }
  
  // debugSetNodeFoldedState(tree, path, folded, newTree);
  return newTree;
}

/**
 * Remove empty parent nodes after unfolding
 */
function cleanupEmptyParents(tree: FoldedStateTree, path: (string | number)[]): void {
  if (path.length === 0) return;
  
  let current = tree;
  for (let i = 0; i < path.length - 1; i++) {
    const segment = String(path[i]);
    if (!current[segment] || current[segment] === "folded") return;
    current = current[segment] as FoldedStateTree;
  }
  
  const lastSegment = String(path[path.length - 1]);
  if (current[lastSegment] && Object.keys(current[lastSegment] as object).length === 0) {
    delete current[lastSegment];
    cleanupEmptyParents(tree, path.slice(0, -1));
  }
}

/**
 * Fold all children of a node
 */
export function foldAllChildren(
  tree: FoldedStateTree,
  path: (string | number)[],
  childKeys: (string | number)[]
): FoldedStateTree {
  const newTree = { ...tree };
  
  // Ensure path exists
  let current = newTree;
  for (let i = 0; i < path.length; i++) {
    const segment = String(path[i]);
    if (current[segment] === "folded") {
      // Parent already folded, no need to fold children
      return newTree;
    }
    
    if (!current[segment]) {
      current[segment] = {};
    }
    
    current = current[segment] as FoldedStateTree;
  }
  
  // Set all children to folded
  for (const childKey of childKeys) {
    current[String(childKey)] = "folded";
  }
  
  return newTree;
}

/**
 * Unfold all children of a node
 */
export function unfoldAllChildren(
  tree: FoldedStateTree,
  path: (string | number)[],
  childKeys: (string | number)[]
): FoldedStateTree {
  const newTree = { ...tree };
  
  // Find the node
  let current = newTree;
  for (let i = 0; i < path.length; i++) {
    const segment = String(path[i]);
    if (current[segment] === "folded") {
      // Parent is folded, nothing to do
      return newTree;
    }
    
    if (!current[segment]) {
      return newTree; // Path doesn't exist
    }
    
    current = current[segment] as FoldedStateTree;
  }
  
  // Remove all child keys
  for (const childKey of childKeys) {
    if (current[String(childKey)]) {
      delete current[String(childKey)];
    }
  }
  
  return newTree;
}

/**
 * unfolds exclusively along the given path in targetElement, folding all sibling nodes at each level.
 * 
 * @param tree - The current folded state tree
 * @param object - The object along which the tree shall be unfolded
 * @param path - Path array to the node
 * @returns A new folded state tree with the updated state
 */
export function exclusivelyUnfoldPath(
  tree: FoldedStateTree,
  object: any,
  path: (string | number)[],
): FoldedStateTree {
  let newTree = { ...tree };
  let currentTree = newTree;
  let currentObject = object;

  for (let i = 0; i < path.length; i++) {
    const segment = String(path[i]);
    // At each level, fold all siblings except the current segment
    if (currentObject && typeof currentObject === "object") {
      const siblingKeys = Object.keys(currentObject)
        .filter((k) => k !== segment)
        .filter((k) => typeof currentObject[k] === "object"); // object or array only
      for (const sibling of siblingKeys) {
        newTree = setNodeFolded(newTree, path.slice(0, i).concat(sibling), "fold");
      }
      // Prepare next level
      if (!currentTree[segment] || typeof currentTree[segment] !== "object") {
        currentTree[segment] = {};
      }
      currentTree = currentTree[segment] as FoldedStateTree;
      currentObject = currentObject[segment];
    } else {
      break;
    }
  }
  // console.log("After folding siblings, tree is:", newTree);
  // Unfold the target node (remove "folded" if present)
  if (path.length > 0) {
    newTree = setNodeFolded(newTree, path, "unfold");
  }
  return newTree;
}
