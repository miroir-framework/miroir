import { FormikProps, useFormikContext } from "formik";
import { useContext, useEffect, useMemo, useState } from "react";


import {
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodElement,
  KeyMapEntry,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerExtractorAndParams,
  TransformerFailure,
  defaultMiroirModelEnvironment,
  defaultSelfApplicationDeploymentMap,
  dummyDomainManyQueryWithDeploymentUuid,
  getApplicationSection,
  getQueryRunnerParamsForReduxDeploymentsState,
  noValue,
  resolvePathOnObject,
  selfApplicationMiroir,
  transformer_extended_apply_wrapper,
  type ApplicationDeploymentMap,
  type MiroirActivityTrackerInterface,
  type MiroirModelEnvironment,
  type TransformerReturnType,
  type Uuid,
  type JzodObject
} from "miroir-core";
import { FieldValidationContext } from "./FieldValidationContext.js";
import { getMemoizedReduxDeploymentsStateSelectorMap } from "../../../miroir-localcache-imports.js";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { MiroirReactContext, useMiroirContextService } from "../../MiroirContextReactProvider";
import {
  useCurrentModel,
  useCurrentModelEnvironment,
  useDefaultValueParams,
  useReduxDeploymentsStateQuerySelectorForCleanedResult,
} from "../../ReduxHooks";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditorHooks"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// ##################################################################################################
export interface JzodElementEditorHooks {
  // environment
  context: MiroirReactContext;
  currentModel: MetaModel;
  miroirMetaModel: MetaModel;
  currentApplicationModelEnvironment: MiroirModelEnvironment;
  // ??
  deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState>;
  // state
  currentTypecheckKeyMap: KeyMapEntry | undefined;
  formik: FormikProps<Record<string, any>>;
  formikRootLessListKeyArray: (string | number)[];
  formikRootLessListKey: string;
  currentValueObject: any;
  currentValueObjectAtKey: any; // current value of the jzod element
  codeMirrorValue: string;
  setCodeMirrorValue: React.Dispatch<React.SetStateAction<string>>;
  codeMirrorIsValidJson: boolean;
  setCodeMirrorIsValidJson: React.Dispatch<React.SetStateAction<boolean>>;
  displayAsStructuredElement: boolean;
  setDisplayAsStructuredElement: React.Dispatch<React.SetStateAction<boolean>>;
  localResolvedElementJzodSchemaBasedOnValue: JzodElement | undefined;
  // uuid, objects, arrays
  foreignKeyObjects: Record<string, EntityInstancesUuidIndex>
  definedOptionalAttributes: Set<string>;
  undefinedOptionalAttributes: string[];
  stringSelectList: [string, EntityInstance][];
  // Array / Object fold / unfold, order
  itemsOrder: any[];
  // hiddenFormItems and setHiddenFormItems moved to props
}


// ################################################################################################
// ##############################################################################################
export function getItemsOrder(
  formikRootLessListKey: string,
  typeCheckKeyMapEntry: KeyMapEntry | undefined,
  currentValue: any,
  rawMLSchema: JzodElement | undefined,
  flattenedMLSchema: JzodObject | undefined,
  resolvedMLSchema: JzodElement | undefined,
) {
  // log.info(
  //   "getItemsOrder",
  //   "formikRootLessListKey",
  //   formikRootLessListKey,
  //   "typeCheckKeyMapEntry",
  //   typeCheckKeyMapEntry,
  //   "currentValue",
  //   currentValue,
  //   "rawMLSchema",
  //   rawMLSchema,
  //   "flattenedMLSchema",
  //   flattenedMLSchema,
  //   "resolvedMLSchema",
  //   resolvedMLSchema,
  // );
  if (
    (resolvedMLSchema?.type == "object" || rawMLSchema?.type == "record" || typeCheckKeyMapEntry?.resolvedReferenceSchemaInContext?.type == "record") &&
    typeof currentValue == "object" &&
    currentValue !== null
  ) {
    if (rawMLSchema?.type == "record" || typeCheckKeyMapEntry?.resolvedReferenceSchemaInContext?.type == "record") {
      // For records: sort entries by value's tag.value.id if any entries have one, otherwise use memory order
      const keys = Object.keys(currentValue);
      const withId: { key: string; id: number }[] = [];
      const withoutId: string[] = [];
      for (const key of keys) {
        const id = currentValue[key]?.tag?.value?.id;
        if (typeof id === "number") {
          withId.push({ key, id });
        } else {
          withoutId.push(key);
        }
      }
      if (withId.length > 0) {
        withId.sort((a, b) => a.id - b.id);
        return [...withId.map((e) => e.key), ...withoutId];
      }
      return keys;
    }
    // For typed objects: sort attributes by tag.value.id (ascending), id-less attributes come after
    const definition = flattenedMLSchema?.definition ?? {};
    const presentKeys = Object.keys(definition).filter((k) => k in currentValue);
    const withId: { key: string; id: number }[] = [];
    const withoutId: string[] = [];
    for (const key of presentKeys) {
      const id = definition[key]?.tag?.value?.id;
      if (typeof id === "number") {
        withId.push({ key, id });
      } else {
        withoutId.push(key);
      }
    }
    withId.sort((a, b) => a.id - b.id);
    return [...withId.map((e) => e.key), ...withoutId];
  }
  if (Array.isArray(currentValue)) {
    return currentValue.map((e: any, k: number) => k);
  }
  return [];
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
let count = 0;

// export function useJzodElementEditorHooks<P extends JzodEditorPropsRoot>(
export function useJzodElementEditorHooks(
  // props: P,
  rootLessListKey: string,
  rootLessListKeyArray: (string | number)[],
  reportSectionPathAsString: string,
  typeCheckKeyMap: Record<string, KeyMapEntry> | undefined,
  currentApplication: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  currentDeploymentUuid: Uuid | undefined,
  count: number, // used for debugging
  caller: string,
): JzodElementEditorHooks {
  // general use
  count++;
  const context = useMiroirContextService();
  const currentModel: MetaModel = useCurrentModel(currentApplication, applicationDeploymentMap);
  const miroirMetaModel: MetaModel = useCurrentModel(
    selfApplicationMiroir.uuid,
    applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap
  );
  let dbgInt = 0;
  // log.info("useJzodElementEditorHooks ", dbgInt++, "aggregate", count, "caller", caller);
  
  // ################################################################################################
  // codeMirror state
  const formik = useFormikContext<Record<string, any>>();
  
  const currentReportSectionFormikValues = formik.values[reportSectionPathAsString] ?? formik.values;
  const formikRootLessListKeyArray = [reportSectionPathAsString, ...rootLessListKeyArray];
  const formikRootLessListKey = formikRootLessListKeyArray.join(".");

  const currentValueObjectAtKey = useMemo(() => {
    try {
      return rootLessListKeyArray.length > 0
        ? resolvePathOnObject(currentReportSectionFormikValues, rootLessListKeyArray)
        : currentReportSectionFormikValues;
    } catch (e) {
      log.warn(
        "useJzodElementEditorHooks resolvePathOnObject error",
        "rootLessListKeyArray",
        rootLessListKeyArray,
        "aggregate",
        count,
        "caller",
        caller,
        "currentReportSectionFormikValues",
        currentReportSectionFormikValues,
        "formik.values",
        formik.values,
        "error",
        e
      );
      // return formik.values; // fallback to formik.values if the path resolution fails
      return currentReportSectionFormikValues;
    }
  }, [formik.values, currentReportSectionFormikValues, rootLessListKeyArray]);

  const currentApplicationModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    currentApplication,
    applicationDeploymentMap
  );

  const defaultValueParams = useDefaultValueParams(
    currentApplication,
    currentDeploymentUuid,
  )

  const currentTypecheckKeyMap: KeyMapEntry | undefined =
    typeCheckKeyMap && typeCheckKeyMap[rootLessListKey]
      ? typeCheckKeyMap[rootLessListKey]
      : undefined;

  const [codeMirrorValue, setCodeMirrorValue] = useState<string>("");

  const [codeMirrorIsValidJson, setCodeMirrorIsValidJson] = useState(true);

  const [displayAsStructuredElement, setDisplayAsStructuredElement] = useState(true);
  // log.info("useJzodElementEditorHooks ", dbgInt++, "aggregate", count, "caller", caller);

  // ################################################################################################
  // ################################################################################################
  // ################################################################################################
  // ################################################################################################
  // value schema
  // Memoize to prevent infinite re-renders when used in useMemo dependencies
  const localResolvedElementJzodSchemaBasedOnValue: JzodElement | undefined = useMemo(
    () =>currentTypecheckKeyMap?.resolvedSchema,
    [currentTypecheckKeyMap]
  );
  // for objects, records
  const itemsOrder: any[] = useMemo(
    () =>
      getItemsOrder(
        formikRootLessListKey,
        currentTypecheckKeyMap,
        currentValueObjectAtKey,
        currentTypecheckKeyMap?.rawSchema,
        currentTypecheckKeyMap?.jzodObjectFlattenedSchema,
        localResolvedElementJzodSchemaBasedOnValue,
      ),
    [localResolvedElementJzodSchemaBasedOnValue, currentValueObjectAtKey],
  );
    
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
    useMemo(() => getMemoizedReduxDeploymentsStateSelectorMap(), []);

  // ######################### foreignKeyObjects #########################
  const foreignKeyObjectsFetchQueryParams: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState> = useMemo(
    () => {
      if (
        // currentDeploymentUuid &&
        currentTypecheckKeyMap &&
        currentTypecheckKeyMap.resolvedSchema &&
        currentTypecheckKeyMap.resolvedSchema.type == "uuid" &&
        currentTypecheckKeyMap.resolvedSchema.tag?.value?.foreignKeyParams?.targetEntity &&
        currentTypecheckKeyMap.resolvedSchema.tag?.value?.foreignKeyParams?.targetEntity !== noValue.uuid
      ) {

        let targetApplication: TransformerReturnType<any> =
          currentTypecheckKeyMap.resolvedSchema.tag?.value?.foreignKeyParams?.targetApplicationUuid &&
          currentTypecheckKeyMap.resolvedSchema.tag?.value?.foreignKeyParams?.targetApplicationUuid !==
            noValue.uuid
            ? currentTypecheckKeyMap.resolvedSchema.tag?.value?.foreignKeyParams?.targetApplicationUuid
            : currentApplication;

        
        if (
          typeof targetApplication == "object"
        ) {
          targetApplication = transformer_extended_apply_wrapper(
            context.miroirContext.miroirActivityTracker, // activityTracker
            "runtime", // step
            [], // transformerPath
            (
              currentTypecheckKeyMap.resolvedSchema.tag?.value?.foreignKeyParams
                ?.targetApplicationUuid as any
            )?.label ?? "evaluation of hidden property", // label
            targetApplication, // transformer
            defaultMiroirModelEnvironment, // TODO: use the real environment
            formik.values, // queryParams
            formik.values, // contextResults - pass the instance to transform
            "value" // resolveBuildTransformersTo
          );
          // log.info(
          //   "useJzodElementEditorHooks",
          //   "rootLessListKey:", rootLessListKey,
          //   "resolved applicationUuid:",
          //   targetApplication,
          //   "for",
          //   (
          //     currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams
          //       ?.targetApplicationUuid as any
          //   )?.label, "transformer:", currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams?.targetApplicationUuid
          // );
          if (targetApplication instanceof TransformerFailure) {
            throw new Error(
              "JzodElementEditorHooks: applicationUuid resolved from transformer is not a string: " +
                targetApplication
            );
          }
        }
        // log.info(
        //   "useJzodElementEditorHooks",
        //   "rootLessListKey:",
        //   rootLessListKey,
        //   "for foreignKeyObjects",
        //   "targetApplication:",
        //   targetApplication,
        // );
        // let deploymentUuid: Uuid | undefined = applicationDeploymentMap[targetApplication];
        const applicationSection = getApplicationSection(
          targetApplication,
          currentTypecheckKeyMap.resolvedSchema.tag?.value?.foreignKeyParams?.targetEntity
        );
        if (targetApplication !== noValue.uuid) {
          return getQueryRunnerParamsForReduxDeploymentsState(
            {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              application: targetApplication,
              pageParams: {},
              queryParams: {},
              contextResults: {},
              extractors: {
                [currentTypecheckKeyMap.resolvedSchema.tag?.value?.foreignKeyParams?.targetEntity]: {
                  extractorOrCombinerType: "extractorByEntityReturningObjectList",
                  label: "jzodElementEditorHooks foreign key objects",
                  applicationSection,
                  parentName: "",
                  parentUuid:
                    currentTypecheckKeyMap.resolvedSchema.tag?.value?.foreignKeyParams?.targetEntity,
                  ...(
                    currentTypecheckKeyMap.resolvedSchema.tag?.value?.foreignKeyParams?.targetEntityFilterInstancesBy? {
                      filter: currentTypecheckKeyMap.resolvedSchema.tag?.value?.foreignKeyParams?.targetEntityFilterInstancesBy
                    }: {}
                  ),
                  orderBy: {
                    attributeName:
                      currentTypecheckKeyMap.resolvedSchema.tag?.value?.foreignKeyParams
                        ?.targetEntityOrderInstancesBy ?? "name",
                  },
                },
              },
            },
            deploymentEntityStateSelectorMap
          );
        } else {
          return getQueryRunnerParamsForReduxDeploymentsState(
            dummyDomainManyQueryWithDeploymentUuid,
            deploymentEntityStateSelectorMap
          );
        }
      } else {
        return getQueryRunnerParamsForReduxDeploymentsState(
          dummyDomainManyQueryWithDeploymentUuid,
          deploymentEntityStateSelectorMap
        );
      }
    },
    [deploymentEntityStateSelectorMap, currentDeploymentUuid, currentTypecheckKeyMap?.rawSchema]
  );

  const foreignKeyObjects: Record<string, EntityInstancesUuidIndex> =
    useReduxDeploymentsStateQuerySelectorForCleanedResult(
      deploymentEntityStateSelectorMap.runQuery,
      foreignKeyObjectsFetchQueryParams,
      applicationDeploymentMap,
  ) || {};

  // log.info(
  //   "useJzodElementEditorHooks",
  //   "rootLessListKey:",
  //   rootLessListKey,
  //   "currentDeploymentUuid:",
  //   currentDeploymentUuid,
  //   "currentTypecheckKeyMap?.rawSchema.tag?.value?.foreignKeyParams:",
  //   currentTypecheckKeyMap?.rawSchema.tag?.value?.foreignKeyParams,
  //   "foreignKeyObjectsFetchQueryParams",
  //   foreignKeyObjectsFetchQueryParams,
  //   "foreignKeyObjects", foreignKeyObjects,
  // );

  // ######################### optional attributes #########################
  const typeCheckMapJzodObjectFlattenedSchema: JzodObject | undefined =
    typeCheckKeyMap !== undefined &&
    typeCheckKeyMap[rootLessListKey] !== undefined &&
    typeCheckKeyMap[rootLessListKey].jzodObjectFlattenedSchema !== undefined
      ? typeCheckKeyMap[rootLessListKey].jzodObjectFlattenedSchema
      : undefined;

  const typeCheckKeyMapChosenUnionBranchObjectSchema: JzodObject | undefined = // defined when rawSchema.type == "union" && resolvedElementJzodSchema.type == "object"
    typeCheckKeyMap !== undefined &&
    typeCheckKeyMap[rootLessListKey] !== undefined &&
    typeCheckKeyMap[rootLessListKey].chosenUnionBranchRawSchema !== undefined &&
    typeCheckKeyMap[rootLessListKey].chosenUnionBranchRawSchema?.type == "object"
      ? typeCheckKeyMap[rootLessListKey].chosenUnionBranchRawSchema as JzodObject
      : undefined;

  const undefinedOptionalAttributes: string[] = useMemo(() => {
    if (typeCheckMapJzodObjectFlattenedSchema) {
      const currentObjectAttributes = Object.keys(currentValueObjectAtKey);
      return Object.entries(typeCheckMapJzodObjectFlattenedSchema.definition)
        .filter((a) => a[1].optional)
        .filter((a) => !currentObjectAttributes.includes(a[0]))
        .map((a) => a[0]);
    }
    if (typeCheckKeyMapChosenUnionBranchObjectSchema) {
      const currentObjectAttributes = Object.keys(currentValueObjectAtKey);
      return Object.entries(typeCheckKeyMapChosenUnionBranchObjectSchema.definition)
        .filter((a) => a[1].optional)
        .filter((a) => !currentObjectAttributes.includes(a[0]))
        .map((a) => a[0]);
    }
    return [];
  }, [
    typeCheckKeyMapChosenUnionBranchObjectSchema,
    typeCheckMapJzodObjectFlattenedSchema,
    currentValueObjectAtKey,
  ]);

  const definedOptionalAttributes: Set<string> = useMemo(() => {
    if (typeCheckMapJzodObjectFlattenedSchema) {
      const currentObjectAttributes = Object.keys(currentValueObjectAtKey);
      return new Set(
        Object.entries(typeCheckMapJzodObjectFlattenedSchema.definition)
          .filter((a) => a[1].optional)
          .filter((a) => currentObjectAttributes.includes(a[0]))
          .map((a) => a[0])
      );
    }
    if (typeCheckKeyMapChosenUnionBranchObjectSchema) {
      const currentObjectAttributes = Object.keys(currentValueObjectAtKey);
      return new Set(
        Object.entries(typeCheckKeyMapChosenUnionBranchObjectSchema?.definition ?? [])
          .filter((a) => a[1].optional)
          .filter((a) => currentObjectAttributes.includes(a[0]))
          .map((a) => a[0])
      );
    }
    return new Set();
  }, [
    typeCheckMapJzodObjectFlattenedSchema,
    typeCheckKeyMapChosenUnionBranchObjectSchema,
    currentValueObjectAtKey,
  ]);

  const stringSelectList = useMemo(() => {
    if (
      localResolvedElementJzodSchemaBasedOnValue?.type == "uuid" &&
      localResolvedElementJzodSchemaBasedOnValue.tag?.value?.foreignKeyParams?.targetEntity
    ) {
      return [
        [noValue.uuid, noValue] as [string, EntityInstance],
        ...Object.entries(
          foreignKeyObjects[localResolvedElementJzodSchemaBasedOnValue.tag.value?.foreignKeyParams?.targetEntity] ??
            {}
        ),
      ];
    }
    return [];
  }, [localResolvedElementJzodSchemaBasedOnValue, foreignKeyObjects]);
  // log.info("getJzodElementEditorHooks ", dbgInt++, "aggregate", count, "caller", caller);

  return {
    context,
    currentModel,
    miroirMetaModel,
    currentTypecheckKeyMap,
    currentValueObject: currentReportSectionFormikValues,
    currentValueObjectAtKey,
    currentApplicationModelEnvironment,
    formik,
    formikRootLessListKeyArray,
    formikRootLessListKey,
    displayAsStructuredElement,
    setDisplayAsStructuredElement,
    codeMirrorValue,
    setCodeMirrorValue,
    codeMirrorIsValidJson,
    setCodeMirrorIsValidJson,
    deploymentEntityStateSelectorMap,
    localResolvedElementJzodSchemaBasedOnValue,
    foreignKeyObjects,
    // Array / Object fold / unfold state
    itemsOrder,
    definedOptionalAttributes,
    stringSelectList,
    undefinedOptionalAttributes,
  };
}

// ################################################################################################
/**
 * Shared utility function to get the displayed value when an object/array is folded.
 * Uses the schema's tag.value.display.displayedAttributeValueWhenFolded path to resolve a display value from the current value.
 * 
 * @param schema - The Jzod schema element that may contain the display configuration
 * @param currentValue - The current data value to resolve the display path on
 * @returns The display value if found and valid, null otherwise
 */
export function getFoldedDisplayValue(schema: JzodElement | undefined, currentValue: any): any {
  if (!schema || !currentValue) {
    return null;
  }

  // Check if there's a displayedAttributeValueWhenFolded path in the schema's tag
  const displayPath = (schema as any)?.tag?.value?.display?.displayedAttributeValueWhenFolded;
  
  if (!displayPath) {
    return null;
  }

  try {
    // Convert string path to array if needed (e.g., "name" or "user.name" -> ["name"] or ["user", "name"])
    const pathArray = Array.isArray(displayPath) ? displayPath : displayPath.split('.');
    const displayValue = resolvePathOnObject(currentValue, pathArray);
    
    // Only return the value if it exists and is not null/undefined
    if (displayValue !== null && displayValue !== undefined) {
      return displayValue;
    }
  } catch (error) {
    // If path resolution fails, don't show anything
    log.warn("Failed to resolve displayedAttributeValueWhenFolded path:", displayPath, "on value:", currentValue, "error:", error);
  }

  return null;
}

// ################################################################################################
/**
 * Hook to evaluate a field-level formValidation transformer and register the result
 * in the FieldValidationContext so that the form-level (TypedValueObjectEditor)
 * can take field-level errors into account for submit gating.
 *
 * @param rootLessListKey  - The field key (used as the context key for error registration)
 * @param currentTypecheckKeyMap - The KeyMapEntry for the current field
 * @param formikValues - The full formik values (for cross-field references in transformers)
 * @param currentMiroirModelEnvironment - The model environment
 * @param activityTracker - Optional activity tracker
 * @param reduxDeploymentsState - Optional redux deployments state (for runtime transformers)
 * @param deploymentUuid - Optional deployment UUID
 * @returns The validation error string, or undefined if valid
 */
export function useFieldValidation(
  rootLessListKey: string,
  currentTypecheckKeyMap: KeyMapEntry | undefined,
  formikValues: Record<string, any>,
  currentMiroirModelEnvironment: MiroirModelEnvironment,
  activityTracker: MiroirActivityTrackerInterface | undefined,
  reduxDeploymentsState?: ReduxDeploymentsState,
  deploymentUuid?: Uuid,
): string | undefined {
  const { setFieldError } = useContext(FieldValidationContext);

  const validationError: string | undefined = useMemo(() => {
    const formValidation = currentTypecheckKeyMap?.rawSchema?.tag?.value?.formValidation;
    if (!formValidation?.transformer) {
      return undefined;
    }
    const transformerLabel: string =
      (formValidation.transformer as any)?.label ?? "formValidation";
    try {
      const result = transformer_extended_apply_wrapper(
        activityTracker,
        "runtime",
        [],
        transformerLabel,
        formValidation.transformer,
        currentMiroirModelEnvironment,
        formikValues,
        {},
        "value",
        reduxDeploymentsState,
        deploymentUuid,
      );
      if (result instanceof TransformerFailure) {
        return result.failureMessage ?? result.queryFailure ?? "Validation failed";
      }
      if (result === true) return undefined;
      if (typeof result === "string") return result;
      if (!result) return "Validation failed";
      return undefined;
    } catch (e: any) {
      log.error("useFieldValidation error for", rootLessListKey, e);
      return e?.message ?? "Validation error";
    }
  }, [
    currentTypecheckKeyMap,
    formikValues,
    currentMiroirModelEnvironment,
    activityTracker,
    reduxDeploymentsState,
    deploymentUuid,
  ]);

  // Register/clear the validation error in the FieldValidationContext so that form-level
  // logic (TypedValueObjectEditor) can aggregate field-level errors.
  // This useEffect is strictly necessary: it bridges per-field memoized validation results
  // into the shared context without re-rendering the field itself.
  useEffect(() => {
    setFieldError(rootLessListKey, validationError);
  }, [rootLessListKey, validationError, setFieldError]);

  return validationError;
}