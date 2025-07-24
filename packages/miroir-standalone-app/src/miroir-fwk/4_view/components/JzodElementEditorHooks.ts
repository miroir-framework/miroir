import { FormikProps, useFormikContext } from "formik";
import { useMemo, useState } from "react";


import {
  DeploymentEntityState,
  Domain2QueryReturnType,
  DomainElementSuccess,
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodUnion,
  KeyMapEntry,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  SyncQueryRunnerParams,
  UnfoldJzodSchemaOnceReturnType,
  adminConfigurationDeploymentMiroir,
  dummyDomainManyQueryWithDeploymentUuid,
  getApplicationSection,
  getQueryRunnerParamsForDeploymentEntityState,
  resolvePathOnObject,
  unfoldJzodSchemaOnce
} from "miroir-core";
import { JzodObject } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { getMemoizedDeploymentEntityStateSelectorMap } from "miroir-localcache-redux";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import { MiroirReactContext, useMiroirContextService } from "../MiroirContextReactProvider";
import { useCurrentModel, useDeploymentEntityStateQuerySelectorForCleanedResult } from "../ReduxHooks";
import { JzodEditorPropsRoot, noValue } from "./JzodElementEditorInterface";
import { getItemsOrder } from "./Style";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditorHooks")
).then((logger: LoggerInterface) => {
  log = logger;
});

// ##################################################################################################
export interface JzodElementEditorHooks {
  // environment
  context: MiroirReactContext;
  currentModel: MetaModel;
  miroirMetaModel: MetaModel;
  // ??
  deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState>;
  // state
  formik: FormikProps<Record<string, any>>;
  currentValue: any; // current value of the jzod element
  codeMirrorValue: string;
  setCodeMirrorValue: React.Dispatch<React.SetStateAction<string>>;
  codeMirrorIsValidJson: boolean;
  setCodeMirrorIsValidJson: React.Dispatch<React.SetStateAction<boolean>>;
  displayAsStructuredElement: boolean;
  setDisplayAsStructuredElement: React.Dispatch<React.SetStateAction<boolean>>;
  // currentValue jzod schema
  localResolvedElementJzodSchemaBasedOnValue: JzodElement | undefined;
  // unfoldedRawSchema: JzodElement;
  // uuid, objects, arrays
  foreignKeyObjects: Record<string, EntityInstancesUuidIndex>
  definedOptionalAttributes: Set<string>;
  undefinedOptionalAttributes: string[];
  stringSelectList: [string, EntityInstance][];
  // Array / Object fold / unfold, order
  itemsOrder: any[];
  hiddenFormItems: { [k: string]: boolean };
  setHiddenFormItems: React.Dispatch<
    React.SetStateAction<{
      [k: string]: boolean;
    }>
  >;
}

let count = 0;

export function useJzodElementEditorHooks<P extends JzodEditorPropsRoot>(
  props: P,
  count: number, // used for debugging
  caller: string,
): JzodElementEditorHooks {
  // general use
  count++;
  const context = useMiroirContextService();
  const currentModel: MetaModel = useCurrentModel(props.currentDeploymentUuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  let dbgInt = 0;
  // log.info("useJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);
  
  // ################################################################################################
  // codeMirror state
  const formik = useFormikContext<Record<string, any>>();
  
  const currentValue = useMemo(() => {
    try {
      return props.rootLessListKeyArray.length > 0
        ? resolvePathOnObject(formik.values, props.rootLessListKeyArray)
        : formik.values;
    } catch (e) {
      log.warn(
        "useJzodElementEditorHooks resolvePathOnObject error",
        "rootLessListKeyArray",
        props.rootLessListKeyArray,
        "count",
        count,
        "caller",
        caller,
        "formik.values",
        formik.values,
        "error",
        e
      );
      return formik.values; // fallback to formik.values if the path resolution fails
    }
  }, [formik.values, props.rootLessListKeyArray]);

  const currentTypecheckKeyMap: KeyMapEntry | undefined = props.typeCheckKeyMap && props.typeCheckKeyMap[props.rootLessListKey]?
    props.typeCheckKeyMap[props.rootLessListKey]
    : undefined;

  const [codeMirrorValue, setCodeMirrorValue] = useState<string>("");

  const [codeMirrorIsValidJson, setCodeMirrorIsValidJson] = useState(true);

  const [displayAsStructuredElement, setDisplayAsStructuredElement] = useState(true);
  // log.info("useJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);

  // ################################################################################################
  // ################################################################################################
  // ################################################################################################
  // ################################################################################################
  // value schema
  // const localResolvedElementJzodSchemaBasedOnValue: JzodElement | undefined = useMemo(() => {
  const localResolvedElementJzodSchemaBasedOnValue: JzodElement | undefined =
    props.typeCheckKeyMap && props.typeCheckKeyMap[props.rootLessListKey]
      ? props.typeCheckKeyMap[props.rootLessListKey]?.resolvedSchema
      : undefined;

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> =
    useMemo(() => getMemoizedDeploymentEntityStateSelectorMap(), []);

  // let unfoldedRawSchemaReturnType: UnfoldJzodSchemaOnceReturnType | undefined;
  // try {
  //   unfoldedRawSchemaReturnType = useMemo(() => {
  //     log.info("useJzodElementEditorHooks calling unfoldJzodSchemaOnce", "count", count, ", caller", caller, "props.rawJzodSchema", props.rawJzodSchema);
  //     const result = context.miroirFundamentalJzodSchema
  //       // ? measurePerformance("unfoldJzodSchemaOnce", unfoldJzodSchemaOnce, 1, props.rootLessListKey, props.rawJzodSchema)(
  //       ? unfoldJzodSchemaOnce(
  //           context.miroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
  //           props.rawJzodSchema,
  //           [], // path
  //           [], // unfoldingReference
  //           props.rawJzodSchema, // rootSchema
  //           0, // depth
  //           currentModel,
  //           miroirMetaModel
  //         )
  //       : undefined;
  //     return {
  //       ...result,
  //       valuePath: [],
  //       typePath: [],
  //     } as any;
  //   }, [
  //     props.rawJzodSchema,
  //     context.miroirFundamentalJzodSchema /*context.miroirFundamentalJzodSchema,*/,
  //     currentModel,
  //     miroirMetaModel,
  //   ]);
  // } catch (e) {
  //   throw e as Error; // rethrow the error to be caught by the error boundary
  //   // log.error(
  //   //   "caught error upon calling unfoldJzodSchemaOnce! count",
  //   //   count,
  //   //   "key",
  //   //   props.rootLessListKey,
  //   //   "error",
  //   //   e
  //   // );
  // }
  // log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);
  // if (!unfoldedRawSchemaReturnType || unfoldedRawSchemaReturnType.status == "error") {
  //   throw new Error(
  //     "useJzodElementEditorHooks could not unfold raw schema " +
  //      "error " +
  //       JSON.stringify(unfoldedRawSchemaReturnType, null, 2) +
  //       " props.rawJzodSchema " +
  //       JSON.stringify(props.rawJzodSchema, null, 2) +
  //       // props.rawJzodSchema +
  //       " count " +
  //       count +
  //       " result " +
  //       // JSON.stringify(unfoldedRawSchemaReturnType, null, 2) +
  //       unfoldedRawSchemaReturnType +
  //       " miroirFundamentalJzodSchema " +
  //       context.miroirFundamentalJzodSchema
  //     // JSON.stringify(currentMiroirFundamentalJzodSchema, null, 2)
  //   );
  // }
  // const unfoldedRawSchema: JzodElement = unfoldedRawSchemaReturnType.element;

  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ########################## unionInformation #########################

  const [hiddenFormItems, setHiddenFormItems] = useState<{ [k: string]: boolean }>({});
  const itemsOrder: any[] = useMemo(
    () => getItemsOrder(currentValue, localResolvedElementJzodSchemaBasedOnValue),
    [localResolvedElementJzodSchemaBasedOnValue, currentValue]
  );

  // ######################### foreignKeyObjects #########################
  const foreignKeyObjectsFetchQueryParams: SyncQueryRunnerParams<DeploymentEntityState> = useMemo(
    () =>
      getQueryRunnerParamsForDeploymentEntityState(
        props.currentDeploymentUuid &&
        currentTypecheckKeyMap &&
        currentTypecheckKeyMap.rawSchema &&
        currentTypecheckKeyMap.rawSchema.type == "uuid" &&
        currentTypecheckKeyMap.rawSchema.tag?.value?.targetEntity
          ? {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              deploymentUuid: props.currentDeploymentUuid,
              pageParams: {},
              queryParams: {},
              contextResults: {},
              extractors: {
                [currentTypecheckKeyMap.rawSchema.tag?.value?.targetEntity]: {
                  extractorOrCombinerType: "extractorByEntityReturningObjectList",
                  applicationSection: getApplicationSection(
                    props.currentDeploymentUuid,
                    currentTypecheckKeyMap.rawSchema.tag?.value?.targetEntity
                  ),
                  parentName: "",
                  parentUuid: currentTypecheckKeyMap.rawSchema.tag?.value?.targetEntity,
                  orderBy: {
                    attributeName:
                      currentTypecheckKeyMap.rawSchema.tag?.value?.targetEntityOrderInstancesBy ?? "name",
                  },
                },
              },
            }
          : dummyDomainManyQueryWithDeploymentUuid,
        deploymentEntityStateSelectorMap
      ),
    [deploymentEntityStateSelectorMap, props.currentDeploymentUuid, currentTypecheckKeyMap?.rawSchema]
  );

  const foreignKeyObjects: Record<string, EntityInstancesUuidIndex> =
    useDeploymentEntityStateQuerySelectorForCleanedResult(
      deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
        DeploymentEntityState,
        Domain2QueryReturnType<DomainElementSuccess>
      >,
      foreignKeyObjectsFetchQueryParams
  );

  const typeCheckMapJzodObjectFlattenedSchema: JzodObject | undefined =
    props.typeCheckKeyMap !== undefined &&
    props.typeCheckKeyMap[props.rootLessListKey] !== undefined &&
    props.typeCheckKeyMap[props.rootLessListKey].jzodObjectFlattenedSchema !== undefined
      ? props.typeCheckKeyMap[props.rootLessListKey].jzodObjectFlattenedSchema
      : undefined;

  const typeCheckKeyMapChosenUnionBranchObjectSchema: JzodObject | undefined = // defined when rawSchema.type == "union" && resolvedElementJzodSchema.type == "object"
    props.typeCheckKeyMap !== undefined &&
    props.typeCheckKeyMap[props.rootLessListKey] !== undefined &&
    props.typeCheckKeyMap[props.rootLessListKey].chosenUnionBranchRawSchema !== undefined &&
    props.typeCheckKeyMap[props.rootLessListKey].chosenUnionBranchRawSchema?.type == "object"
      ? props.typeCheckKeyMap[props.rootLessListKey].chosenUnionBranchRawSchema as JzodObject
      : undefined;

  const undefinedOptionalAttributes: string[] = useMemo(() => {
    if (typeCheckMapJzodObjectFlattenedSchema) {
      const currentObjectAttributes = Object.keys(currentValue);
      return Object.entries(typeCheckMapJzodObjectFlattenedSchema.definition)
        .filter((a) => a[1].optional)
        .filter((a) => !currentObjectAttributes.includes(a[0]))
        .map((a) => a[0]);
    }
    if (typeCheckKeyMapChosenUnionBranchObjectSchema) {
      const currentObjectAttributes = Object.keys(currentValue);
      return Object.entries(typeCheckKeyMapChosenUnionBranchObjectSchema.definition)
        .filter((a) => a[1].optional)
        .filter((a) => !currentObjectAttributes.includes(a[0]))
        .map((a) => a[0]);
    }
    return [];
  }, [typeCheckKeyMapChosenUnionBranchObjectSchema, typeCheckMapJzodObjectFlattenedSchema, currentValue]);

  const definedOptionalAttributes: Set<string> = useMemo(() => {
    if (typeCheckMapJzodObjectFlattenedSchema) {
      const currentObjectAttributes = Object.keys(currentValue);
      return new Set(
        Object.entries(typeCheckMapJzodObjectFlattenedSchema.definition)
          .filter((a) => a[1].optional)
          .filter((a) => currentObjectAttributes.includes(a[0]))
          .map((a) => a[0])
      );
    }
    if (typeCheckKeyMapChosenUnionBranchObjectSchema) {
      const currentObjectAttributes = Object.keys(currentValue);
      return new Set(
        Object.entries(typeCheckKeyMapChosenUnionBranchObjectSchema?.definition ?? [])
          .filter((a) => a[1].optional)
          .filter((a) => currentObjectAttributes.includes(a[0]))
          .map((a) => a[0])
      );
    }
    return new Set();
  }, [typeCheckMapJzodObjectFlattenedSchema, typeCheckKeyMapChosenUnionBranchObjectSchema, currentValue]);

  const stringSelectList = useMemo(() => {
    if (
      localResolvedElementJzodSchemaBasedOnValue?.type == "uuid" &&
      localResolvedElementJzodSchemaBasedOnValue.tag?.value?.targetEntity
    ) {
      return [
        [noValue.uuid, noValue] as [string, EntityInstance],
        ...Object.entries(
          foreignKeyObjects[localResolvedElementJzodSchemaBasedOnValue.tag.value?.targetEntity] ??
            {}
        ),
      ];
    }
    return [];
  }, [localResolvedElementJzodSchemaBasedOnValue, foreignKeyObjects]);
  // log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);

  return {
    context,
    currentModel,
    miroirMetaModel,
    currentValue,
    formik,
    displayAsStructuredElement,
    setDisplayAsStructuredElement,
    codeMirrorValue,
    setCodeMirrorValue,
    codeMirrorIsValidJson,
    setCodeMirrorIsValidJson,
    deploymentEntityStateSelectorMap,
    localResolvedElementJzodSchemaBasedOnValue,
    // unfoldedRawSchema,
    foreignKeyObjects,
    // Array / Object fold / unfold state
    hiddenFormItems,
    setHiddenFormItems,
    itemsOrder,
    definedOptionalAttributes,
    stringSelectList,
    undefinedOptionalAttributes,
  };
}