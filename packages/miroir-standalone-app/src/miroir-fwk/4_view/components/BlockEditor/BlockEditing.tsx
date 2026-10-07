import { Menu } from "@mui/material";
import {
  actionLabels,
  actionPaletteGroups,
  blockEnvironmentAt,
  blockInsertPositions,
  checkTransformerInterfaceRecursively,
  collectTransformerEnvironmentBindings,
  defaultActionNode,
  defaultTransformerNode,
  insertBlockNode,
  isBlockAction,
  isStepPosition,
  isValuePosition,
  keepAttributesOnTypeChange,
  moveBlockNode,
  referencePathAttributeNames,
  removeBlockNode,
  renameSequenceName,
  reorderTransformerNode,
  transformerUnionTypes,
  type ActionPaletteGroup,
  type BlockInsertPosition,
  type BlockPath,
  type CoreTransformerForBuildPlusRuntime,
  type MiroirModelEnvironment,
  type MlElement,
  type TransformerDefinitionRegistry,
  type TransformerEnvironment,
  type TransformerTypeChange,
} from "miroir-core";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

import { BlockActionDefaultsContext, useBlockModelEnvironment, type BlockRunInput } from "./BlockViewMode.js";
import {
  TransformerNodeActions,
  TransformerTypeChangeDialog,
  type TransformerNodeExtraEntry,
} from "../ValueObjectEditor/TransformerNodeActions.js";
import { ThemedMenuItem } from "../Themes/index";
import { useMiroirTheme } from "../../contexts/MiroirThemeContext";

// ################################################################################################
// #500: editing with blocks. The block view gets the whole watched value and a writer; every edit
// computes the new value with the miroir-core TransformerTreeEdit functions and writes it once, so
// one edit is one undo step (#499). The nodes the block view creates are `runtime` (analysis D2).
//
// A palette click arms a transformer type or a variable (#501), Place arms a tray block; an insert
// target or Replace with in a block menu then puts a new block of that type, the variable or the
// tray block, and disarms it. A variable goes only where its name is visible. A variable block
// reads a path: its attributes come from the ML schemas the #249 walk gives the names it sees.
// The tray holds the blocks moved out of the value; it is not saved and not in the undo history.
// #505: an action sequence is edited too, with the miroir-core ActionSequenceEdit functions: the
// palette offers the Endpoint actions, a step of a sequence takes an action and any other position
// a transformer, a literal, object or list below a payload can be replaced, and an action block has
// its own menu (BlockActionNodeActions). Its names are those the sequence binds.
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
  /** #505: the Endpoint actions of the palette, by Endpoint; empty when the value is a transformer. */
  actionGroups: ActionPaletteGroup[];
  /** The node the block view creates for a type: its default, `runtime` throughout. */
  defaultNodeForType: (transformerType: string) => Record<string, unknown> | undefined;
  /** The TransformerDefinitions of the edited application: stock ones and its composites (#502). */
  transformerDefinitions: TransformerDefinitionRegistry;
  /** What the next insert or Replace with puts: a palette type or a tray block. */
  armed: ArmedBlock | undefined;
  arm: (armed: ArmedBlock | undefined) => void;
  /** The node a palette type, a variable or a tray block puts. */
  nodeOf: (source: ArmedBlock) => Record<string, unknown> | undefined;
  /** The names visible at the root of the value: the editor's input, when it runs blocks. */
  rootEnvironment: TransformerEnvironment;
  /** The names visible at one block or insert position of the value at least (#501). */
  variables: TransformerEnvironment;
  /**
   * Whether `source` may go at `path`: an action only at a step of a sequence and nothing else
   * there (#505), a variable only where its name is visible.
   */
  accepts: (source: ArmedBlock, path: BlockPath) => boolean;
  /** #505: whether the literal, object or list at `path` can be replaced by a block. */
  replaceable: (path: BlockPath) => boolean;
  /** #505: removes the block at `path`: a step or an attribute goes, a required slot gets its default. */
  removeAt: (path: BlockPath) => void;
  /** #505: renames the record entry at `path`; returns why when it is refused. */
  renameKey: (path: BlockPath, to: string) => string | undefined;
  /**
   * The attributes of the value `referencePath` reads from the block at `path`, a getFromContext,
   * when its schema is known (#501).
   */
  attributesAt: (path: BlockPath, referencePath: string[]) => string[] | undefined;
  /** The insert positions of the value by the path of their container (see `pathKey`). */
  insertPositions: Map<string, BlockInsertPosition[]>;
  /** Puts a block of the palette or the tray at `path`, an insert position, and disarms. */
  insertAt: (source: ArmedBlock, path: BlockPath) => void;
  /**
   * Puts a block of the palette or the tray in place of the block at `path`, and disarms. A palette
   * type keeps the attributes it takes; without an undo history, a change that drops some is not
   * written but returned, for a confirmation.
   */
  replaceAt: (source: ArmedBlock, path: BlockPath) => TransformerTypeChange | undefined;
  /** Moves the block at `from` to `to`, an insert position (drag and drop). */
  moveBlock: (from: BlockPath, to: BlockPath) => void;
  /** The blocks moved out of the value; undefined: the view has no tray. */
  tray: unknown[] | undefined;
  /** Moves the block at `path` to the tray; its slot gets its default. */
  moveToTray: (path: BlockPath) => void;
  discardTrayBlock: (index: number) => void;
  /** The block whose result bubble is open, by `pathKey`. */
  shownResult: string | undefined;
  toggleResult: (path: BlockPath) => void;
}

/** A name in scope: a context name reads with getFromContext, a parameter with getFromParameters. */
export type VariableSource = "context" | "parameters";

export type ArmedBlock =
  | { kind: "type"; transformerType: string }
  | { kind: "action"; actionType: string }
  | { kind: "tray"; index: number }
  | { kind: "variable"; source: VariableSource; name: string; path?: string[] };

/** How a menu or a target names the armed block. */
export function armedLabel(armed: ArmedBlock): string {
  switch (armed.kind) {
    case "type":
      return armed.transformerType;
    case "action":
      return armed.actionType;
    case "tray":
      return `tray block ${armed.index + 1}`;
    case "variable":
      return armed.path
        ? `form field ${armed.path.slice(1).join(".")}`
        : `${armed.source === "context" ? "context" : "parameter"} ${armed.name}`;
  }
}

/** A change of the tray of a block view. */
export type TrayUpdate = (tray: unknown[]) => unknown[];

export const BlockEditingContext = createContext<BlockEditing | undefined>(undefined);

export function useBlockEditing(): BlockEditing | undefined {
  return useContext(BlockEditingContext);
}

/** A key of `path` that keeps its segments apart: a record key may hold a dot. */
export function pathKey(path: BlockPath): string {
  return JSON.stringify(path.map(String));
}

/** The value at `path` of `root`; the root itself for the empty path. Each segment is one key. */
export function valueAtPath(root: unknown, path: BlockPath): unknown {
  return path.reduce<unknown>(
    (current, segment) =>
      typeof current === "object" && current !== null ? (current as Record<string, unknown>)[segment] : undefined,
    root,
  );
}

/** A copy of `root` with `value` at `path`; `value` itself for the empty path. Each segment is one key. */
export function withValueAtPath(root: unknown, path: BlockPath, value: unknown): unknown {
  if (path.length === 0) {
    return value;
  }
  const [head, ...rest] = path;
  if (Array.isArray(root)) {
    const copy = [...root];
    copy[Number(head)] = withValueAtPath(root[Number(head)], rest, value);
    return copy;
  }
  const base = isRecord(root) ? root : {};
  return { ...base, [head]: withValueAtPath(base[head], rest, value) };
}

function defaultNodeForType(
  transformerType: string,
  modelEnvironment: MiroirModelEnvironment,
  transformerDefinitions: TransformerDefinitionRegistry,
): Record<string, unknown> | undefined {
  try {
    return defaultTransformerNode(transformerType, modelEnvironment, "runtime", transformerDefinitions);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A step of a sequence: an `actionType` and no `transformerType`. */
function isActionValue(value: unknown): boolean {
  return isRecord(value) && typeof value.actionType === "string" && typeof value.transformerType !== "string";
}

/** The block a variable puts: a runtime read of its name, or of `path` from it (a Runner's form field, #505). */
export function variableNode(source: VariableSource, name: string, path?: string[]): Record<string, unknown> {
  return {
    transformerType: source === "context" ? "getFromContext" : "getFromParameters",
    interpolation: "runtime",
    ...(path && path.length > 1 ? { referencePath: path } : { referenceName: name }),
  };
}

function namesOf(environment: TransformerEnvironment, source: VariableSource): string[] {
  return source === "context" ? environment.contextNames : environment.parameterNames;
}

/** The path a variable block reads, as the runtime reads it: a non-empty `referenceName` first. */
export function referencePathOf(node: unknown): string[] {
  if (!isRecord(node)) {
    return [];
  }
  if (typeof node.referenceName === "string" && node.referenceName.length > 0) {
    return [node.referenceName];
  }
  return Array.isArray(node.referencePath) ? node.referencePath.map(String) : [];
}

/** A variable block reading `referencePath`: one segment is a `referenceName`, more a `referencePath`. */
export function withReferencePath(node: Record<string, unknown>, referencePath: string[]): Record<string, unknown> {
  const { referenceName: _name, referencePath: _path, ...rest } = node;
  return referencePath.length === 1 ? { ...rest, referenceName: referencePath[0] } : { ...rest, referencePath };
}

/**
 * The editing context of a block view whose value is written by `commit`, with the tray `tray`
 * changed by `changeTray`. The editor's run input, when it runs blocks, gives the names and the
 * input type of the root. #502: the parameters of a define block are context names of its body.
 */
export function useBlockEditingValue(
  root: unknown,
  commit: ((newRoot: unknown) => void) | undefined,
  undoable: boolean,
  tray?: unknown[],
  changeTray?: (update: TrayUpdate) => void,
  runInput?: BlockRunInput,
  defineParameters?: string[],
  withTestAssertion?: boolean,
  runnerName?: string,
): BlockEditing | undefined {
  // #505: a Runner gives its form values to its sequence as the parameter named after it
  const rootEnvironment = useMemo(
    (): TransformerEnvironment => ({
      contextNames: [...new Set([...Object.keys(runInput?.contextResults ?? {}), ...(defineParameters ?? [])])],
      parameterNames: [...new Set([...Object.keys(runInput?.transformerParams ?? {}), ...(runnerName ? [runnerName] : [])])],
    }),
    [runInput, defineParameters, runnerName],
  );
  // #502: the edited application's environment, whose registry has its composite TransformerDefinitions
  const { modelEnvironment, transformerDefinitions } = useBlockModelEnvironment();
  const defaultNode = useCallback(
    (transformerType: string) => defaultNodeForType(transformerType, modelEnvironment, transformerDefinitions),
    [modelEnvironment, transformerDefinitions],
  );
  const candidateTypes = useMemo(() => [...transformerUnionTypes(modelEnvironment)].sort(), [modelEnvironment]);
  const actionRoot = useMemo(() => isBlockAction(root, modelEnvironment), [root, modelEnvironment]);
  const actionDefaults = useContext(BlockActionDefaultsContext);
  const actionGroups = useMemo(
    () => (actionRoot ? actionPaletteGroups(modelEnvironment, { withTestAssertion }) : []),
    [actionRoot, modelEnvironment, withTestAssertion],
  );
  const editOptions = useMemo(
    () => ({ modelEnvironment, transformerDefinitions, slotDefault: defaultNode("returnValue") }),
    [modelEnvironment, transformerDefinitions, defaultNode],
  );
  const [armed, arm] = useState<ArmedBlock | undefined>(undefined);
  const [shownResult, setShownResult] = useState<string | undefined>(undefined);
  const toggleResult = useCallback(
    (path: BlockPath) => setShownResult((current) => (current === pathKey(path) ? undefined : pathKey(path))),
    [],
  );
  const insertPositions = useMemo(() => {
    const byContainer = new Map<string, BlockInsertPosition[]>();
    if (commit) {
      for (const position of blockInsertPositions(root, { modelEnvironment, transformerDefinitions })) {
        const key = pathKey(position.container);
        byContainer.set(key, [...(byContainer.get(key) ?? []), position]);
      }
    }
    return byContainer;
  }, [root, commit, modelEnvironment, transformerDefinitions]);
  const environmentAt = useCallback(
    (path: BlockPath) => blockEnvironmentAt(root, path, rootEnvironment, modelEnvironment),
    [root, rootEnvironment, modelEnvironment],
  );
  // every name visible at a block or an insert position, for the palette's variables
  const variables = useMemo((): TransformerEnvironment => {
    const environments = [
      ...(actionRoot ? [] : collectTransformerEnvironmentBindings(root as CoreTransformerForBuildPlusRuntime, rootEnvironment)),
      ...[...insertPositions.values()].flat().map((position) => environmentAt(position.path)),
    ];
    const union = (pick: (environment: TransformerEnvironment) => string[]) =>
      [...new Set([...pick(rootEnvironment), ...environments.flatMap(pick)])].sort();
    return { contextNames: union((environment) => environment.contextNames), parameterNames: union((environment) => environment.parameterNames) };
  }, [root, actionRoot, insertPositions, rootEnvironment, environmentAt]);
  const accepts = useCallback(
    (source: ArmedBlock, path: BlockPath) => {
      // a step holds an action, every other position a transformer or a value
      const action = source.kind === "action" || (source.kind === "tray" && isActionValue(tray?.[source.index]));
      if (action !== isStepPosition(root, path)) {
        return false;
      }
      return source.kind !== "variable" || namesOf(environmentAt(path), source.source).includes(source.name);
    },
    [root, tray, environmentAt],
  );
  const replaceable = useCallback(
    (path: BlockPath) => isValuePosition(root, path, { modelEnvironment, transformerDefinitions }),
    [root, modelEnvironment, transformerDefinitions],
  );
  // the ML schemas of the context names each block sees, by `pathKey`
  const contextSchemas = useMemo(() => {
    if (!commit || actionRoot) {
      return new Map<string, Record<string, MlElement>>();
    }
    const walk = checkTransformerInterfaceRecursively(root, runInput?.rootInputType ?? "any", {
      entityMlSchemas: runInput?.entityMlSchemas,
      withContext: true,
      transformerDefinitions,
    });
    return new Map(walk.nodes.map((node) => [pathKey(node.path), node.context ?? {}]));
  }, [root, commit, actionRoot, runInput, transformerDefinitions]);
  const attributesAt = useCallback(
    (path: BlockPath, referencePath: string[]) => {
      const context = contextSchemas.get(pathKey(path));
      return context ? referencePathAttributeNames(context, referencePath) : undefined;
    },
    [contextSchemas],
  );
  const newNodeOf = useCallback(
    (source: ArmedBlock): Record<string, unknown> | undefined => {
      if (source.kind === "type") {
        return defaultNode(source.transformerType);
      }
      if (source.kind === "action") {
        try {
          return defaultActionNode(source.actionType, modelEnvironment, actionLabels(root), actionDefaults);
        } catch {
          return undefined;
        }
      }
      if (source.kind === "variable") {
        return variableNode(source.source, source.name, source.path);
      }
      const trayBlock = tray?.[source.index];
      return isRecord(trayBlock) ? trayBlock : undefined;
    },
    [root, tray, defaultNode, modelEnvironment, actionDefaults],
  );
  // every block menu asks for the armed block's node: it is computed once per arming and value
  const armedNode = useMemo(() => (armed ? newNodeOf(armed) : undefined), [armed, newNodeOf]);
  const nodeOf = useCallback(
    (source: ArmedBlock) => (source === armed ? armedNode : newNodeOf(source)),
    [armed, armedNode, newNodeOf],
  );
  // a put block leaves the tray; the indexes of the others shift, so nothing stays armed
  const consume = useCallback(
    (source: ArmedBlock) => {
      if (source.kind === "tray") {
        changeTray?.((current) => current.filter((_, index) => index !== source.index));
      }
      arm(undefined);
    },
    [changeTray],
  );
  const insertAt = useCallback(
    (source: ArmedBlock, path: BlockPath) => {
      const node = nodeOf(source);
      if (!commit || !node || !accepts(source, path)) {
        return;
      }
      commit(insertBlockNode(root, path, node, editOptions));
      consume(source);
    },
    [root, commit, nodeOf, accepts, consume, editOptions],
  );
  const replaceAt = useCallback(
    (source: ArmedBlock, path: BlockPath): TransformerTypeChange | undefined => {
      const node = nodeOf(source);
      if (!commit || !node || !accepts(source, path)) {
        return undefined;
      }
      consume(source);
      const oldNode = valueAtPath(root, path);
      // a literal, an object or a list below a payload has no attributes to keep (#505)
      if (source.kind !== "type" || !isRecord(oldNode) || typeof oldNode.transformerType !== "string") {
        commit(withValueAtPath(root, path, node));
        return undefined;
      }
      const change = keepAttributesOnTypeChange(
        oldNode,
        node,
        modelEnvironment,
        transformerDefinitions,
      );
      if (undoable || change.dropped.length === 0) {
        commit(withValueAtPath(root, path, change.node));
        return undefined;
      }
      return change;
    },
    [root, commit, undoable, nodeOf, accepts, consume, modelEnvironment, transformerDefinitions],
  );
  const moveBlock = useCallback(
    (from: BlockPath, to: BlockPath) => {
      if (!commit) {
        return;
      }
      try {
        commit(moveBlockNode(root, from, to, editOptions));
      } catch {
        // an action dropped where a transformer goes, or the reverse, leaves the value as it is
      }
    },
    [root, commit, editOptions],
  );
  const renameKey = useCallback(
    (path: BlockPath, to: string): string | undefined => {
      try {
        commit?.(renameSequenceName(root, path, to));
        return undefined;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    },
    [root, commit],
  );
  const removeAt = useCallback(
    (path: BlockPath) => {
      const returnValue = defaultNode("returnValue");
      commit?.(removeBlockNode(root, path, { ...editOptions, rootDefault: returnValue }));
    },
    [root, commit, editOptions, defaultNode],
  );
  const moveToTray = useCallback(
    (path: BlockPath) => {
      if (!commit || !changeTray) {
        return;
      }
      const returnValue = defaultNode("returnValue");
      changeTray((current) => [...current, valueAtPath(root, path)]);
      commit(removeBlockNode(root, path, { ...editOptions, rootDefault: returnValue }));
    },
    [root, commit, changeTray, defaultNode, editOptions],
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
            actionGroups,
            defaultNodeForType: defaultNode,
            transformerDefinitions,
            armed,
            arm,
            nodeOf,
            rootEnvironment,
            variables,
            accepts,
            replaceable,
            removeAt,
            renameKey,
            attributesAt,
            insertPositions,
            insertAt,
            replaceAt,
            moveBlock,
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
      actionGroups,
      defaultNode,
      transformerDefinitions,
      armed,
      nodeOf,
      rootEnvironment,
      variables,
      accepts,
      replaceable,
      removeAt,
      renameKey,
      attributesAt,
      insertPositions,
      insertAt,
      replaceAt,
      moveBlock,
      tray,
      changeTray,
      moveToTray,
      discardTrayBlock,
      shownResult,
      toggleResult,
    ],
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
  const remove = useCallback(() => editing?.removeAt(props.path), [editing, props.path]);
  // a palette type that would drop attributes of the block, without an undo history, asks first
  const [pendingChange, setPendingChange] = useState<TransformerTypeChange | undefined>(undefined);
  const extraEntries = useMemo((): TransformerNodeExtraEntry[] => {
    if (!editing) {
      return [];
    }
    const entries: TransformerNodeExtraEntry[] = [];
    const armed = editing.armed;
    if (armed && editing.nodeOf(armed) && editing.accepts(armed, props.path)) {
      entries.push({
        testId: "block-action-replace",
        label: `Replace with ${armedLabel(armed)}`,
        onClick: () => setPendingChange(editing.replaceAt(armed, props.path)),
      });
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
    // a list item moves up or down its list: the menu equivalent of reordering by drag and drop
    const list = valueAtPath(editing.root, props.path.slice(0, -1));
    const index = props.path[props.path.length - 1];
    if (Array.isArray(list) && typeof index === "number") {
      const reorder = (toIndex: number) => editing.commit(reorderTransformerNode(editing.root, props.path, toIndex));
      if (index > 0) {
        entries.push({ testId: "block-action-move-up", label: "Move up", onClick: () => reorder(index - 1) });
      }
      if (index < list.length - 1) {
        entries.push({ testId: "block-action-move-down", label: "Move down", onClick: () => reorder(index + 1) });
      }
    }
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
        transformerDefinitions={editing.transformerDefinitions}
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

/**
 * #505: the menu of an action block: Replace with the armed action, Move up, Move down, Move to
 * tray, Remove. The root of the value has none.
 */
export function BlockActionNodeActions(props: { path: BlockPath; blockId: string }) {
  const editing = useBlockEditing();
  const { currentTheme } = useMiroirTheme();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const entries = useMemo((): TransformerNodeExtraEntry[] => {
    if (!editing) {
      return [];
    }
    const result: TransformerNodeExtraEntry[] = [];
    const armed = editing.armed;
    if (armed && editing.nodeOf(armed) && editing.accepts(armed, props.path)) {
      result.push({
        testId: "block-action-replace",
        label: `Replace with ${armedLabel(armed)}`,
        onClick: () => editing.replaceAt(armed, props.path),
      });
    }
    const list = valueAtPath(editing.root, props.path.slice(0, -1));
    const index = props.path[props.path.length - 1];
    if (Array.isArray(list) && typeof index === "number") {
      const reorder = (toIndex: number) => editing.commit(reorderTransformerNode(editing.root, props.path, toIndex));
      if (index > 0) {
        result.push({ testId: "block-action-move-up", label: "Move up", onClick: () => reorder(index - 1) });
      }
      if (index < list.length - 1) {
        result.push({ testId: "block-action-move-down", label: "Move down", onClick: () => reorder(index + 1) });
      }
    }
    if (editing.tray) {
      result.push({ testId: "block-action-tray", label: "Move to tray", onClick: () => editing.moveToTray(props.path) });
    }
    result.push({ testId: "block-action-remove", label: "Remove", onClick: () => editing.removeAt(props.path) });
    return result;
  }, [editing, props.path]);
  if (!editing || props.path.length === 0) {
    return null;
  }
  return (
    <span onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        data-testid={`block-actions:${props.blockId}`}
        aria-label={`Action block actions ${props.blockId}`}
        title="Action block actions"
        onClick={(event) => {
          event.currentTarget.focus();
          setMenuAnchor(event.currentTarget);
        }}
        style={{
          border: "1px solid rgba(255,255,255,.6)",
          borderRadius: currentTheme.borderRadius.sm,
          background: "transparent",
          color: "inherit",
          cursor: "pointer",
          padding: "0 6px",
          lineHeight: 1.4,
        }}
      >
        ⋯
      </button>
      <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
        {entries.map((entry) => (
          <ThemedMenuItem
            key={entry.testId}
            data-testid={entry.testId}
            onClick={() => {
              setMenuAnchor(null);
              entry.onClick();
            }}
          >
            {entry.label}
          </ThemedMenuItem>
        ))}
      </Menu>
    </span>
  );
}
