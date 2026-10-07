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
// A palette click arms a transformer type, Place arms a tray block; an insert target or Replace
// with in a block menu then puts a new block of that type, or the tray block, and disarms it.
// The tray holds the blocks moved out of the value; it is not saved and not in the undo history.
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
  /** What the next insert or Replace with puts: a palette type or a tray block. */
  armed: ArmedBlock | undefined;
  arm: (armed: ArmedBlock | undefined) => void;
  /** The node the armed block puts. */
  armedNode: () => Record<string, unknown> | undefined;
  /** Disarms, and takes an armed tray block out of the tray: it was put. */
  consumeArmed: () => void;
  /** The insert positions of the value by the path of their container (see `pathKey`). */
  insertPositions: Map<string, TransformerInsertPosition[]>;
  /** Puts the armed block at `path`, an insert position. */
  insertArmedAt: (path: BlockPath) => void;
  /** The blocks moved out of the value; undefined: the view has no tray. */
  tray: unknown[] | undefined;
  /** Moves the block at `path` to the tray; its slot gets its default. */
  moveToTray: (path: BlockPath) => void;
  discardTrayBlock: (index: number) => void;
  /** The block whose result bubble is open, by `pathKey`. */
  shownResult: string | undefined;
  toggleResult: (path: BlockPath) => void;
}

export type ArmedBlock = { kind: "type"; transformerType: string } | { kind: "tray"; index: number };

/** How a menu or a target names the armed block. */
export function armedLabel(armed: ArmedBlock): string {
  return armed.kind === "type" ? armed.transformerType : `tray block ${armed.index + 1}`;
}

/** A change of the tray of a block view. */
export type TrayUpdate = (tray: unknown[]) => unknown[];

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The editing context of a block view whose value is written by `commit`, with the tray `tray`
 * changed by `changeTray`.
 */
export function useBlockEditingValue(
  root: unknown,
  commit: ((newRoot: unknown) => void) | undefined,
  undoable: boolean,
  tray?: unknown[],
  changeTray?: (update: TrayUpdate) => void,
): BlockEditing | undefined {
  const candidateTypes = useMemo(() => [...transformerUnionTypes(defaultMiroirModelEnvironment)].sort(), []);
  const [armed, arm] = useState<ArmedBlock | undefined>(undefined);
  const [shownResult, setShownResult] = useState<string | undefined>(undefined);
  const toggleResult = useCallback(
    (path: BlockPath) => setShownResult((current) => (current === pathKey(path) ? undefined : pathKey(path))),
    [],
  );
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
  const armedNode = useCallback((): Record<string, unknown> | undefined => {
    if (armed?.kind === "type") {
      return defaultNodeForType(armed.transformerType);
    }
    const trayBlock = armed?.kind === "tray" ? tray?.[armed.index] : undefined;
    return isRecord(trayBlock) ? trayBlock : undefined;
  }, [armed, tray]);
  const consumeArmed = useCallback(() => {
    if (armed?.kind === "tray") {
      changeTray?.((current) => current.filter((_, index) => index !== armed.index));
    }
    arm(undefined);
  }, [armed, changeTray]);
  const insertArmedAt = useCallback(
    (path: BlockPath) => {
      const node = armedNode();
      if (!commit || !node) {
        return;
      }
      commit(insertTransformerNode(root, path, node, { slotDefault: defaultNodeForType("returnValue") }));
      consumeArmed();
    },
    [root, commit, armedNode, consumeArmed],
  );
  const moveToTray = useCallback(
    (path: BlockPath) => {
      if (!commit || !changeTray) {
        return;
      }
      const returnValue = defaultNodeForType("returnValue");
      changeTray((current) => [...current, valueAtPath(root, path)]);
      commit(removeTransformerNode(root, path, { rootDefault: returnValue, slotDefault: returnValue }));
    },
    [root, commit, changeTray],
  );
  const discardTrayBlock = useCallback(
    (index: number) => {
      changeTray?.((current) => current.filter((_, position) => position !== index));
      // an armed tray index may now name another block
      arm((current) => (current?.kind === "tray" ? undefined : current));
    },
    [changeTray],
  );
  return useMemo(
    () =>
      commit
        ? {
            root,
            commit,
            undoable,
            candidateTypes,
            defaultNodeForType,
            armed,
            arm,
            armedNode,
            consumeArmed,
            insertPositions,
            insertArmedAt,
            tray: changeTray ? (tray ?? []) : undefined,
            moveToTray,
            discardTrayBlock,
            shownResult,
            toggleResult,
          }
        : undefined,
    [
      root,
      commit,
      undoable,
      candidateTypes,
      armed,
      armedNode,
      consumeArmed,
      insertPositions,
      insertArmedAt,
      tray,
      changeTray,
      moveToTray,
      discardTrayBlock,
      shownResult,
      toggleResult,
    ],
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
        const label = editing.armed
          ? `Put ${armedLabel(editing.armed)} here`
          : "Choose a block in the palette or the tray, then click here to put it";
        return (
          <button
            key={pathKey(position.path)}
            type="button"
            data-testid={`block-insert:${props.idOf(position.path)}`}
            data-insert-kind={position.kind}
            aria-label={label}
            title={label}
            disabled={!editing.armed}
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
              cursor: editing.armed ? "pointer" : "default",
              opacity: editing.armed ? 1 : 0.6,
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
  // Replace with a palette type keeps the attributes the new type takes, as a form type change
  // does; a tray block takes the place as it is
  const [pendingChange, setPendingChange] = useState<{ node: unknown; dropped: string[] } | undefined>(undefined);
  const extraEntries = useMemo((): TransformerNodeExtraEntry[] => {
    if (!editing) {
      return [];
    }
    const entries: TransformerNodeExtraEntry[] = [];
    const armed = editing.armed;
    const newNode = editing.armedNode();
    if (armed && newNode) {
      const replaceWithArmed = () => {
        if (armed.kind === "tray") {
          replace(newNode);
          editing.consumeArmed();
          return;
        }
        const oldNode = valueAtPath(editing.root, props.path) as Record<string, unknown>;
        const change = keepAttributesOnTypeChange(oldNode, newNode, defaultMiroirModelEnvironment);
        editing.consumeArmed();
        if (editing.undoable || change.dropped.length === 0) {
          replace(change.node);
          return;
        }
        setPendingChange(change);
      };
      entries.push({ testId: "block-action-replace", label: `Replace with ${armedLabel(armed)}`, onClick: replaceWithArmed });
    }
    // an absent interpolation is evaluated as build (analysis D2): the switch writes it
    const node = valueAtPath(editing.root, props.path);
    const interpolation = isRecord(node) && node.interpolation === "runtime" ? "runtime" : "build";
    const switchedTo = interpolation === "runtime" ? "build" : "runtime";
    entries.push({
      testId: "block-action-interpolation",
      label: `Switch to ${switchedTo}`,
      onClick: () => replace({ ...(node as Record<string, unknown>), interpolation: switchedTo }),
    });
    if (editing.tray) {
      entries.push({ testId: "block-action-tray", label: "Move to tray", onClick: () => editing.moveToTray(props.path) });
    }
    return entries;
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
