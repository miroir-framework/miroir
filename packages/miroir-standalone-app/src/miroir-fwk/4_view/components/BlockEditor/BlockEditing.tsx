import { getIn, setIn } from "formik";
import {
  defaultMiroirModelEnvironment,
  defaultTransformerNode,
  insertTransformerNode,
  keepAttributesOnTypeChange,
  removeTransformerNode,
  transformerInsertPositions,
  transformerUnionTypes,
  type BlockPath,
  type TransformerInsertPosition,
} from "miroir-core";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import {
  TransformerNodeActions,
  TransformerTypeChangeDialog,
  type TransformerNodeExtraEntry,
} from "../ValueObjectEditor/TransformerNodeActions.js";

// ################################################################################################
// #500: editing with blocks. The block view gets the whole watched value and a writer; every edit
// computes the new value with the miroir-core TransformerTreeEdit functions and writes it once, so
// one edit is one undo step (#499). The nodes the block view creates are `runtime` (analysis D2).
//
// A palette click arms a transformer type; an insert target or Replace with in a block menu then
// puts a new block of that type, and disarms it.
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
  /** The transformer type the next insert or Replace with puts, chosen in the palette. */
  armedType: string | undefined;
  arm: (transformerType: string | undefined) => void;
  /** The insert positions of the value by the path of their container (see `pathKey`). */
  insertPositions: Map<string, TransformerInsertPosition[]>;
  /** Puts a new node of the armed type at `path`, an insert position. */
  insertArmedAt: (path: BlockPath) => void;
}

export const BlockEditingContext = createContext<BlockEditing | undefined>(undefined);

export function useBlockEditing(): BlockEditing | undefined {
  return useContext(BlockEditingContext);
}

export function pathKey(path: BlockPath): string {
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

function defaultNodeForType(transformerType: string): Record<string, unknown> | undefined {
  try {
    return defaultTransformerNode(transformerType, defaultMiroirModelEnvironment, "runtime");
  } catch {
    return undefined;
  }
}

/** The editing context of a block view whose value is written by `commit`. */
export function useBlockEditingValue(
  root: unknown,
  commit: ((newRoot: unknown) => void) | undefined,
  undoable: boolean,
): BlockEditing | undefined {
  const candidateTypes = useMemo(() => [...transformerUnionTypes(defaultMiroirModelEnvironment)].sort(), []);
  const [armedType, arm] = useState<string | undefined>(undefined);
  const insertPositions = useMemo(() => {
    const byContainer = new Map<string, TransformerInsertPosition[]>();
    if (commit) {
      for (const position of transformerInsertPositions(root)) {
        const key = pathKey(position.container);
        byContainer.set(key, [...(byContainer.get(key) ?? []), position]);
      }
    }
    return byContainer;
  }, [root, commit]);
  const insertArmedAt = useCallback(
    (path: BlockPath) => {
      const node = armedType ? defaultNodeForType(armedType) : undefined;
      if (!commit || !node) {
        return;
      }
      commit(insertTransformerNode(root, path, node, { slotDefault: defaultNodeForType("returnValue") }));
      arm(undefined);
    },
    [root, commit, armedType],
  );
  return useMemo(
    () =>
      commit
        ? { root, commit, undoable, candidateTypes, defaultNodeForType, armedType, arm, insertPositions, insertArmedAt }
        : undefined,
    [root, commit, undoable, candidateTypes, armedType, insertPositions, insertArmedAt],
  );
}

/** The insert targets of the positions in `container`: a click puts a block of the armed type. */
export function BlockInsertTargets(props: { container: BlockPath; idOf: (path: BlockPath) => string; color: string }) {
  const editing = useBlockEditing();
  const positions = editing?.insertPositions.get(pathKey(props.container));
  if (!editing || !positions) {
    return null;
  }
  return (
    <>
      {positions.map((position) => {
        const label = editing.armedType
          ? `Put ${editing.armedType} here`
          : "Choose a block in the palette, then click here to put it";
        return (
          <button
            key={pathKey(position.path)}
            type="button"
            data-testid={`block-insert:${props.idOf(position.path)}`}
            data-insert-kind={position.kind}
            aria-label={label}
            title={label}
            disabled={!editing.armedType}
            onClick={(event) => {
              event.stopPropagation();
              editing.insertArmedAt(position.path);
            }}
            style={{
              font: "inherit",
              fontSize: "12px",
              minWidth: "48px",
              height: "20px",
              padding: "0 6px",
              border: `1px dashed ${props.color}`,
              borderRadius: "6px",
              background: "transparent",
              color: "inherit",
              cursor: editing.armedType ? "pointer" : "default",
              opacity: editing.armedType ? 1 : 0.6,
            }}
          >
            {position.kind === "slot" ? "" : "+"}
          </button>
        );
      })}
    </>
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
  // Replace with the armed type keeps the attributes the new type takes, as a form type change does
  const [pendingChange, setPendingChange] = useState<{ node: unknown; dropped: string[] } | undefined>(undefined);
  const extraEntries = useMemo((): TransformerNodeExtraEntry[] => {
    if (!editing?.armedType) {
      return [];
    }
    const armedType = editing.armedType;
    const newNode = editing.defaultNodeForType(armedType);
    if (!newNode) {
      return [];
    }
    const replaceWithArmed = () => {
      const oldNode = valueAtPath(editing.root, props.path) as Record<string, unknown>;
      const change = keepAttributesOnTypeChange(oldNode, newNode, defaultMiroirModelEnvironment);
      editing.arm(undefined);
      if (editing.undoable || change.dropped.length === 0) {
        replace(change.node);
        return;
      }
      setPendingChange(change);
    };
    return [{ testId: "block-action-replace", label: `Replace with ${armedType}`, onClick: replaceWithArmed }];
  }, [editing, props.path, replace]);
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
        extraEntries={extraEntries}
      />
      {pendingChange && (
        <TransformerTypeChangeDialog
          transformerType={String((pendingChange.node as { transformerType: unknown }).transformerType)}
          dropped={pendingChange.dropped}
          onConfirm={() => {
            replace(pendingChange.node);
            setPendingChange(undefined);
          }}
          onCancel={() => setPendingChange(undefined)}
        />
      )}
    </span>
  );
}
