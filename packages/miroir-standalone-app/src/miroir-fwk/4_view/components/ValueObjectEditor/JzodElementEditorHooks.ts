import { FormikProps, useFormikContext } from "formik";
import { useMemo, useState } from "react";


import {
  ReduxDeploymentsState,
  Domain2QueryReturnType,
  DomainElementSuccess,
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodElement,
  KeyMapEntry,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  SyncQueryRunnerExtractorAndParams,
  adminConfigurationDeploymentMiroir,
  dummyDomainManyQueryWithDeploymentUuid,
  getApplicationSection,
  getQueryRunnerParamsForReduxDeploymentsState,
  resolvePathOnObject,
  type Uuid,
  type MiroirModelEnvironment,
  miroirFundamentalJzodSchema,
  type MlSchema,
  defaultMiroirModelEnvironment,
  transformer_extended_apply_wrapper,
  type TransformerReturnType,
  TransformerFailure,
  type ApplicationDeploymentMap,
  selfApplicationMiroir,
  defaultSelfApplicationDeploymentMap
} from "miroir-core";
import { JzodObject } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { getMemoizedReduxDeploymentsStateSelectorMap } from "miroir-localcache-redux";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { MiroirReactContext, useMiroirContextService } from "../../MiroirContextReactProvider";
import { useCurrentModel, useCurrentModelEnvironment, useReduxDeploymentsStateQuerySelectorForCleanedResult } from "../../ReduxHooks";
import { JzodEditorPropsRoot, noValue } from "./JzodElementEditorInterface";

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
export function getItemsOrder(currentValue: any, mlSchema: JzodElement | undefined) {
  return (mlSchema?.type == "object" || mlSchema?.type == "record") &&
    typeof currentValue == "object" &&
    currentValue !== null
    ? Object.keys(currentValue)
    : Array.isArray(currentValue)
    ? currentValue.map((e: any, k: number) => k)
    : [];
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
  // const currentMiroirModelEnvironment: MiroirModelEnvironment = useMemo(() => {
  //   return {
  //     miroirFundamentalJzodSchema: context.miroirFundamentalJzodSchema?? miroirFundamentalJzodSchema as MlSchema,
  //     miroirMetaModel: miroirMetaModel,
  //     currentModel: currentModel,
  //   };
  // }, [
  //   miroirMetaModel,
  //   currentModel,
  //   context.miroirFundamentalJzodSchema,
  // ]);

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
    const localResolvedElementJzodSchemaBasedOnValue: JzodElement | undefined =
      typeCheckKeyMap && typeCheckKeyMap[rootLessListKey]
        ? typeCheckKeyMap[rootLessListKey]?.resolvedSchema
        : undefined;
    // for objects, records
    const itemsOrder: any[] = useMemo(
      () => getItemsOrder(currentValueObjectAtKey, localResolvedElementJzodSchemaBasedOnValue),
      [localResolvedElementJzodSchemaBasedOnValue, currentValueObjectAtKey]
    );
    
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
    useMemo(() => getMemoizedReduxDeploymentsStateSelectorMap(), []);

  // ######################### foreignKeyObjects #########################
  const foreignKeyObjectsFetchQueryParams: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState> = useMemo(
    () => {
      if (
        // currentDeploymentUuid &&
        currentTypecheckKeyMap &&
        currentTypecheckKeyMap.rawSchema &&
        currentTypecheckKeyMap.rawSchema.type == "uuid" &&
        currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams?.targetEntity &&
        currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams?.targetEntity !== noValue.uuid
      ) {

        let targetApplication: TransformerReturnType<any> =
          currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams?.targetApplicationUuid &&
          currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams?.targetApplicationUuid !==
            noValue.uuid
            ? currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams?.targetApplicationUuid
            : currentApplication;

        
        if (
          typeof currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams
            ?.targetApplicationUuid == "object"
        ) {
          targetApplication = transformer_extended_apply_wrapper(
            context.miroirContext.miroirActivityTracker, // activityTracker
            "runtime", // step
            [], // transformerPath
            (
              currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams
                ?.targetApplicationUuid as any
            )?.label ?? "evaluation of hidden property", // label
            currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams?.targetApplicationUuid, // transformer
            defaultMiroirModelEnvironment, // TODO: use the real environment
            formik.values, // queryParams
            formik.values, // contextResults - pass the instance to transform
            "value" // resolveBuildTransformersTo
          );
          log.info(
            "useJzodElementEditorHooks",
            "rootLessListKey:", rootLessListKey,
            "resolved applicationUuid:",
            targetApplication,
            "for",
            (
              currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams
                ?.targetApplicationUuid as any
            )?.label, "transformer:", currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams?.targetApplicationUuid
          );
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
        let deploymentUuid: Uuid | undefined = applicationDeploymentMap[targetApplication];
        const applicationSection = getApplicationSection(
          deploymentUuid,
          currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams?.targetEntity
        );
        if (targetApplication !== noValue.uuid) {
          return getQueryRunnerParamsForReduxDeploymentsState(
            {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              application: targetApplication,
              deploymentUuid,
              pageParams: {},
              queryParams: {},
              contextResults: {},
              extractors: {
                [currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams?.targetEntity]: {
                  extractorOrCombinerType: "extractorByEntityReturningObjectList",
                  label: "jzodElementEditorHooks foreign key objects",
                  applicationSection,
                  parentName: "",
                  parentUuid:
                    currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams?.targetEntity,
                  orderBy: {
                    attributeName:
                      currentTypecheckKeyMap.rawSchema.tag?.value?.foreignKeyParams
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

  // log.info(
  //   "useJzodElementEditorHooks",
  //   "rootLessListKey",
  //   rootLessListKey,
  //   "currentTypecheckKeyMap",
  //   currentTypecheckKeyMap,
  //   "foreignKeyParams",
  //   currentTypecheckKeyMap?.rawSchema?.tag?.value?.foreignKeyParams,
  //   "aggregate",
  //   count,
  //   "caller",
  //   caller,
  //   "foreignKeyObjects",
  //   foreignKeyObjects
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