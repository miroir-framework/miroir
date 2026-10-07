/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { transformerPaletteGroups } from "miroir-core";
import React, { useMemo } from "react";

import { blockCategoryColor, type BlockEditorColors } from "../../contexts/MiroirThemeContext.js";
import { useBlockDraggable } from "./BlockDragDrop.js";
import { useBlockEditing, type VariableSource } from "./BlockEditing.js";
import { useBlockModelEnvironment } from "./BlockViewMode.js";

// ################################################################################################
// #500: the palette of the block view, beside the program. One entry per transformer type, grouped
// by classification and colored like its blocks; a click arms the type for the next insert target
// or Replace with, a second click disarms it. An entry can also be dragged to an insert target or
// onto a block.
// #501: below the types, the variables: the names visible somewhere in the value, in two groups,
// Context (getFromContext) and Parameters (getFromParameters). An armed variable is offered only
// where its name is visible.
// #505: when the value is an action sequence, the Endpoint actions come first, grouped by Endpoint;
// an armed action goes at a step of a sequence.
// ################################################################################################

export const BlockPalette = React.memo(function BlockPalette(props: {
  blockEditor: BlockEditorColors | undefined;
  text: string;
  textSecondary: string;
  border: string;
}) {
  const editing = useBlockEditing();
  const { modelEnvironment, transformerDefinitions } = useBlockModelEnvironment();
  const groups = useMemo(
    () => transformerPaletteGroups(modelEnvironment, transformerDefinitions),
    [modelEnvironment, transformerDefinitions],
  );
  if (!editing) {
    return null;
  }
  return (
    <nav
      data-testid="block-palette"
      aria-label="Block palette"
      css={css({
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        padding: "4px 8px 4px 0",
        borderRight: `1px solid ${props.border}`,
        maxHeight: "480px",
        overflowY: "auto",
        flexShrink: 0,
      })}
    >
      {editing.actionGroups.map((group) => (
        <div
          key={group.endpointUuid}
          role="group"
          aria-label={group.endpointName}
          data-testid={`block-palette-actions:${group.endpointName}`}
        >
          <div css={css({ fontSize: "11px", color: props.textSecondary, margin: "2px 0" })}>{group.endpointName}</div>
          <div css={css({ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px" })}>
            {group.actionTypes.map((actionType) => (
              <ActionEntry
                key={actionType}
                actionType={actionType}
                endpointName={group.endpointName}
                color={blockCategoryColor(props.blockEditor, group.endpointName)}
                text={props.text}
              />
            ))}
          </div>
        </div>
      ))}
      {groups.map((group) => {
        const color = blockCategoryColor(props.blockEditor, group.category);
        return (
          <div key={group.category} role="group" aria-label={group.category}>
            <div css={css({ fontSize: "11px", color: props.textSecondary, margin: "2px 0" })}>{group.category}</div>
            <div css={css({ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px" })}>
              {group.transformerTypes.map((transformerType) => (
                <PaletteEntry key={transformerType} transformerType={transformerType} color={color} text={props.text} />
              ))}
            </div>
          </div>
        );
      })}
      <VariableGroup source="context" names={editing.variables.contextNames} {...props} />
      <VariableGroup source="parameters" names={editing.variables.parameterNames} {...props} />
    </nav>
  );
});

const VARIABLE_GROUP_TITLES: Record<VariableSource, string> = { context: "Context", parameters: "Parameters" };

function VariableGroup(props: {
  source: VariableSource;
  names: string[];
  blockEditor: BlockEditorColors | undefined;
  text: string;
  textSecondary: string;
}) {
  if (props.names.length === 0) {
    return null;
  }
  const color = blockCategoryColor(props.blockEditor, "variable");
  const title = VARIABLE_GROUP_TITLES[props.source];
  return (
    <div role="group" aria-label={`${title} variables`} data-testid={`block-palette-variables:${props.source}`}>
      <div css={css({ fontSize: "11px", color: props.textSecondary, margin: "2px 0" })}>{`${title} variables`}</div>
      <div css={css({ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px" })}>
        {props.names.map((name) => (
          <VariableEntry key={name} source={props.source} name={name} color={color} text={props.text} />
        ))}
      </div>
    </div>
  );
}

function VariableEntry(props: { source: VariableSource; name: string; color: string; text: string }) {
  const editing = useBlockEditing();
  const { source, name } = props;
  const { setNodeRef, listeners } = useBlockDraggable(`drag:variable:${source}:${name}`, { kind: "variable", source, name });
  if (!editing) {
    return null;
  }
  const armed = editing.armed?.kind === "variable" && editing.armed.source === source && editing.armed.name === name;
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      type="button"
      data-testid={`block-palette-variable:${source}:${name}`}
      aria-pressed={armed}
      title={armed ? `${name}: click an insert target where it is visible` : `Choose the ${source === "context" ? "context name" : "parameter"} ${name}`}
      onClick={() => editing.arm(armed ? undefined : { kind: "variable", source, name })}
      css={css({
        font: "inherit",
        fontSize: "12px",
        fontWeight: 700,
        padding: "1px 10px",
        border: armed ? `2px solid ${props.text}` : "1.5px solid rgba(0,0,0,.22)",
        borderRadius: "12px",
        background: props.color,
        color: "#ffffff",
        cursor: "pointer",
        whiteSpace: "nowrap",
        touchAction: "none",
      })}
    >
      {name}
    </button>
  );
}

function PaletteEntry(props: { transformerType: string; color: string; text: string }) {
  const editing = useBlockEditing();
  const { transformerType } = props;
  const { setNodeRef, listeners } = useBlockDraggable(`drag:palette:${transformerType}`, {
    kind: "type",
    transformerType,
  });
  if (!editing) {
    return null;
  }
  const armed = editing.armed?.kind === "type" && editing.armed.transformerType === transformerType;
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      type="button"
      data-testid={`block-palette:${transformerType}`}
      aria-pressed={armed}
      title={armed ? `${transformerType}: click an insert target or Replace with` : `Choose ${transformerType}`}
      onClick={() => editing.arm(armed ? undefined : { kind: "type", transformerType })}
      css={css({
        font: "inherit",
        fontSize: "12px",
        fontWeight: 700,
        padding: "1px 8px",
        border: armed ? `2px solid ${props.text}` : "1.5px solid rgba(0,0,0,.22)",
        borderRadius: "6px",
        background: props.color,
        color: "#ffffff",
        cursor: "pointer",
        whiteSpace: "nowrap",
        touchAction: "none",
      })}
    >
      {transformerType}
    </button>
  );
}

function ActionEntry(props: { actionType: string; endpointName: string; color: string; text: string }) {
  const editing = useBlockEditing();
  const { actionType } = props;
  const { setNodeRef, listeners } = useBlockDraggable(`drag:action:${actionType}`, { kind: "action", actionType });
  if (!editing) {
    return null;
  }
  const armed = editing.armed?.kind === "action" && editing.armed.actionType === actionType;
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      type="button"
      data-testid={`block-palette-action:${actionType}`}
      data-endpoint={props.endpointName}
      aria-pressed={armed}
      title={armed ? `${actionType}: click a step target or Replace with` : `Choose the ${props.endpointName} action ${actionType}`}
      onClick={() => editing.arm(armed ? undefined : { kind: "action", actionType })}
      css={css({
        font: "inherit",
        fontSize: "12px",
        fontWeight: 700,
        padding: "1px 8px",
        border: armed ? `2px solid ${props.text}` : "1.5px solid rgba(0,0,0,.22)",
        borderRadius: "2px 2px 6px 6px",
        background: props.color,
        color: "#ffffff",
        cursor: "pointer",
        whiteSpace: "nowrap",
        touchAction: "none",
      })}
    >
      {actionType}
    </button>
  );
}
