import { Menu } from "@mui/material";
import React, { useMemo, useState } from "react";

import {
  transformerSlots,
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
  /** Path of the node in the edited section, used in the test ids. */
  nodePath: (string | number)[];
  nodeValue: unknown;
  /** The transformer types the node's position accepts (its union's discriminator values). */
  candidateTypes: string[];
  /** Input of the node's position when the restriction is on (#383); undefined: no filter. */
  givenInput?: InputOutputType;
  /** The default value of a transformer type at the node's position. */
  defaultNodeForType: (transformerType: string) => Record<string, unknown> | undefined;
  /** Writes the new value of the node. */
  onReplaceNode: (newNode: unknown) => void;
}

type OpenDialog = { kind: "wrap" } | undefined;

export const TransformerNodeActions: React.FC<TransformerNodeActionsProps> = ({
  nodePath,
  nodeValue,
  candidateTypes,
  givenInput,
  defaultNodeForType,
  onReplaceNode,
}) => {
  const { currentTheme } = useMiroirTheme();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [dialog, setDialog] = useState<OpenDialog>(undefined);
  const [chosenType, setChosenType] = useState<string | undefined>(undefined);
  const [chosenSlot, setChosenSlot] = useState<string | undefined>(undefined);
  const nodePathKey = nodePath.join(".");

  const wrapTypes = useMemo(
    () => [...wrapCandidates(givenInput ?? "any", { transformerTypes: candidateTypes })].sort(),
    [candidateTypes, givenInput],
  );
  const chosenTypeSlots = useMemo(
    () => (chosenType ? transformerSlots(chosenType).filter((slot) => !slot.isApplyTo) : []),
    [chosenType],
  );
  const slot = chosenTypeSlots.length === 1 ? chosenTypeSlots[0].name : chosenSlot;

  const closeDialog = () => {
    setDialog(undefined);
    setChosenType(undefined);
    setChosenSlot(undefined);
  };

  const openDialog = (next: OpenDialog) => {
    setMenuAnchor(null);
    setDialog(next);
  };

  const confirmWrap = () => {
    if (!chosenType || !slot) {
      return;
    }
    const enclosingNode = defaultNodeForType(chosenType);
    if (!enclosingNode) {
      return;
    }
    onReplaceNode(wrapTransformerNode(nodeValue, { ...enclosingNode, transformerType: chosenType }, slot));
    closeDialog();
  };

  return (
    <>
      <button
        type="button"
        data-testid="transformer-node-actions"
        data-node-path={nodePathKey}
        aria-label="Transformer node actions"
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
      </Menu>
      {dialog?.kind === "wrap" && (
        <ThemedDialog
          open={true}
          onClose={closeDialog}
          disableEnforceFocus
          data-testid="transformer-node-dialog"
          aria-label="Wrap the transformer in a new transformer"
        >
          <ThemedDialogTitle>Wrap in a new transformer</ThemedDialogTitle>
          <ThemedDialogContent>
            <ThemedLabeledEditor
              labelElement={<span>Transformer</span>}
              editor={
                <ThemedSelectWithPortal
                  name="transformer-node-dialog-type"
                  filterable={true}
                  options={wrapTypes.map((type) => ({ value: type, label: type }))}
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
              disabled={!chosenType || !slot}
              onClick={confirmWrap}
              data-testid="transformer-node-dialog-confirm"
            >
              Wrap
            </ThemedStyledButton>
          </ThemedDialogActions>
        </ThemedDialog>
      )}
    </>
  );
};
