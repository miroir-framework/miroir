/** @jsxImportSource @emotion/react */
import { css } from "@emotion/react";
import { transformerSubtreeRuns, type BlockPath, type TransformerSubtreeRun } from "miroir-core";
import React, { useContext, useMemo, useState } from "react";

import { useBlockEditing } from "./BlockEditing.js";
import { BlockRunInputContext } from "./BlockViewMode.js";

// ################################################################################################
// #500: the result bubble of a transformer block, as Scratch shows the value of a reporter block.
// The block's subtree runs on the editor's input, in the context its ancestors give it: once, or
// once per element under a list transformer, where a select shows one element's value alone.
// ################################################################################################

const MAX_TEXT = 2000;
const ALL = "";

function resultText(value: unknown): string {
  const text = JSON.stringify(value, null, 2) ?? String(value);
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT)}…` : text;
}

function isFailure(value: unknown): boolean {
  return typeof value === "object" && value !== null && "queryFailure" in value;
}

/** Whether the block view runs blocks: under the TransformerEditor, which gives the input. */
export function useBlockRunInput() {
  return useContext(BlockRunInputContext);
}

export function BlockResult(props: { path: BlockPath; id: string; colors: { text: string; field: string; border: string } }) {
  const editing = useBlockEditing();
  const input = useBlockRunInput();
  const [chosen, setChosen] = useState(ALL);
  const root = editing?.root;
  const outcome = useMemo((): { runs: TransformerSubtreeRun[] } | { error: string } | undefined => {
    if (!input) {
      return undefined;
    }
    try {
      return { runs: transformerSubtreeRuns(root, props.path, input.transformerParams, input.contextResults) };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }, [root, props.path, input]);
  if (!outcome) {
    return null;
  }
  const runs = "runs" in outcome ? outcome.runs : [];
  // A run chosen before the input or the transformer changed may be gone: all runs show then.
  const selected = runs.some((run) => run.label === chosen) ? chosen : ALL;
  const shown = selected === ALL ? runs : runs.filter((run) => run.label === selected);
  const labelled = runs.some((run) => run.label !== undefined);
  return (
    <div
      data-testid={`block-result:${props.id}`}
      data-run-count={runs.length}
      role="status"
      aria-label={`Result of ${props.id}`}
      onClick={(event) => event.stopPropagation()}
      css={css({
        margin: "0 10px 6px",
        padding: "4px 8px",
        borderRadius: "10px",
        background: props.colors.field,
        color: props.colors.text,
        border: `1px solid ${props.colors.border}`,
        fontSize: "12px",
        maxWidth: "60ch",
      })}
    >
      {"error" in outcome && <span>{outcome.error}</span>}
      {runs.length === 0 && !("error" in outcome) && <span>No run: the list it runs on is empty</span>}
      {labelled && (
        <select
          data-testid={`block-result-select:${props.id}`}
          aria-label="Shown runs"
          value={selected}
          onChange={(event) => setChosen(event.target.value)}
          css={css({ font: "inherit", fontSize: "12px", marginBottom: "4px" })}
        >
          <option value={ALL}>{`All ${runs.length} runs`}</option>
          {runs.map((run) => (
            <option key={run.label} value={run.label}>
              {run.label}
            </option>
          ))}
        </select>
      )}
      {shown.map((run, index) => (
        <div
          key={run.label ?? index}
          data-testid={`block-result-value:${props.id}${run.label === undefined ? "" : `:${run.label}`}`}
          data-value={JSON.stringify(run.value)}
          data-failed={isFailure(run.value)}
          css={css({ display: "flex", gap: "6px", alignItems: "flex-start" })}
        >
          {run.label !== undefined && <span css={css({ opacity: 0.75, whiteSpace: "nowrap" })}>{run.label}</span>}
          <pre
            css={css({
              margin: 0,
              fontFamily: "monospace",
              maxHeight: "12em",
              overflow: "auto",
              color: isFailure(run.value) ? "#c62828" : undefined,
            })}
          >
            {resultText(run.value)}
          </pre>
        </div>
      ))}
    </div>
  );
}
