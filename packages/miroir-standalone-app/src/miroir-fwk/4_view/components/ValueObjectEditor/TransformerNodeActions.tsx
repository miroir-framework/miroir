import { Menu } from "@mui/material";
import React, { useMemo, useState } from "react";

import {
  elementParameterReadsOfDefaultInput,
  pipeCandidates,
  pipeTransformerNode,
  transformerChildren,
  transformerSlots,
  unwrapTransformerNode,
  wrapCandidates,
  wrapTransformerNode,
  type InputOutputType,
  type TransformerDefinitionRegistry,
} from "miroir-core";

import {
  ThemedDialog,
  ThemedDialogActions,
  ThemedDialogContent,
  ThemedDialogTitle,
  ThemedLabeledEditor,
  ThemedMenuItem,
  ThemedSelectWithPortal,
  ThemedStyledButton,
} from "../Themes/index";
import { useMiroirTheme } from "../../contexts/MiroirThemeContext";

// ################################################################################################
// Issue #415 — the action menu of a transformer node, next to its `transformerType` select:
// structural edits computed by the miroir-core TransformerTreeEdit functions, written back as one
// new value of the node.
// #499: under an undo history, Remove and Unwrap act at once (Undo brings the node back); Unwrap
// of a node with several children lists one menu entry per child.
// #500: the block view adds its own entries before these (Replace with the armed palette type).
// ################################################################################################

export interface TransformerNodeActionsProps {
  /** Path of the node in the edited section, in `data-node-path` and the button's label. */
  nodePath: (string | number)[];
  nodeValue: unknown;
  /** The transformer types the node's position accepts (its union's discriminator values). */
  candidateTypes: string[];
  /** Input of the node's position when the restriction is on (#383); undefined: no filter. */
  givenInput?: InputOutputType;
  /** Output of the node when the restriction is on (#383); undefined: no filter. */
  output?: InputOutputType;
  /** The default value of a transformer type at the node's position. */
  defaultNodeForType: (transformerType: string) => Record<string, unknown> | undefined;
  /** Writes the new value of the node. */
  onReplaceNode: (newNode: unknown) => void;
  /** Removes the node and its subtree from the edited tree (#415 Remove). */
  onRemoveNode: () => void;
  /** An undo history covers the node (#499): edits act at once, without a confirmation. */
  undoable?: boolean;
  /** Menu entries before the #415 ones: the block view's Replace with (#500). */
  extraEntries?: TransformerNodeExtraEntry[];
  /** The TransformerDefinitions of the edited application (#502); the stock ones when absent. */
  transformerDefinitions?: TransformerDefinitionRegistry;
}

export interface TransformerNodeExtraEntry {
  testId: string;
  label: string;
  onClick: () => void;
}

type NewNodeAction = "wrap" | "pipe";
type OpenDialog = { kind: NewNodeAction } | { kind: "unwrap" } | { kind: "remove" } | undefined;

/** Wrap in and Pipe into share the dialog: a new transformer takes the node's place. */
const newNodeDialogText: Record<NewNodeAction, { title: string; ariaLabel: string; confirm: string }> = {
  wrap: {
    title: "Wrap in a new transformer",
    ariaLabel: "Wrap the transformer in a new transformer",
    confirm: "Wrap",
  },
  pipe: {
    title: "Pipe into a new transformer",
    ariaLabel: "Put the transformer in the applyTo of a new transformer",
    confirm: "Pipe",
  },
};

export const TransformerNodeActions: React.FC<TransformerNodeActionsProps> = ({
  nodePath,
  nodeValue,
  candidateTypes,
  givenInput,
  output,
  defaultNodeForType,
  onReplaceNode,
  onRemoveNode,
  undoable = false,
  extraEntries = [],
  transformerDefinitions,
}) => {
  const { currentTheme } = useMiroirTheme();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [dialog, setDialog] = useState<OpenDialog>(undefined);
  const [chosenType, setChosenType] = useState<string | undefined>(undefined);
  const [chosenSlot, setChosenSlot] = useState<string | undefined>(undefined);
  const [chosenChild, setChosenChild] = useState<string | undefined>(undefined);
  const nodePathKey = nodePath.join(".");

  const wrapTypes = useMemo(
    () => [...wrapCandidates(givenInput ?? "any", { transformerTypes: candidateTypes, transformerDefinitions })].sort(),
    [candidateTypes, givenInput, transformerDefinitions],
  );
  const pipeTypes = useMemo(
    () => [...pipeCandidates(output ?? "any", { transformerTypes: candidateTypes, transformerDefinitions })].sort(),
    [candidateTypes, output, transformerDefinitions],
  );
  const dialogTypes = dialog?.kind === "pipe" ? pipeTypes : wrapTypes;
  // Pipe into always uses `applyTo`; Wrap in asks for the slot when there are several.
  const chosenTypeSlots = useMemo(
    () =>
      dialog?.kind === "wrap" && chosenType
        ? transformerSlots(chosenType, transformerDefinitions).filter((slot) => !slot.isApplyTo)
        : [],
    [dialog, chosenType, transformerDefinitions],
  );
  const slot = chosenTypeSlots.length === 1 ? chosenTypeSlots[0].name : chosenSlot;
  const canConfirm = !!chosenType && (dialog?.kind === "pipe" || !!slot);
  // Unwrap: a child takes the node's place; with several children, the dialog names the dropped ones.
  const children = useMemo(() => transformerChildren(nodeValue, transformerDefinitions), [nodeValue, transformerDefinitions]);
  const nodeType =
    typeof nodeValue === "object" && nodeValue !== null && "transformerType" in nodeValue
      ? String((nodeValue as { transformerType: unknown }).transformerType)
      : undefined;
  const childKey = (path: (string | number)[]) => path.join(".");
  // D15: after a wrap in a list transformer, getFromParameters still reads the whole input
  const elementParameterReads = useMemo(() => elementParameterReadsOfDefaultInput(nodeValue), [nodeValue]);
  const droppedChildren = children.filter((child) => childKey(child.path) !== chosenChild);

  const closeDialog = () => {
    setDialog(undefined);
    setChosenType(undefined);
    setChosenSlot(undefined);
    setChosenChild(undefined);
  };

  const openDialog = (next: OpenDialog) => {
    setMenuAnchor(null);
    setDialog(next);
  };

  const unwrap = (childPath: (string | number)[]) => {
    onReplaceNode(unwrapTransformerNode(nodeValue, childPath, transformerDefinitions));
    closeDialog();
  };

  const startUnwrap = () => {
    setMenuAnchor(null);
    if (children.length === 1) {
      unwrap(children[0].path);
      return;
    }
    setDialog({ kind: "unwrap" });
  };

  const removeNow = () => {
    setMenuAnchor(null);
    onRemoveNode();
  };

  const unwrapNow = (childPath: (string | number)[]) => {
    setMenuAnchor(null);
    unwrap(childPath);
  };

  const confirmRemove = () => {
    onRemoveNode();
    closeDialog();
  };

  const confirmUnwrap = () => {
    const child = children.find((candidate) => childKey(candidate.path) === chosenChild);
    if (child) {
      unwrap(child.path);
    }
  };

  const confirmNewNode = () => {
    if (!dialog || dialog.kind === "unwrap" || dialog.kind === "remove" || !chosenType || !canConfirm) {
      return;
    }
    const defaultNode = defaultNodeForType(chosenType);
    if (!defaultNode) {
      return;
    }
    const newNode = { ...defaultNode, transformerType: chosenType };
    // a new array item gets returnValue in its other required slots (whens[].then)
    let returnValueNode: Record<string, unknown> | undefined;
    try {
      returnValueNode = defaultNodeForType("returnValue");
    } catch {
      returnValueNode = undefined;
    }
    onReplaceNode(
      dialog.kind === "pipe"
        ? pipeTransformerNode(nodeValue, newNode, transformerDefinitions)
        : wrapTransformerNode(nodeValue, newNode, slot, {
            transformerDefinitions,
            slotDefault: returnValueNode ? { ...returnValueNode, transformerType: "returnValue" } : undefined,
          }),
    );
    closeDialog();
  };

  return (
    <>
      <button
        type="button"
        data-testid="transformer-node-actions"
        data-node-path={nodePathKey}
        aria-label={`Transformer node actions ${nodePathKey}`}
        title="Transformer node actions"
        onClick={(event) => {
          // #447: the button takes focus even where a click does not focus it (Safari, jsdom), so
          // that closing the menu or a dialog returns focus here, not to a select that reopens on focus
          event.currentTarget.focus();
          setMenuAnchor(event.currentTarget);
        }}
        style={{
          border: `1px solid ${currentTheme.colors.border}`,
          borderRadius: currentTheme.borderRadius.sm,
          background: "transparent",
          color: currentTheme.colors.text,
          cursor: "pointer",
          padding: "0 6px",
          lineHeight: 1.4,
        }}
      >
        ⋯
      </button>
      {elementParameterReads.length > 0 && (
        <span
          data-testid="transformer-wrap-parameter-hint"
          data-node-path={nodePathKey}
          style={{ fontSize: "0.85em", opacity: 0.8 }}
        >
          getFromParameters at {elementParameterReads.map(childKey).join(", ")}{" "}
          {elementParameterReads.length > 1 ? "read" : "reads"} the whole input, not each element: getFromContext
          reads the element.
        </span>
      )}
      <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
        {extraEntries.map((entry) => (
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
        <ThemedMenuItem
          data-testid="transformer-node-action-wrap"
          disabled={wrapTypes.length === 0}
          onClick={() => openDialog({ kind: "wrap" })}
        >
          Wrap in…
        </ThemedMenuItem>
        <ThemedMenuItem
          data-testid="transformer-node-action-pipe"
          disabled={pipeTypes.length === 0}
          onClick={() => openDialog({ kind: "pipe" })}
        >
          Pipe into…
        </ThemedMenuItem>
        {undoable && children.length > 1 ? (
          children.map((child) => (
            <ThemedMenuItem
              key={childKey(child.path)}
              data-testid={`transformer-node-action-unwrap:${childKey(child.path)}`}
              onClick={() => unwrapNow(child.path)}
            >
              Unwrap: keep {childKey(child.path)} ({child.transformerType})
            </ThemedMenuItem>
          ))
        ) : (
          <ThemedMenuItem
            data-testid="transformer-node-action-unwrap"
            disabled={children.length === 0}
            onClick={startUnwrap}
          >
            {children.length > 1 ? "Unwrap…" : "Unwrap"}
          </ThemedMenuItem>
        )}
        <ThemedMenuItem
          data-testid="transformer-node-action-remove"
          onClick={undoable ? removeNow : () => openDialog({ kind: "remove" })}
        >
          {undoable ? "Remove" : "Remove…"}
        </ThemedMenuItem>
      </Menu>
      {dialog?.kind === "remove" && (
        <ThemedDialog
          open={true}
          onClose={closeDialog}
          disableEnforceFocus
          data-testid="transformer-node-dialog"
          aria-label="Remove the transformer and its subtree"
        >
          <ThemedDialogTitle>Remove the transformer</ThemedDialogTitle>
          <ThemedDialogContent>
            <div data-testid="transformer-node-dialog-removed">
              Removes {nodeType ?? "the transformer"}
              {children.length > 0 ? " and every transformer below it" : ""}.
            </div>
          </ThemedDialogContent>
          <ThemedDialogActions>
            <ThemedStyledButton type="button" variant="outlined" onClick={closeDialog} data-testid="transformer-node-dialog-cancel">
              Cancel
            </ThemedStyledButton>
            <ThemedStyledButton
              type="button"
              variant="contained"
              onClick={confirmRemove}
              data-testid="transformer-node-dialog-confirm"
            >
              Remove
            </ThemedStyledButton>
          </ThemedDialogActions>
        </ThemedDialog>
      )}
      {dialog?.kind === "unwrap" && (
        <ThemedDialog
          open={true}
          onClose={closeDialog}
          disableEnforceFocus
          data-testid="transformer-node-dialog"
          aria-label="Replace the transformer by one of its children"
        >
          <ThemedDialogTitle>Unwrap: keep one child</ThemedDialogTitle>
          <ThemedDialogContent>
            <ThemedLabeledEditor
              labelElement={<span>Keep</span>}
              editor={
                <ThemedSelectWithPortal
                  name="transformer-node-dialog-child"
                  filterable={true}
                  options={children.map((child) => ({ value: childKey(child.path), label: childKey(child.path) }))}
                  value={chosenChild ?? ""}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setChosenChild(event.target.value)}
                  placeholder="Select a child..."
                  minWidth="200px"
                />
              }
            />
            {chosenChild && (
              <div data-testid="transformer-node-dialog-dropped" style={{ marginTop: "8px" }}>
                Also removes: {droppedChildren.map((child) => `${childKey(child.path)} (${child.transformerType})`).join(", ")}
              </div>
            )}
          </ThemedDialogContent>
          <ThemedDialogActions>
            <ThemedStyledButton type="button" variant="outlined" onClick={closeDialog} data-testid="transformer-node-dialog-cancel">
              Cancel
            </ThemedStyledButton>
            <ThemedStyledButton
              type="button"
              variant="contained"
              disabled={!chosenChild}
              onClick={confirmUnwrap}
              data-testid="transformer-node-dialog-confirm"
            >
              Unwrap
            </ThemedStyledButton>
          </ThemedDialogActions>
        </ThemedDialog>
      )}
      {dialog && dialog.kind !== "unwrap" && dialog.kind !== "remove" && (
        <ThemedDialog
          open={true}
          onClose={closeDialog}
          disableEnforceFocus
          data-testid="transformer-node-dialog"
          aria-label={newNodeDialogText[dialog.kind].ariaLabel}
        >
          <ThemedDialogTitle>{newNodeDialogText[dialog.kind].title}</ThemedDialogTitle>
          <ThemedDialogContent>
            <ThemedLabeledEditor
              labelElement={<span>Transformer</span>}
              editor={
                <ThemedSelectWithPortal
                  name="transformer-node-dialog-type"
                  filterable={true}
                  options={dialogTypes.map((type) => ({ value: type, label: type }))}
                  value={chosenType ?? ""}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                    setChosenType(event.target.value);
                    setChosenSlot(undefined);
                  }}
                  placeholder="Select a transformer..."
                  minWidth="200px"
                />
              }
            />
            {chosenTypeSlots.length > 1 && (
              <ThemedLabeledEditor
                labelElement={<span>Put the transformer in</span>}
                editor={
                  <ThemedSelectWithPortal
                    name="transformer-node-dialog-slot"
                    filterable={true}
                    options={chosenTypeSlots.map((candidate) => ({ value: candidate.name, label: candidate.name }))}
                    value={chosenSlot ?? ""}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setChosenSlot(event.target.value)}
                    placeholder="Select a slot..."
                    minWidth="200px"
                  />
                }
              />
            )}
          </ThemedDialogContent>
          <ThemedDialogActions>
            <ThemedStyledButton type="button" variant="outlined" onClick={closeDialog} data-testid="transformer-node-dialog-cancel">
              Cancel
            </ThemedStyledButton>
            <ThemedStyledButton
              type="button"
              variant="contained"
              disabled={!canConfirm}
              onClick={confirmNewNode}
              data-testid="transformer-node-dialog-confirm"
            >
              {newNodeDialogText[dialog.kind].confirm}
            </ThemedStyledButton>
          </ThemedDialogActions>
        </ThemedDialog>
      )}
    </>
  );
};

export interface TransformerTypeChangeDialogProps {
  transformerType: string;
  /** The attributes of the node the new type does not take (D4, D5). */
  dropped: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation of a `transformerType` change that drops attributes (#415 D4, D5). */
export const TransformerTypeChangeDialog: React.FC<TransformerTypeChangeDialogProps> = ({
  transformerType,
  dropped,
  onConfirm,
  onCancel,
}) => (
  // no focus restore: the transformerType select would reopen its list on getting the focus back
  <ThemedDialog
    open={true}
    onClose={onCancel}
    disableEnforceFocus
    disableRestoreFocus
    data-testid="transformer-node-dialog"
    aria-label="Change the transformer type"
  >
    <ThemedDialogTitle>Change to {transformerType}</ThemedDialogTitle>
    <ThemedDialogContent>
      <div data-testid="transformer-node-dialog-dropped">
        {transformerType} does not take: {dropped.join(", ")}.
      </div>
    </ThemedDialogContent>
    <ThemedDialogActions>
      <ThemedStyledButton type="button" variant="outlined" onClick={onCancel} data-testid="transformer-node-dialog-cancel">
        Cancel
      </ThemedStyledButton>
      <ThemedStyledButton type="button" variant="contained" onClick={onConfirm} data-testid="transformer-node-dialog-confirm">
        Change type
      </ThemedStyledButton>
    </ThemedDialogActions>
  </ThemedDialog>
);
