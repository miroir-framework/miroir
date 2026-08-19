import type { EntityInstance, CoreTransformerForBuildPlusRuntime, Uuid } from "miroir-core";
import { noValue, safeStringify } from "miroir-core";
import type { formikPath_EntityInstanceSelectorPanel, ToolsPageState } from "miroir-react";


export type TransformerEditorFormikValueType = {
  transformerEditor_transformer_selector: {
    mode?: "here" | "defined" | "none";
    transformer?: CoreTransformerForBuildPlusRuntime;
  };
  [formikPath_TransformerEditorInputModeSelector]: {
    mode: "instance" | "here" | "none";
    input?: any;
  };
  [formikPath_EntityInstanceSelectorPanel]: {
    // selectedApplicationUuid?: Uuid;
    application?: Uuid;
    // selectedEntityInstanceUuid?: Uuid;
    // showAllInstances: boolean;
  };
  // 
  transformerEditor_input: any;
  selectedEntityInstance: EntityInstance | undefined;
  entityInstances: EntityInstance[];
  deploymentUuid: Uuid;
  // 
  transformerEditor_editor: {
    currentTransformerDefinition: CoreTransformerForBuildPlusRuntime;
  };
}

export interface TransformerEditorProps {
  application: Uuid;
  applicationDeploymentMap: Record<Uuid, Uuid>;
  deploymentUuid: Uuid;
  entityUuid: Uuid;
}

export const formikPath_TransformerEditorInputModeSelector = "transformerEditor_inputModeSelector";

/** Default in-editor transformer when none is persisted (Transformer Builder / editor). */
export const DEFAULT_TRANSFORMER_EDITOR_TRANSFORMER: CoreTransformerForBuildPlusRuntime = {
  transformerType: "returnValue",
  mlSchema: { type: "string" },
  value: "seize value...",
};

export type TransformerSelectorFormikValue =
  TransformerEditorFormikValueType["transformerEditor_transformer_selector"] & {
    application?: Uuid;
    transformerUuid?: Uuid;
  };

/** Restore transformer selector formik value from session-persisted tools page state. */
export function buildInitialTransformerSelectorFromPersistedState(
  persistedState: ToolsPageState["transformerEditor"] | undefined,
  pageApplication: Uuid,
  defaultTransformer: CoreTransformerForBuildPlusRuntime = DEFAULT_TRANSFORMER_EDITOR_TRANSFORMER,
): TransformerSelectorFormikValue {
  const transformer =
    persistedState?.currentTransformerDefinition ?? defaultTransformer;

  const persistedSelector = persistedState?.selector;
  if (persistedSelector?.mode && persistedSelector.mode !== "none") {
    if (persistedSelector.mode === "defined") {
      const application =
        persistedSelector.application && persistedSelector.application !== noValue.uuid
          ? persistedSelector.application
          : persistedState?.selectedApplicationUuid &&
              persistedState.selectedApplicationUuid !== noValue.uuid
            ? persistedState.selectedApplicationUuid
            : pageApplication;
      return {
        mode: "defined",
        application,
        transformerUuid: persistedSelector.transformerUuid ?? noValue.uuid,
        transformer:
          (persistedSelector as { transformer?: CoreTransformerForBuildPlusRuntime }).transformer ??
          persistedState?.currentDefinedTransformerDefinition ??
          transformer,
      };
    }
    return {
      mode: "here",
      transformer:
        (persistedSelector as { transformer?: CoreTransformerForBuildPlusRuntime }).transformer ??
        transformer,
    };
  }

  const legacyMode = persistedState?.mode;
  if (legacyMode === "defined") {
    const application =
      persistedState?.selectedApplicationUuid &&
      persistedState.selectedApplicationUuid !== noValue.uuid
        ? persistedState.selectedApplicationUuid
        : pageApplication;
    return {
      mode: "defined",
      application,
      transformerUuid: noValue.uuid,
      transformer: persistedState?.currentDefinedTransformerDefinition ?? transformer,
    };
  }
  if (legacyMode === "here") {
    return { mode: "here", transformer };
  }
  if (legacyMode === "none") {
    return { mode: "none" };
  }

  return { mode: "here", transformer: defaultTransformer };
}

export function buildInitialInputSelectorFromPersistedState(
  persistedState: ToolsPageState["transformerEditor"] | undefined,
): TransformerEditorFormikValueType[typeof formikPath_TransformerEditorInputModeSelector] {
  if (persistedState?.input_selector?.mode) {
    return {
      mode: persistedState.input_selector.mode,
      input: persistedState.input_selector.input,
    };
  }
  return {
    mode: "here",
    input: { placeholder: "put your input here..." },
  };
}

/** Build a partial transformerEditor slice for sessionStorage persistence. */
export function buildTransformerEditorPersistedUpdate(
  values: TransformerEditorFormikValueType,
): Partial<NonNullable<ToolsPageState["transformerEditor"]>> | null {
  const selectorValues = values.transformerEditor_transformer_selector;
  if (!selectorValues.mode || selectorValues.mode === "none") {
    return null;
  }

  const selectorValuesTyped = selectorValues as TransformerSelectorFormikValue;
  const selector: NonNullable<
    NonNullable<ToolsPageState["transformerEditor"]>["selector"]
  > =
    selectorValues.mode === "defined"
      ? {
          mode: "defined",
          application: (selectorValuesTyped.application ?? noValue.uuid) as Uuid,
          transformerUuid: (selectorValuesTyped.transformerUuid ?? noValue.uuid) as Uuid,
        }
      : {
          mode: "here",
          transformer: selectorValues.transformer ?? DEFAULT_TRANSFORMER_EDITOR_TRANSFORMER,
        };

  const inputSelector = values[formikPath_TransformerEditorInputModeSelector];
  return {
    currentTransformerDefinition: selectorValues.transformer,
    selector,
    input_selector: {
      mode: inputSelector.mode as "instance" | "here",
      input: inputSelector.input,
    },
    mode: selectorValues.mode,
    selectedApplicationUuid:
      selectorValues.mode === "defined"
        ? (selectorValues as TransformerSelectorFormikValue).application
        : undefined,
  };
}

/** True when a would-be persist payload matches what is already in session state. */
export function transformerEditorPersistedUpdateMatchesPersistedState(
  update: Partial<NonNullable<ToolsPageState["transformerEditor"]>>,
  persistedState: ToolsPageState["transformerEditor"] | undefined,
): boolean {
  if (!persistedState) {
    return false;
  }
  return (
    safeStringify(update.currentTransformerDefinition) ===
      safeStringify(persistedState.currentTransformerDefinition) &&
    safeStringify(update.selector) === safeStringify(persistedState.selector) &&
    safeStringify(update.input_selector) === safeStringify(persistedState.input_selector) &&
    update.mode === persistedState.mode &&
    safeStringify(update.selectedApplicationUuid) ===
      safeStringify(persistedState.selectedApplicationUuid)
  );
}
