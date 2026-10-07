import { getIn, setIn } from "formik";
import {
  defaultMiroirModelEnvironment,
  defaultTransformerNode,
  removeTransformerNode,
  transformerUnionTypes,
  type BlockPath,
} from "miroir-core";
import React, { createContext, useCallback, useContext, useMemo } from "react";

import { TransformerNodeActions } from "../ValueObjectEditor/TransformerNodeActions.js";

// ################################################################################################
// #500: editing with blocks. The block view gets the whole watched value and a writer; every edit
// computes the new value with the miroir-core TransformerTreeEdit functions and writes it once, so
// one edit is one undo step (#499). The nodes the block view creates are `runtime` (analysis D2).
// ################################################################################################

export interface BlockEditing {
  /** The edited value: the root of the block tree. */
  root: unknown;
  /** Writes a new root value. */
  commit: (newRoot: unknown) => void;
  /** An undo history covers the value: edits act at once, without a confirmation. */
  undoable: boolean;
  /** The transformer types a transformer position accepts. */
  candidateTypes: string[];
  /** The node the block view creates for a type: its default, `runtime` throughout. */
  defaultNodeForType: (transformerType: string) => Record<string, unknown> | undefined;
}

export const BlockEditingContext = createContext<BlockEditing | undefined>(undefined);

export function useBlockEditing(): BlockEditing | undefined {
  return useContext(BlockEditingContext);
}

function pathKey(path: BlockPath): string {
  return path.map(String).join(".");
}

/** The value at `path` of `root`; the root itself for the empty path. */
export function valueAtPath(root: unknown, path: BlockPath): unknown {
  return path.length === 0 ? root : getIn(root, pathKey(path));
}

/** `root` with `value` at `path`; `value` itself for the empty path. */
export function withValueAtPath(root: unknown, path: BlockPath, value: unknown): unknown {
  return path.length === 0 ? value : setIn(root, pathKey(path), value);
}

/** The editing context of a block view whose value is written by `commit`. */
export function useBlockEditingValue(root: unknown, commit: ((newRoot: unknown) => void) | undefined, undoable: boolean) {
  const candidateTypes = useMemo(() => [...transformerUnionTypes(defaultMiroirModelEnvironment)].sort(), []);
  const defaultNodeForType = useCallback((transformerType: string) => {
    try {
      return defaultTransformerNode(transformerType, defaultMiroirModelEnvironment, "runtime");
    } catch {
      return undefined;
    }
  }, []);
  return useMemo(
    () => (commit ? { root, commit, undoable, candidateTypes, defaultNodeForType } : undefined),
    [root, commit, undoable, candidateTypes, defaultNodeForType],
  );
}

/**
 * The #415 node actions (wrap, pipe, unwrap, remove) of the transformer block at `path`. The
 * button's label names the block id, as the form names its node, so both views share it.
 */
export function BlockNodeActions(props: { path: BlockPath; blockId: string }) {
  const editing = useBlockEditing();
  const replace = useCallback(
    (newNode: unknown) => editing?.commit(withValueAtPath(editing.root, props.path, newNode)),
    [editing, props.path],
  );
  const remove = useCallback(() => {
    if (!editing) {
      return;
    }
    const returnValue = editing.defaultNodeForType("returnValue");
    editing.commit(removeTransformerNode(editing.root, props.path, { rootDefault: returnValue, slotDefault: returnValue }));
  }, [editing, props.path]);
  if (!editing) {
    return null;
  }
  return (
    <span onClick={(event) => event.stopPropagation()}>
      <TransformerNodeActions
        nodePath={props.blockId.split(".")}
        nodeValue={valueAtPath(editing.root, props.path)}
        candidateTypes={editing.candidateTypes}
        defaultNodeForType={editing.defaultNodeForType}
        onReplaceNode={replace}
        onRemoveNode={remove}
        undoable={editing.undoable}
      />
    </span>
  );
}
