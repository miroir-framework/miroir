import {
  defaultMiroirModelEnvironment,
  transformerDefinitionRegistry,
  type InputOutputType,
  type MiroirModelEnvironment,
  type MlElement,
  type TransformerDefinitionRegistry,
} from "miroir-core";
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

// ################################################################################################
// #498 (analysis #497, D6): which view, Blocks, Form or JSON, shows a transformer field of the
// value editor. The choice is kept by full Formik path in the provider, not in the field's own
// state, so it survives folding (a folded object unmounts its children) and reordering. So does
// the tray of a field's block view (#500), which a switch to Form or JSON unmounts.
// The value editor offers the switch only under a provider: every TypedValueObjectEditor root has
// one (#503), the TransformerEditor's included.
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
 * #505: the block view of a custom Runner's sequence has a "when run" hat: the Runner's name and
 * label, and its form fields, which the sequence reads as `[name, field]` with getFromParameters.
 * Without the field changes, the fields are shown, not edited (the instance editor edits them in
 * `formMLSchema`). Each change returns an error message when it is refused.
 */
export interface BlockRunner {
  /** The block view of this field shows the hat; the others under the provider do not. */
  rootLessListKey: string;
  name: string;
  label: string;
  fields: { name: string; type: string; read: boolean }[];
  addField?: (name: string, type: string) => string | undefined;
  renameField?: (from: string, to: string) => string | undefined;
  removeField?: (name: string) => string | undefined;
}

export const BlockRunnerContext = createContext<BlockRunner | undefined>(undefined);

/**
 * #503: the model environment of the application an instance editor edits, for its block views.
 * It gives no input, so a block shows no result of its subtree.
 */
export const BlockModelEnvironmentContext = createContext<MiroirModelEnvironment | undefined>(undefined);

/**
 * #502: the model environment of the block view, with its transformer registry: the edited
 * application's under the TransformerEditor or an instance editor (#503), Miroir's elsewhere.
 */
export function useBlockModelEnvironment(): {
  modelEnvironment: MiroirModelEnvironment;
  transformerDefinitions: TransformerDefinitionRegistry;
} {
  const runInputEnvironment = useContext(BlockRunInputContext)?.modelEnvironment;
  const editorEnvironment = useContext(BlockModelEnvironmentContext);
  const modelEnvironment = runInputEnvironment ?? editorEnvironment ?? defaultMiroirModelEnvironment;
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

/**
 * #503: the view modes of an editor root: its own, unless an enclosing editor (the
 * TransformerEditor) already keeps them, so that a field has one mode wherever it is rendered.
 */
export function BlockViewModeRoot(props: { children: React.ReactNode }) {
  const enclosing = useContext(BlockViewModeContext);
  return enclosing ? <>{props.children}</> : <BlockViewModeProvider>{props.children}</BlockViewModeProvider>;
}
