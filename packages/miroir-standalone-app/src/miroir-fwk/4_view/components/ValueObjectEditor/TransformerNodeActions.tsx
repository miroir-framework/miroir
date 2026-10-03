import { Menu } from "@mui/material";
import React, { useMemo, useState } from "react";

import {
  pipeCandidates,
  pipeTransformerNode,
  transformerChildren,
  transformerSlots,
  unwrapTransformerNode,
  wrapCandidates,
  wrapTransformerNode,
  type InputOutputType,
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
}

type NewNodeAction = "wrap" | "pipe";
type OpenDialog = { kind: NewNodeAction } | { kind: "unwrap" } | undefined;

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
}) => {
  const { currentTheme } = useMiroirTheme();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [dialog, setDialog] = useState<OpenDialog>(undefined);
  const [chosenType, setChosenType] = useState<string | undefined>(undefined);
  const [chosenSlot, setChosenSlot] = useState<string | undefined>(undefined);
  const [chosenChild, setChosenChild] = useState<string | undefined>(undefined);
  const nodePathKey = nodePath.join(".");

  const wrapTypes = useMemo(
    () => [...wrapCandidates(givenInput ?? "any", { transformerTypes: candidateTypes })].sort(),
    [candidateTypes, givenInput],
  );
  const pipeTypes = useMemo(
    () => [...pipeCandidates(output ?? "any", { transformerTypes: candidateTypes })].sort(),
    [candidateTypes, output],
  );
  const dialogTypes = dialog?.kind === "pipe" ? pipeTypes : wrapTypes;
  // Pipe into always uses `applyTo`; Wrap in asks for the slot when there are several.
  const chosenTypeSlots = useMemo(
    () =>
      dialog?.kind === "wrap" && chosenType ? transformerSlots(chosenType).filter((slot) => !slot.isApplyTo) : [],
    [dialog, chosenType],
  );
  const slot = chosenTypeSlots.length === 1 ? chosenTypeSlots[0].name : chosenSlot;
  const canConfirm = !!chosenType && (dialog?.kind === "pipe" || !!slot);
  // Unwrap: a child takes the node's place; with several children, the dialog names the dropped ones.
  const children = useMemo(() => transformerChildren(nodeValue), [nodeValue]);
  const childKey = (path: (string | number)[]) => path.join(".");
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
    onReplaceNode(unwrapTransformerNode(nodeValue, childPath));
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

  const confirmUnwrap = () => {
    const child = children.find((candidate) => childKey(candidate.path) === chosenChild);
    if (child) {
      unwrap(child.path);
    }
  };

  const confirmNewNode = () => {
    if (!dialog || dialog.kind === "unwrap" || !chosenType || !canConfirm) {
      return;
    }
    const defaultNode = defaultNodeForType(chosenType);
    if (!defaultNode) {
      return;
    }
    const newNode = { ...defaultNode, transformerType: chosenType };
    onReplaceNode(
      dialog.kind === "pipe"
        ? pipeTransformerNode(nodeValue, newNode)
        : wrapTransformerNode(nodeValue, newNode, slot),
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
        onClick={(event) => setMenuAnchor(event.currentTarget)}
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
      <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
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
        <ThemedMenuItem
          data-testid="transformer-node-action-unwrap"
          disabled={children.length === 0}
          onClick={startUnwrap}
        >
          {children.length > 1 ? "Unwrap…" : "Unwrap"}
        </ThemedMenuItem>
      </Menu>
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
      {dialog && dialog.kind !== "unwrap" && (
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
