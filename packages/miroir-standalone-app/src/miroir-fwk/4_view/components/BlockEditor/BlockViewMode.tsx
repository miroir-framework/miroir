import type { KeyMapEntry, MlReference } from "miroir-core";
import React, { createContext, useCallback, useMemo, useState } from "react";

// ################################################################################################
// #498 (analysis #497, D6): which view, Blocks, Form or JSON, shows a transformer field of the
// value editor. The choice is kept by full Formik path in the provider, not in the field's own
// state, so it survives folding (a folded object unmounts its children) and reordering.
// The value editor offers the switch only under a provider: in #498 the TransformerEditor's.
// ################################################################################################

export type BlockViewMode = "blocks" | "form" | "json";

export interface BlockViewModes {
  modeOf: (formikPath: string) => BlockViewMode;
  setMode: (formikPath: string, mode: BlockViewMode) => void;
}

export const BlockViewModeContext = createContext<BlockViewModes | undefined>(undefined);

export function BlockViewModeProvider(props: { children: React.ReactNode }) {
  const [modes, setModes] = useState<Record<string, BlockViewMode>>({});
  const modeOf = useCallback((formikPath: string) => modes[formikPath] ?? "form", [modes]);
  const setMode = useCallback(
    (formikPath: string, mode: BlockViewMode) => setModes((current) => ({ ...current, [formikPath]: mode })),
    [],
  );
  const value = useMemo(() => ({ modeOf, setMode }), [modeOf, setMode]);
  return <BlockViewModeContext.Provider value={value}>{props.children}</BlockViewModeContext.Provider>;
}

/** Schemas whose values the block view shows: transformers and composite action sequences. */
const BLOCK_VIEW_SCHEMAS = new Set([
  "coreTransformerForBuildPlusRuntime",
  "coreTransformerForBuildPlusRuntimeWithoutArray",
  "compositeActionSequence",
  "compositeActionSequenceTemplate",
  "compositeActionTemplate",
]);

/**
 * Whether a field of the value editor gets the view switch: its declared schema is a reference to
 * a transformer or a composite action sequence, and no enclosing field is one (nested transformers
 * carry a `ref:` segment of such a schema in their type path).
 */
export function isBlockViewRoot(keyMapEntry: KeyMapEntry | undefined): boolean {
  if (keyMapEntry?.rawSchema?.type !== "schemaReference") {
    return false;
  }
  const relativePath = (keyMapEntry.rawSchema as MlReference).definition?.relativePath;
  if (!relativePath || !BLOCK_VIEW_SCHEMAS.has(relativePath)) {
    return false;
  }
  return !keyMapEntry.typePath.some(
    (segment) => typeof segment === "string" && segment.startsWith("ref:") && BLOCK_VIEW_SCHEMAS.has(segment.slice(4)),
  );
}
