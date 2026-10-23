import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
  checkTransformerInterfaceRecursively,
  Domain2ElementFailed,
  formatInputOutputTypeLabel,
  inputOutputTypeOfValue,
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid,
  defaultAdminApplicationDeploymentMapNOTGOOD,
  defaultTransformerInput,
  getInnermostTransformerError,
  noValue,
  addTransformerParameter,
  removeTransformerParameter,
  renameTransformerParameter,
  safeStringify,
  transformerDefinitionParameterUses,
  transformerDefinitionRegistry,
  transformerNodeTypeStatus,
  transformer_extended_apply_wrapper,
  type InputOutputType,
  type MlElement,
  type TransformerInterfaceTreeCompatibility,
  type MlObject,
  type MlUnion,
  type MiroirModelEnvironment,
  valueToMl,
} from 'miroir-core';
import {
  adminSelfApplication,
  entityApplicationForAdmin
} from "miroir-app-admin";

import { Formik, useFormikContext, type FormikProps } from 'formik';
import {
  type CoreTransformerForBuildPlusRuntime,
  type TransformerDefinition
} from "miroir-core";
import { JsonDisplayHelper, useMiroirContextService } from 'miroir-react';
import { packageName } from '../../../../constants';
import { cleanLevel, lastSubmitButtonClicked } from '../../constants';
import {
  useTransformer
} from "../Reports/ReportHooks";
import { useCurrentModelEnvironment } from "../../ReduxHooks.js";
import { useReportPageContext } from '../Reports/ReportPageContext';
import { TypedValueObjectEditor } from '../Reports/TypedValueObjectEditor';
import {
  BlockDefineContext,
  BlockRunInputContext,
  BlockViewModeProvider,
  type BlockDefine,
  type BlockRunInput,
} from '../BlockEditor/BlockViewMode.js';
import { ValueHistory } from '../ValueObjectEditor/ValueHistory.js';
import { ValueHistoryProvider } from '../ValueObjectEditor/ValueHistoryProvider.js';
import { ValueHistoryFallbackButtons } from '../ValueObjectEditor/ValueHistoryButtons.js';
import type { TransformerTypeBadge, TransformerTypeBadgePart } from '../ValueObjectEditor/MlElementEditorInterface';
import {
  ThemedContainer,
  ThemedFoldableContainer,
  ThemedHeaderSection,
  ThemedLabel,
  ThemedLabeledEditor,
  ThemedSwitch,
  ThemedTitle
} from "../Themes/index";
import { EntityInstanceSelectorPanel } from './EntityInstanceSelectorPanel';
import { TransformationResultPanel } from './TransformationResultPanel';
import { TransformerDefinitionSave } from './TransformerDefinitionSave';
import {
  formikPath_TransformerEditorInputModeSelector,
  buildInitialTransformerSelectorFromPersistedState,
  buildInitialInputSelectorFromPersistedState,
  buildTransformerEditorPersistedUpdate,
  DEFAULT_TRANSFORMER_EDITOR_TRANSFORMER,
  transformerEditorPersistedUpdateMatchesPersistedState,
  type TransformerEditorFormikValueType,
  type TransformerEditorProps,
} from "./TransformerEditorInterface";
import { TransformerEventsPanel } from './TransformerEventsPanel';
import { useShowTransformerTypes } from './TransformerTypesDisplay';

import { entityDefinitionTransformerDefinition } from 'miroir-app-miroir';
// ################################################################################################
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "TransformerEditor");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

/** The edited transformer in the Formik values: the value the undo history watches (#499). */
const transformerFormikPath = "transformerEditor_transformer_selector.transformer";

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
/**
 * #383: root input type of the edited transformer, from the input it actually runs on (D7).
 * "here": the type of the value. "instance": the type of the `defaultInput` the instance selector
 * bound, an entity instance (its entity uuid) or an array of them (array of that entity). Both
 * modes type the value the same way (#453 D15).
 */
function transformerEditorRootInputType(
  inputSelector: { mode?: string; input?: unknown } | undefined,
  instanceInput: Record<string, unknown> | undefined,
): InputOutputType {
  if (inputSelector?.mode === "here") {
    return inputOutputTypeOfValue(inputSelector.input);
  }
  if (inputSelector?.mode !== "instance") {
    return "any";
  }
  return inputOutputTypeOfValue(instanceInput?.[defaultTransformerInput]);
}

type EditorEntity = { uuid: Uuid; name?: string; mlSchema?: unknown };

/** #470: a declared side matches the actual type when it is that type, or constrains nothing. */
function declaredSideMatches(declared: InputOutputType, actual: InputOutputType): boolean {
  return declared === "any" || declared === "undefined" || safeStringify(declared) === safeStringify(actual);
}

/** #470: a declaration whose sides are all `any` / `undefined` says nothing worth a "✓ declared". */
function declaresConstraint(declared: { input: InputOutputType; output: InputOutputType }): boolean {
  return [declared.input, declared.output].some((side) => side !== "any" && side !== "undefined");
}

/** #470: the badge parts a failure of the node involves, so that only they are marked. */
function mismatchedBadgeParts(
  node: TransformerInterfaceTreeCompatibility["nodes"][number],
  consumedKind: "in" | "applyTo",
): Set<TransformerTypeBadgePart["kind"]> {
  const kinds = new Set<TransformerTypeBadgePart["kind"]>();
  for (const failure of node.failures) {
    if (failure.direction === "input") {
      kinds.add(consumedKind).add("declared");
    } else if (failure.direction === "output") {
      kinds.add("out").add("declared");
    } else {
      kinds.add("value").add("out");
    }
  }
  return kinds;
}

/**
 * #453: one type badge per node of the walk and per literal `applyTo`, at its editor path. Labels
 * name known entities and shorten unknown entity uuids (D18); the title keeps the full types.
 * #470: each badge lists its chips; the declared types are left out when they are the actual ones.
 */
export function transformerTypeBadges(
  interfaceWalk: TransformerInterfaceTreeCompatibility,
  entities: EditorEntity[] | undefined,
): TransformerTypeBadge[] {
  const label = (type: InputOutputType) => formatInputOutputTypeLabel(type, entities, { shortenUnknownUuids: true });
  const nodeBadges = interfaceWalk.nodes.map((node): TransformerTypeBadge => {
    const consumedDiffers = safeStringify(node.consumedInput) !== safeStringify(node.givenInput);
    const failures = node.failures.map(
      (failure) =>
        `${failure.direction}: given ${formatInputOutputTypeLabel(failure.given)}, declared ${formatInputOutputTypeLabel(failure.declared)}`,
    );
    const declaredMatchesActual =
      node.declared === undefined ||
      (declaredSideMatches(node.declared.input, node.consumedInput) &&
        declaredSideMatches(node.declared.output, node.output));
    const mismatched = mismatchedBadgeParts(node, consumedDiffers ? "applyTo" : "in");
    const part = (
      kind: TransformerTypeBadgePart["kind"],
      partLabel: string,
      title: string,
    ): TransformerTypeBadgePart => ({ kind, label: partLabel, title, mismatch: mismatched.has(kind) });
    const declaredLabel = node.declared
      ? { input: label(node.declared.input), output: label(node.declared.output) }
      : undefined;
    return {
      path: ["transformer", ...node.path],
      givenLabel: label(node.givenInput),
      consumedLabel: consumedDiffers ? label(node.consumedInput) : undefined,
      declaredLabel,
      outputLabel: label(node.output),
      status: transformerNodeTypeStatus(node),
      title: [
        `${node.transformerType}`,
        `given ${formatInputOutputTypeLabel(node.givenInput)}`,
        ...(consumedDiffers ? [`applyTo ${formatInputOutputTypeLabel(node.consumedInput)}`] : []),
        ...(node.declared
          ? [`declared ${formatInputOutputTypeLabel(node.declared.input)} → ${formatInputOutputTypeLabel(node.declared.output)}`]
          : []),
        `output ${formatInputOutputTypeLabel(node.output)}`,
        ...failures,
      ].join("\n"),
      parts: [
        part("in", label(node.givenInput), formatInputOutputTypeLabel(node.givenInput)),
        ...(consumedDiffers
          ? [part("applyTo", label(node.consumedInput), formatInputOutputTypeLabel(node.consumedInput))]
          : []),
        ...(node.declared && declaredLabel && !declaredMatchesActual
          ? [
              part(
                "declared",
                `${declaredLabel.input} → ${declaredLabel.output}`,
                `${formatInputOutputTypeLabel(node.declared.input)} → ${formatInputOutputTypeLabel(node.declared.output)}`,
              ),
            ]
          : []),
        // a `returnValue` whose value does not fit its mlSchema: `out` is the mlSchema type, so the
        // value's own type gets a chip, the side to fix
        ...node.failures
          .filter((failure) => failure.direction === "value")
          .map((failure) => part("value", label(failure.given), formatInputOutputTypeLabel(failure.given))),
        part("out", label(node.output), formatInputOutputTypeLabel(node.output)),
      ],
      declaredMatchesActual: node.declared && declaresConstraint(node.declared) ? declaredMatchesActual : undefined,
    };
  });
  const literalBadges = interfaceWalk.literals.map(
    (literal): TransformerTypeBadge => ({
      path: ["transformer", ...literal.path],
      outputLabel: label(literal.type),
      status: "unknown",
      title: `value ${formatInputOutputTypeLabel(literal.type)}`,
      parts: [
        { kind: "value", label: label(literal.type), title: formatInputOutputTypeLabel(literal.type), mismatch: false },
      ],
    }),
  );
  return [...nodeBadges, ...literalBadges];
}

/** A refused change of a define header, without the name of the function that refused it. */
function refusal(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).replace(/^\w+: /, "");
}

/**
 * The transformer definition editor with its "Restrict transformers to the input type" switch.
 * Every transformerType select is restricted to the input of its position while the switch is
 * on; nested mismatches are always marked (#383 D4, D6). The "Show transformer types" switch
 * (#453) puts a type badge on the title row of every node and literal `applyTo`.
 * #502: a composite TransformerDefinition edited in "defined" mode is a define block, whose header
 * changes its parameters in a draft of the definition, kept until another one is edited; Save
 * writes the draft. The undo history covers the body only.
 */
const TransformerDefinitionEditor: React.FC<{
  formValueMLSchema: MlElement;
  application: Uuid;
  applicationDeploymentMap: Record<Uuid, Uuid>;
  deploymentUuid: Uuid;
  editedTransformer: unknown;
  rootInputType: InputOutputType;
  entities?: EditorEntity[];
  restrictTransformersToInputType: boolean;
  onRestrictTransformersToInputTypeChange: (checked: boolean) => void;
  /** Undo / redo of the edited transformer (#499). */
  transformerHistory: ValueHistory;
  /** The input the transformer runs on, as params and context: blocks run their subtree on it (#500). */
  transformerInput: Record<string, unknown>;
  /** The edited application's model environment: its composite TransformerDefinitions (#502). */
  modelEnvironment: MiroirModelEnvironment;
  /** The TransformerDefinition edited in "defined" mode (#502). */
  definedTransformer?: TransformerDefinition;
}> = ({
  formValueMLSchema,
  application,
  applicationDeploymentMap,
  deploymentUuid,
  editedTransformer,
  rootInputType,
  entities,
  restrictTransformersToInputType,
  onRestrictTransformersToInputTypeChange,
  transformerHistory,
  transformerInput,
  modelEnvironment,
  definedTransformer,
}) => {
  const { setFieldValue } = useFormikContext<TransformerEditorFormikValueType>();
  const entityMlSchemas = useMemo(
    () =>
      Object.fromEntries(
        (entities ?? [])
          .filter((entity) => entity.mlSchema)
          .map((entity) => [entity.uuid, entity.mlSchema as MlElement]),
      ),
    [entities],
  );
  const rootInputTypeKey = safeStringify(rootInputType);
  const runInput: BlockRunInput = useMemo(
    () => ({
      transformerParams: transformerInput,
      contextResults: transformerInput,
      rootInputType,
      entityMlSchemas,
      modelEnvironment,
    }),
    [transformerInput, rootInputTypeKey, entityMlSchemas, modelEnvironment],
  );
  const transformerDefinitions = useMemo(() => transformerDefinitionRegistry(modelEnvironment), [modelEnvironment]);
  const editedTransformerKey = safeStringify(editedTransformer);
  // #502: the define block of a composite edited in "defined" mode
  const [definitionDraft, setDefinitionDraft] = useState<TransformerDefinition | undefined>(undefined);
  const composite =
    definedTransformer?.transformerImplementation.transformerImplementationType === "transformer"
      ? definedTransformer
      : undefined;
  // The draft's parameters go with the body they were edited on, and coming back to a definition
  // fetches its body anew: choosing another definition drops the draft, during render (no effect).
  const [draftedUuid, setDraftedUuid] = useState(composite?.uuid);
  if (draftedUuid !== composite?.uuid) {
    setDraftedUuid(composite?.uuid);
    setDefinitionDraft(undefined);
  }
  const definition = composite && definitionDraft?.uuid === composite.uuid ? definitionDraft : composite;
  const definedWithBody: TransformerDefinition | undefined = useMemo(
    () =>
      definition
        ? {
            ...definition,
            transformerImplementation: {
              transformerImplementationType: "transformer",
              definition: editedTransformer as CoreTransformerForBuildPlusRuntime,
            },
          }
        : undefined,
    [definition, editedTransformerKey],
  );
  const define: BlockDefine | undefined = useMemo(() => {
    if (!definedWithBody) {
      return undefined;
    }
    const apply = (change: (current: TransformerDefinition) => TransformerDefinition): string | undefined => {
      try {
        const next = change(definedWithBody);
        setDefinitionDraft(next);
        if (next.transformerImplementation !== definedWithBody.transformerImplementation) {
          void setFieldValue(
            transformerFormikPath,
            (next.transformerImplementation as { definition: unknown }).definition,
            false,
          );
        }
        return undefined;
      } catch (error) {
        return refusal(error);
      }
    };
    return {
      rootLessListKey: "transformer",
      name: definedWithBody.name,
      parameters: transformerDefinitionParameterUses(definedWithBody),
      addParameter: (name) => apply((current) => addTransformerParameter(current, name)),
      renameParameter: (from, to) => apply((current) => renameTransformerParameter(current, from, to)),
      removeParameter: (name) => apply((current) => removeTransformerParameter(current, name)),
    };
  }, [definedWithBody, setFieldValue]);
  const interfaceWalk = useMemo(
    () => checkTransformerInterfaceRecursively(editedTransformer, rootInputType, { entityMlSchemas, transformerDefinitions }),
    [editedTransformerKey, rootInputTypeKey, entityMlSchemas, transformerDefinitions],
  );
  // Node paths are relative to the transformer, editor paths to its selector.
  const transformerTypeRestrictions = useMemo(
    () =>
      restrictTransformersToInputType
        ? interfaceWalk.nodes.map((node) => ({
            path: ["transformer", ...node.path],
            input: node.consumedInput,
            inputLabel: formatInputOutputTypeLabel(node.consumedInput),
            givenInput: node.givenInput,
            output: node.output,
          }))
        : undefined,
    [interfaceWalk, restrictTransformersToInputType],
  );
  const compatibilityWarnings = useMemo(
    () =>
      interfaceWalk.nodes
        .filter((node) => node.failures.length > 0)
        .map((node) => ({
          path: ["transformer", ...node.path],
          title: node.failures
            .map(
              (failure) =>
                `${node.path.join(".") || "root"} (${node.transformerType}) ${failure.direction}: given ${formatInputOutputTypeLabel(failure.given)}, declared ${formatInputOutputTypeLabel(failure.declared)}`,
            )
            .join("; "),
        })),
    [interfaceWalk],
  );
  const [showTransformerTypes, setShowTransformerTypes] = useShowTransformerTypes();
  const typeBadges = useMemo(
    () => (showTransformerTypes ? transformerTypeBadges(interfaceWalk, entities) : undefined),
    [showTransformerTypes, interfaceWalk, entities],
  );

  return (
    <>
      <ThemedLabeledEditor
        labelElement={<ThemedLabel>Restrict transformers to the input type</ThemedLabel>}
        editor={
          <ThemedSwitch
            id="transformer-editor-restrict-switch"
            name="transformer-editor-restrict-switch"
            inputProps={{
              "data-testid": "transformer-editor-restrict-switch",
            } as React.InputHTMLAttributes<HTMLInputElement>}
            checked={restrictTransformersToInputType}
            onChange={(event) => onRestrictTransformersToInputTypeChange(event.target.checked)}
            size="small"
          />
        }
      />
      <ThemedLabeledEditor
        labelElement={<ThemedLabel>Show transformer types</ThemedLabel>}
        editor={
          <ThemedSwitch
            id="transformer-editor-show-types-switch"
            name="transformer-editor-show-types-switch"
            inputProps={{
              "data-testid": "transformer-editor-show-types-switch",
            } as React.InputHTMLAttributes<HTMLInputElement>}
            checked={showTransformerTypes}
            onChange={(event) => setShowTransformerTypes(event.target.checked)}
            size="small"
          />
        }
      />
      <TransformerDefinitionSave
        application={application}
        applicationDeploymentMap={applicationDeploymentMap}
        modelEnvironment={modelEnvironment}
        transformerDefinitions={transformerDefinitions}
        body={editedTransformer}
        defined={definedWithBody}
      />
      <ValueHistoryProvider history={transformerHistory} formikPath={transformerFormikPath}>
        {/* #499: Undo stays reachable when an edit made the transformer fail its type check */}
        <ValueHistoryFallbackButtons rootLessListKey="transformer" />
        <BlockRunInputContext.Provider value={runInput}>
          <BlockDefineContext.Provider value={define}>
            <BlockViewModeProvider>
              <TypedValueObjectEditor
                labelElement={<>Transformer Definition</>}
                formValueMLSchema={formValueMLSchema}
                formikValuePathAsString="transformerEditor_transformer_selector"
                application={application}
                applicationDeploymentMap={applicationDeploymentMap}
                deploymentUuid={deploymentUuid}
                applicationSection={"model"}
                formLabel={"Transformer Definition Selector"}
                displaySubmitButton="noDisplay"
                valueObjectEditMode="create"
                maxRenderDepth={Infinity}
                compatibilityWarnings={compatibilityWarnings}
                transformerTypeRestrictions={transformerTypeRestrictions}
                transformerTypeBadges={typeBadges}
              />
            </BlockViewModeProvider>
          </BlockDefineContext.Provider>
        </BlockRunInputContext.Provider>
      </ValueHistoryProvider>
    </>
  );
};

// ################################################################################################
export const TransformerEditor: React.FC<TransformerEditorProps> = (props) => {
  const {
    deploymentUuid: initialDeploymentUuid,
    entityUuid: initialEntityUuid,
    application,
    applicationDeploymentMap,
  } = props;
  // const application: Uuid = initialApplication;
  const deploymentUuid: Uuid = initialDeploymentUuid;
  const context = useMiroirContextService();
  const reportContext = useReportPageContext();
  const miroirContextService = useMiroirContextService();

 
  // Ref for debouncing transformer definition updates when mode='here'
  const transformerUpdateTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const latestFormValuesRef = React.useRef<TransformerEditorFormikValueType | null>(null);
  // #499: Clear writes to the form through it
  const formikRef = React.useRef<FormikProps<TransformerEditorFormikValueType> | null>(null);

  // Get persisted state from context
  const persistedState = context.toolsPageState.transformerEditor;
  const currentHereTransformerDefinition: CoreTransformerForBuildPlusRuntime =
    persistedState?.currentTransformerDefinition ?? DEFAULT_TRANSFORMER_EDITOR_TRANSFORMER;
  // ##############################################################################################

  const showAllInstances = persistedState?.showAllInstances || false;
  const restrictTransformersToInputType = persistedState?.restrictTransformersToInputType ?? true;

  
  // ##############################################################################################
  // Copy-to-clipboard state for transformer definition
  const [copiedToClipboard, setCopiedToClipboard] = useState<boolean>(false);

  const copyTransformerDefinitionToClipboard = useCallback(async () => {
    try {
      // Try to stringify as nicely as possible; safeStringify accepts a large maxLength to avoid truncation
      const text = safeStringify(currentHereTransformerDefinition, 1000000);

      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(text);
      } else if (
        typeof (window as any) !== "undefined" &&
        typeof (window as any).require === "function"
      ) {
        // Electron fallback
        const { clipboard } = (window as any).require("electron");
        clipboard.writeText(text);
      } else {
        // Legacy fallback using execCommand
        const el = document.createElement("textarea");
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }

      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      log.error("Failed to copy transformer definition to clipboard", error);
    }
  }, [currentHereTransformerDefinition]);

  const clearTransformerDefinition = useCallback(() => {
    context.updateTransformerEditorState({
      currentTransformerDefinition: DEFAULT_TRANSFORMER_EDITOR_TRANSFORMER,
    });
    // #499: also in the form, where Undo can bring the edit back; a copy, so that the form never
    // holds the shared default object
    void formikRef.current?.setFieldValue(
      transformerFormikPath,
      structuredClone(DEFAULT_TRANSFORMER_EDITOR_TRANSFORMER),
    );
    // Clear previous transformation outputs
    // setTransformationResult(null);
    // setTransformationError(null);
  }, [context]);

  log.info("TransformerEditor currentTransformerDefinition:", currentHereTransformerDefinition);
  // log.info("TransformerEditor transformerDefinitionSchema:", transformerDefinitionSchema);
  // handle folding of TransfrormerEditor object attributes and array items
  useEffect(() => {
    if (persistedState && persistedState?.foldedObjectAttributeOrArrayItems) {
      reportContext.setFoldedObjectAttributeOrArrayItems(
        persistedState?.foldedObjectAttributeOrArrayItems
      );
    }
  }, [context, persistedState?.foldedObjectAttributeOrArrayItems]);

  // ################################################################################################
  // Handle transformer definition changes (form submission)
  // Note: For mode='here', updates are already handled by debounced useEffect
  // This mainly handles clearing activity tracker/events on submit
  const handleTransformerDefinitionSubmit = useCallback(
    async (formValuesAsParam: any) => {
      log.info(
        "handleTransformerDefinitionSubmit form values",
        formValuesAsParam,
        "button clicked:",
        formValuesAsParam[lastSubmitButtonClicked]
      );
      miroirContextService.miroirContext.miroirActivityTracker.resetResults();
      miroirContextService.miroirContext.miroirEventService.clear();

      // For mode='here', the transformer is already being updated via debounced useEffect
      // For mode='defined', the transformer is already updated when fetched
      // So this submit handler is mainly for clearing activity tracker/events
    },
    [miroirContextService, miroirContextService.miroirContext]
  );

  log.info(
    "Rendering TransformerEditor context.miroirContext.miroirEventService.events.size",
    context.miroirContext.miroirEventService.events.size
  );

  // ################################################################################################
  const initialFormValues = useMemo(() => {
    const transformerSelector = buildInitialTransformerSelectorFromPersistedState(
      persistedState,
      application,
      currentHereTransformerDefinition,
    );
    return {
      transformerEditor_transformer_selector: transformerSelector,
      transformerEditor_input: {},
      [formikPath_TransformerEditorInputModeSelector]:
        buildInitialInputSelectorFromPersistedState(persistedState),
      transformerEditor_editor: {
        currentTransformerDefinition:
          transformerSelector.transformer ?? currentHereTransformerDefinition,
      },
    };
  }, []); // Mount-only: read persistedState on first render; remount on navigation gets fresh state

  // #499: undo / redo of the edited transformer, starting from its initial value
  const [transformerHistory] = useState(
    () => new ValueHistory(initialFormValues.transformerEditor_transformer_selector.transformer),
  );

  useEffect(() => {
    return () => {
      if (transformerUpdateTimeoutRef.current) {
        clearTimeout(transformerUpdateTimeoutRef.current);
        transformerUpdateTimeoutRef.current = null;
      }
      const values = latestFormValuesRef.current;
      if (!values) {
        return;
      }
      const update = buildTransformerEditorPersistedUpdate(values);
      if (update && !transformerEditorPersistedUpdateMatchesPersistedState(update, persistedState)) {
        context.updateTransformerEditorState(update);
      }
    };
  }, [context]);

  return (
    <ThemedContainer>
      <ThemedHeaderSection
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <ThemedTitle>
          {/* Transformer Editor for Entity "{currentReportTargetEntity?.name || selectedEntityUuid}" of */}
          {/* deployment {deploymentUuid} */}
          Transformer Editor
        </ThemedTitle>
        {/* <ThemedOnScreenHelper label="currentTransformerDefinition" data={currentTransformerDefinition} /> */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {/* copyTransformerDefinitionToClipboard */}
          <button
            onClick={copyTransformerDefinitionToClipboard}
            title={copiedToClipboard ? "Copied" : "Copy transformer definition to clipboard"}
            style={{
              padding: "6px 10px",
              fontSize: "13px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: copiedToClipboard ? "#e6ffe6" : "#f8f8f8",
              cursor: "pointer",
            }}
          >
            {copiedToClipboard ? "Copied" : "Copy"}
          </button>
          {/* clearTransformerDefinition */}
          <button
            onClick={clearTransformerDefinition}
            title={"Reset transformer to default returnValue transformer"}
            style={{
              padding: "6px 10px",
              fontSize: "13px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              background: "#fff4e6",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>
      </ThemedHeaderSection>

      {/* 3-Pane Layout */}
      {/* <div style={{ display: "flex", gap: "20px" }}> */}
      {/* left Pane: Transformer Definition Editor */}
      <Formik
        innerRef={formikRef}
        enableReinitialize={true}
        initialValues={initialFormValues as any}
        onSubmit={async (values, { setSubmitting, setErrors }) => {
          try {
            log.info("onSubmit formik values", values);
            await handleTransformerDefinitionSubmit(values);
          } catch (e) {
            log.error(e);
          } finally {
            setSubmitting(false);
          }
        }}
        validateOnChange={false}
        validateOnBlur={false}
      >
        {
          /* Formik children as function to access formik context */ (
            formikContext: FormikProps<TransformerEditorFormikValueType>
          ) => {
            latestFormValuesRef.current = formikContext.values;
            const selectorValues = formikContext.values
              .transformerEditor_transformer_selector as {
              mode?: "here" | "defined" | "none";
              application?: Uuid;
              transformerUuid?: Uuid;
            };
            // Schema resolution and FK lookups need a concrete application even in "here" mode.
            const editorApplication: Uuid =
              selectorValues.mode === "defined" &&
              selectorValues.application &&
              selectorValues.application !== noValue.uuid
                ? selectorValues.application
                : application;
            const editorDeploymentUuid: Uuid =
              applicationDeploymentMap[editorApplication] ?? deploymentUuid;
            // #502: the preview and the block view run the editor application's composites
            const editorModelEnvironment = useCurrentModelEnvironment(editorApplication, applicationDeploymentMap);
            const editorModel = editorModelEnvironment.currentModel;
            const inputSelectorMode =
              formikContext.values[formikPath_TransformerEditorInputModeSelector].mode;
            const canRenderInputEditor =
              (inputSelectorMode === "here" || inputSelectorMode === "instance") &&
              editorModel?.entities?.length > 0;
            const transformerSelectorMode =
              formikContext.values.transformerEditor_transformer_selector.mode;
            const canRenderDefinitionEditor =
              (transformerSelectorMode === "here" ||
                transformerSelectorMode === "defined") &&
              editorModel?.entities?.length > 0;
            const transformerSelector_currentFetchedTransformerDefinition:
              | TransformerDefinition
              | Domain2ElementFailed
              | undefined = useTransformer(
                editorApplication,
                applicationDeploymentMap,
                editorDeploymentUuid,
                selectorValues.mode === "defined" ? selectorValues.transformerUuid : undefined
            );

            if (
              transformerSelector_currentFetchedTransformerDefinition instanceof
              Domain2ElementFailed
            ) {
              // should never happen
              throw new Error(
                "TransformerEditor: failed to get report data: " +
                  JSON.stringify(transformerSelector_currentFetchedTransformerDefinition, null, 2)
              );
            }

            // ##################################################################################
            // transformerEditor_transformer_selector persistedState -> formik
            useEffect(() => {
              // When mode is 'defined' and transformerUuid is changed, fetch transformer from stored definition and update formik context
              if (
                formikContext.values.transformerEditor_transformer_selector.mode === "defined" &&
                (formikContext.values.transformerEditor_transformer_selector as any).application &&
                (formikContext.values.transformerEditor_transformer_selector as any).transformerUuid &&
                (formikContext.values.transformerEditor_transformer_selector as any).transformerUuid !==
                  noValue.uuid &&
                (formikContext.values.transformerEditor_transformer_selector as any).transformerUuid !==
                  (persistedState?.selector as any)?.transformerUuid &&
                transformerSelector_currentFetchedTransformerDefinition &&
                typeof transformerSelector_currentFetchedTransformerDefinition == "object" &&
                transformerSelector_currentFetchedTransformerDefinition.transformerImplementation
                  ?.transformerImplementationType == "transformer"
              ) {
                log.info(
                  "TransformerEditor: updating context with stored transformer definition:",
                  transformerSelector_currentFetchedTransformerDefinition.transformerImplementation
                    ?.definition
                );
                // #499: a loaded transformer starts a new undo history
                transformerHistory.reset(
                  transformerSelector_currentFetchedTransformerDefinition.transformerImplementation?.definition,
                );
                formikContext.setFieldValue(
                  "transformerEditor_transformer_selector.transformer",
                  transformerSelector_currentFetchedTransformerDefinition.transformerImplementation
                    ?.definition
                );
              }
            }, [
              formikContext.values.transformerEditor_transformer_selector.mode,
              (formikContext.values.transformerEditor_transformer_selector as any).transformerUuid,
              persistedState?.selector,
              transformerSelector_currentFetchedTransformerDefinition,
            ]);

            // ##################################################################################
            // transformerEditor_transformer_selector, EntityInstanceSelectorPanel formik -> persistedState
            // Debounced update to context when mode='here' and transformer definition changes
            useEffect(() => {
              // Clear existing timeout
              if (transformerUpdateTimeoutRef.current) {
                clearTimeout(transformerUpdateTimeoutRef.current);
              }

              // Only update if mode is defined
              if (
                !formikContext.values.transformerEditor_transformer_selector.mode ||
                formikContext.values.transformerEditor_transformer_selector.mode === "none"
              ) {
                return;
              }

              const pendingUpdate = buildTransformerEditorPersistedUpdate(formikContext.values);
              if (
                !pendingUpdate ||
                transformerEditorPersistedUpdateMatchesPersistedState(
                  pendingUpdate,
                  persistedState,
                )
              ) {
                return;
              }

              // Debounce the update - only push to context after 2 seconds of no changes
              transformerUpdateTimeoutRef.current = setTimeout(() => {
                const values = latestFormValuesRef.current;
                if (!values) {
                  return;
                }
                const update = buildTransformerEditorPersistedUpdate(values);
                if (
                  update &&
                  !transformerEditorPersistedUpdateMatchesPersistedState(update, persistedState)
                ) {
                  log.info(
                    "TransformerEditor: debounced update - pushing transformer to context:",
                    update.selector,
                  );
                  context.updateTransformerEditorState(update);
                }
              }, 2000); // 2 second debounce

              return () => {
                if (transformerUpdateTimeoutRef.current) {
                  clearTimeout(transformerUpdateTimeoutRef.current);
                  transformerUpdateTimeoutRef.current = null;
                }
              };
            }, [
              formikContext.values.transformerEditor_transformer_selector.mode,
              safeStringify(formikContext.values.transformerEditor_transformer_selector.transformer),
              formikContext.values[formikPath_TransformerEditorInputModeSelector].mode,
              safeStringify(formikContext.values[formikPath_TransformerEditorInputModeSelector].input),
              safeStringify(formikContext.values.transformerEditor_input),
              persistedState,
              context,
            ]);

            // ###############################################################################################
            // ###############################################################################################
            // ###############################################################################################
            // ###############################################################################################
            // ###############################################################################################
            // ##################################################################################
            // Apply transformer to input
            const transformerInput = useMemo(
              () =>
                formikContext.values[formikPath_TransformerEditorInputModeSelector].mode == "here"
                  ? {[defaultTransformerInput]: formikContext.values[formikPath_TransformerEditorInputModeSelector].input}
                  : formikContext.values.transformerEditor_input ?? {},
              [
                formikContext.values[formikPath_TransformerEditorInputModeSelector].mode,
                formikContext.values[formikPath_TransformerEditorInputModeSelector].input,
                formikContext.values.transformerEditor_input,
              ]
            );

            const transformationInputFingerprint = useMemo(
              () =>
                safeStringify({
                  mode: formikContext.values[formikPath_TransformerEditorInputModeSelector].mode,
                  input: formikContext.values[formikPath_TransformerEditorInputModeSelector].input,
                  transformerEditor_input: formikContext.values.transformerEditor_input,
                }),
              [
                formikContext.values[formikPath_TransformerEditorInputModeSelector].mode,
                safeStringify(formikContext.values[formikPath_TransformerEditorInputModeSelector].input),
                safeStringify(formikContext.values.transformerEditor_input),
              ],
            );

            const transformerDefinitionFingerprint = useMemo(
              () =>
                safeStringify(
                  formikContext.values.transformerEditor_transformer_selector.transformer ??
                    DEFAULT_TRANSFORMER_EDITOR_TRANSFORMER,
                ),
              [safeStringify(formikContext.values.transformerEditor_transformer_selector.transformer)],
            );

            const transformationResult = useMemo(() => {
              const currentFormikTransformerDefinition: CoreTransformerForBuildPlusRuntime =
                formikContext.values.transformerEditor_transformer_selector.transformer ??
                DEFAULT_TRANSFORMER_EDITOR_TRANSFORMER;
              const transformerParams = {
                ...transformerInput,
              };

              return transformer_extended_apply_wrapper(
                undefined, // preview only — avoid global activity/event churn on each render
                "runtime", // step
                ["rootTransformer"], // transformerPath
                "TransformerEditor", // label
                currentFormikTransformerDefinition, // transformer
                "value", // resolveBuildTransformersTo
                editorModelEnvironment,
                transformerParams,
                transformerInput,
              );
            }, [transformerDefinitionFingerprint, transformationInputFingerprint, editorModelEnvironment]);

            const innermostError = useMemo(
              () =>
                transformationResult &&
                typeof transformationResult == "object" &&
                "queryFailure" in transformationResult
                  ? getInnermostTransformerError(transformationResult)
                  : undefined,
              [transformationResult]
            );
            const errorPath = innermostError?.transformerPath || [];
            log.info("TransformerEditor Transformation error path:", errorPath);

            // ################################################################################################
            const transformationResultSchema: MlElement = useMemo(() => {
              return valueToMl(transformationResult);
            }, [transformationResult]);

            // ##################################################################################
            // Form ML Schema for the transformer editor
            const formMLSchema: MlObject = useMemo(() => {
              return {
                type: "object",
                definition: {
                  transformerEditor_transformer_selector: {
                    type: "union",
                    discriminator: "mode",
                    tag: {
                      value: {
                        initializeTo: {
                          initializeToType: "value",
                          value: "here",
                        },
                      },
                    },
                    definition: [
                      {
                        type: "object",
                        definition: {
                          mode: {
                            type: "literal",
                            definition: "none",
                          },
                        },
                      },
                      // transformerEditor_transformer_selector here mode uses the in-editor transformer
                      {
                        type: "object",
                        definition: {
                          mode: {
                            type: "literal",
                            definition: "here",
                          },
                          transformer: {
                            type: "schemaReference",
                            definition: {
                              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                              relativePath: "coreTransformerForBuildPlusRuntime",
                            },
                          },
                        },
                      },
                      // transformerEditor_transformer_selector defined mode uses a stored transformer
                      {
                        type: "object",
                        definition: {
                          mode: {
                            type: "literal",
                            definition: "defined",
                          },
                          application: {
                            type: "uuid",
                            nullable: true,
                            tag: {
                              value: {
                                defaultLabel: "Application",
                                editable: true,
                                foreignKeyParams: {
                                  targetApplicationUuid: adminSelfApplication.uuid,
                                  targetEntity: entityApplicationForAdmin.uuid,
                                  targetEntityOrderInstancesBy: "name",
                                },
                                initializeTo: {
                                  initializeToType: "value",
                                  value: application,
                                },
                              },
                            },
                          },
                          transformerUuid: {
                            type: "uuid",
                            tag: {
                              value: {
                                foreignKeyParams: {
                                  targetApplicationUuid: (
                                    formikContext.values
                                      .transformerEditor_transformer_selector as any
                                  ).application,
                                  targetEntity: entityDefinitionTransformerDefinition.entityUuid,
                                  targetEntityOrderInstancesBy: "name",
                                },
                                initializeTo: {
                                  initializeToType: "value",
                                  value: noValue.uuid,
                                },
                              },
                            },
                          },
                          transformer: {
                            type: "schemaReference",
                            optional: true,
                            definition: {
                              absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                              relativePath: "coreTransformerForBuildPlusRuntime",
                            },
                          },
                        },
                      },
                    ],
                  } as MlUnion,
                  [formikPath_TransformerEditorInputModeSelector]: {
                    type: "union",
                    discriminator: "mode",
                    tag: {
                      value: {
                        initializeTo: {
                          initializeToType: "value",
                          value: { mode: "here", input: { placeholder: "put your input here..." } },
                        },
                      },
                    },
                    definition: [
                      // here mode uses the in-editor transformer
                      {
                        type: "object",
                        definition: {
                          mode: {
                            type: "literal",
                            definition: "here",
                          },
                          input: {
                            type: "any",
                            tag: {
                              value: {
                                initializeTo: {
                                  initializeToType: "value",
                                  value: { sampleKey: "sampleValue" },
                                },
                              },
                            },
                          },
                        },
                      },
                      // instance mode extract Entity instances using a query
                      {
                        type: "object",
                        definition: {
                          mode: {
                            type: "literal",
                            definition: "instance",
                          },
                        },
                      },
                    ],
                  } as MlUnion,
                  transformerEditor_input: {
                    type: "any",
                  } as MlElement,
                  transformerEditor_editor: {
                    type: "object",
                    definition: {
                      currentTransformerDefinition: {
                        type: "schemaReference",
                        definition: {
                          absolutePath: "fe9b7d99-f216-44de-bb6e-60e1a1ebb739",
                          relativePath: "coreTransformerForBuildPlusRuntime",
                        },
                      },
                    },
                  } as MlObject,
                },
              };
            }, [(formikContext.values.transformerEditor_transformer_selector as any).application, application]);

            // ####################################################################################
            // ####################################################################################
            // ####################################################################################
            // ####################################################################################
            return (
              // 3-Pane Layout
              <div
                style={{
                  display: "flex",
                  gap: "20px",
                  justifyContent: "start",
                  alignItems: "flex-start",
                }}
              >
                {/* left Pane: Transformer Definition Editor */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    maxWidth: "50%",
                    flexGrow: 1,
                  }}
                >
                  <JsonDisplayHelper debug={false}
                    componentName="TransformerEditor"
                    elements={[
                      {
                        label: "formikValues",
                        data: formikContext.values,
                        useCodeBlock: true,
                      },
                      {
                        label: "inputSelector defaultAdminApplicationDeploymentMapNOTGOOD",
                        data: defaultAdminApplicationDeploymentMapNOTGOOD,
                      },
                      {
                        label: "formikContext.values." + formikPath_TransformerEditorInputModeSelector,
                        data: formikContext.values[formikPath_TransformerEditorInputModeSelector],
                      },
                      {
                        label: "currentDefinedTransformerDefinition",
                        data: transformerSelector_currentFetchedTransformerDefinition,
                      },
                    ]}
                  />
                  {canRenderDefinitionEditor ? (
                    <TransformerDefinitionEditor
                      formValueMLSchema={formMLSchema.definition["transformerEditor_transformer_selector"]}
                      application={editorApplication}
                      applicationDeploymentMap={applicationDeploymentMap}
                      deploymentUuid={editorDeploymentUuid}
                      editedTransformer={formikContext.values.transformerEditor_transformer_selector.transformer}
                      rootInputType={transformerEditorRootInputType(
                        formikContext.values[formikPath_TransformerEditorInputModeSelector],
                        formikContext.values.transformerEditor_input,
                      )}
                      entities={editorModel?.entities}
                      restrictTransformersToInputType={restrictTransformersToInputType}
                      onRestrictTransformersToInputTypeChange={(checked) =>
                        context.updateTransformerEditorState({
                          restrictTransformersToInputType: checked,
                        })
                      }
                      transformerHistory={transformerHistory}
                      transformerInput={transformerInput}
                      modelEnvironment={editorModelEnvironment}
                      definedTransformer={
                        selectorValues.mode === "defined" ? transformerSelector_currentFetchedTransformerDefinition : undefined
                      }
                    />
                  ) : null}
                </div>
                {/* Right Panes: stacked */}
                {/* <div style={{ display: "flex", flexDirection: "column", gap: "20px", minWidth: "50%" }}> */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "start",
                    alignItems: "flex-start",
                    minWidth: "50%",
                    gap: "20px",
                  }}
                >
                  {/* input selector */}
                  <ThemedFoldableContainer style={{ flex: 1 }} title="Transformer Input">
                    {canRenderInputEditor ? (
                      <TypedValueObjectEditor
                        valueObjectEditMode="create"
                        labelElement={<>Input Definition</>}
                        formValueMLSchema={
                          formMLSchema.definition[formikPath_TransformerEditorInputModeSelector]
                        }
                        formikValuePathAsString={formikPath_TransformerEditorInputModeSelector}
                        application={editorApplication}
                        applicationDeploymentMap={applicationDeploymentMap}
                        deploymentUuid={editorDeploymentUuid}
                        applicationSection={"model"}
                        formLabel={"Transformer Input Selector"}
                        displaySubmitButton="noDisplay"
                        maxRenderDepth={Infinity}
                      />
                    ) : null}
                  </ThemedFoldableContainer>
                  {inputSelectorMode == "instance" && (
                    <EntityInstanceSelectorPanel
                      initialApplicationUuid={editorApplication}
                      initialEntityUuid={initialEntityUuid}
                      deploymentUuid={editorDeploymentUuid}
                      applicationDeploymentMap={applicationDeploymentMap}
                      showAllInstances={showAllInstances}
                    />
                  )}
                  <TransformationResultPanel
                    transformationResult={transformationResult}
                    transformationResultSchema={transformationResultSchema}
                    showAllInstances={showAllInstances}
                    inputApplication={editorApplication}
                    inputDeploymentUuid={editorDeploymentUuid}
                    inputSelectorMode={inputSelectorMode}
                  />
                </div>
              </div>
            );
          }
        }
      </Formik>
      <TransformerEventsPanel />

      {/* <DebugPanel currentTransformerDefinition={currentTransformerDefinition} /> */}
    </ThemedContainer>
  );
};
