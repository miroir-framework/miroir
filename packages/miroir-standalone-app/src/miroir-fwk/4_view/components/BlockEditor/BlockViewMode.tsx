import {
  defaultMiroirModelEnvironment,
  transformerDefinitionRegistry,
  type InputOutputType,
  type KeyMapEntry,
  type MiroirModelEnvironment,
  type MlElement,
  type MlReference,
  type TransformerDefinitionRegistry,
} from "miroir-core";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

// ################################################################################################
// #498 (analysis #497, D6): which view, Blocks, Form or JSON, shows a transformer field of the
// value editor. The choice is kept by full Formik path in the provider, not in the field's own
// state, so it survives folding (a folded object unmounts its children) and reordering. So does
// the tray of a field's block view (#500), which a switch to Form or JSON unmounts.
// The value editor offers the switch only under a provider: in #498 the TransformerEditor's.
// ################################################################################################

export type BlockViewMode = "blocks" | "form" | "json";

/**
 * #500: the input a transformer of the block view runs on, as the TransformerEditor runs it: a
 * block shows the result of its subtree only under this context.
 */
export interface BlockRunInput {
  transformerParams: Record<string, unknown>;
  contextResults: Record<string, unknown>;
  /** #501: the type of the input, for the schemas a variable path picker offers. */
  rootInputType?: InputOutputType;
  /** #501: the ML schemas of the application's Entities, by uuid, for the same. */
  entityMlSchemas?: Record<string, MlElement>;
  /**
   * #502: the model environment of the edited application: its schema has a branch per composite
   * TransformerDefinition, and its registry has their definitions.
   */
  modelEnvironment?: MiroirModelEnvironment;
}

export const BlockRunInputContext = createContext<BlockRunInput | undefined>(undefined);

/**
 * #502: the block view of the body of a composite TransformerDefinition is a "define" block: a
 * header with its name and parameters, which bind context names in the body. Each change returns
 * an error message when it is refused.
 */
export interface BlockDefine {
  /** The block view of this field shows the header; the others under the provider do not. */
  rootLessListKey: string;
  name: string;
  /** In order, with whether the body reads each one. */
  parameters: { name: string; read: boolean }[];
  addParameter: (name: string) => string | undefined;
  renameParameter: (from: string, to: string) => string | undefined;
  removeParameter: (name: string) => string | undefined;
}

export const BlockDefineContext = createContext<BlockDefine | undefined>(undefined);

/**
 * #502: the model environment of the block view, with its transformer registry: the edited
 * application's under the TransformerEditor, Miroir's elsewhere.
 */
export function useBlockModelEnvironment(): {
  modelEnvironment: MiroirModelEnvironment;
  transformerDefinitions: TransformerDefinitionRegistry;
} {
  const modelEnvironment = useContext(BlockRunInputContext)?.modelEnvironment ?? defaultMiroirModelEnvironment;
  return useMemo(
    () => ({ modelEnvironment, transformerDefinitions: transformerDefinitionRegistry(modelEnvironment) }),
    [modelEnvironment],
  );
}

export interface BlockViewModes {
  modeOf: (formikPath: string) => BlockViewMode;
  setMode: (formikPath: string, mode: BlockViewMode) => void;
  /** The tray of the field's block view (#500): blocks moved out of the value, not saved. */
  trayOf: (formikPath: string) => unknown[];
  setTray: (formikPath: string, update: (tray: unknown[]) => unknown[]) => void;
}

const EMPTY_TRAY: unknown[] = [];

export const BlockViewModeContext = createContext<BlockViewModes | undefined>(undefined);

export function BlockViewModeProvider(props: { children: React.ReactNode }) {
  const [modes, setModes] = useState<Record<string, BlockViewMode>>({});
  const modeOf = useCallback((formikPath: string) => modes[formikPath] ?? "form", [modes]);
  const setMode = useCallback(
    (formikPath: string, mode: BlockViewMode) => setModes((current) => ({ ...current, [formikPath]: mode })),
    [],
  );
  const [trays, setTrays] = useState<Record<string, unknown[]>>({});
  const trayOf = useCallback((formikPath: string) => trays[formikPath] ?? EMPTY_TRAY, [trays]);
  const setTray = useCallback(
    (formikPath: string, update: (tray: unknown[]) => unknown[]) =>
      setTrays((current) => ({ ...current, [formikPath]: update(current[formikPath] ?? EMPTY_TRAY) })),
    [],
  );
  const value = useMemo(() => ({ modeOf, setMode, trayOf, setTray }), [modeOf, setMode, trayOf, setTray]);
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
