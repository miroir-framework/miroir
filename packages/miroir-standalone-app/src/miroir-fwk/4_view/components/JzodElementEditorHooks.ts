import { FormikProps, useFormikContext } from "formik";
import { useCallback, useMemo, useRef, useState } from "react";


import {
  SyncBoxedExtractorOrQueryRunnerMap,
  DeploymentEntityState,
  MetaModel,
  JzodElement,
  JzodUnion_RecursivelyUnfold_ReturnType,
  JzodUnion,
  adminConfigurationDeploymentMiroir,
  resolvePathOnObject,
  ResolvedJzodSchemaReturnType,
  jzodTypeCheck,
  unfoldJzodSchemaOnce,
  jzodUnion_recursivelyUnfold,
  LoggerInterface,
  MiroirLoggerFactory,
  Domain2QueryReturnType,
  DomainElementSuccess,
  EntityInstancesUuidIndex,
  SyncQueryRunner,
  SyncQueryRunnerParams,
  dummyDomainManyQueryWithDeploymentUuid,
  getApplicationSection,
  getQueryRunnerParamsForDeploymentEntityState,
  EntityInstance,
  jzodUnionResolvedTypeForObject,
  JzodUnionResolvedTypeReturnType,
  UnfoldJzodSchemaOnceReturnType,
  measurePerformance,
} from "miroir-core";
import { getMemoizedDeploymentEntityStateSelectorMap } from "miroir-localcache-redux";
import { getUnionInformation } from "../1-core/getUnionInformation";
import { MiroirReactContext, useMiroirContextService } from "../MiroirContextReactProvider";
import { useCurrentModel, useDeploymentEntityStateQuerySelectorForCleanedResult } from "../ReduxHooks";
import { JzodEditorPropsRoot, noValue, UnionInformation } from "./JzodElementEditorInterface";
import { getItemsOrder } from "./Style";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import { JzodObject } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { measuredUnfoldJzodSchemaOnce } from "../tools/hookPerformanceMeasure";
import { J } from "vitest/dist/chunks/environment.LoooBwUu";

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
  // recursivelyUnfoldedRawSchema: JzodUnion_RecursivelyUnfold_ReturnType | undefined;
  unfoldedRawSchema: JzodElement;
  // union
  discriminatedSchemaForObject: JzodObject | undefined
  unionInformation:
    | UnionInformation
    | undefined;
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

  const [codeMirrorValue, setCodeMirrorValue] = useState<string>("");

  const [codeMirrorIsValidJson, setCodeMirrorIsValidJson] = useState(true);

  const [displayAsStructuredElement, setDisplayAsStructuredElement] = useState(true);
  // const [displayAsStructuredElement, setDisplayAsStructuredElement] = useState(false);

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

  let unfoldedRawSchemaReturnType: UnfoldJzodSchemaOnceReturnType | undefined;
  try {
    unfoldedRawSchemaReturnType = useMemo(() => {
      const result = context.miroirFundamentalJzodSchema
        ? measurePerformance("unfoldJzodSchemaOnce", unfoldJzodSchemaOnce, 1, props.rootLessListKey, props.rawJzodSchema)(
        // ? unfoldJzodSchemaOnce(
            context.miroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
            props.rawJzodSchema,
            [], // path
            [], // unfoldingReference
            props.rawJzodSchema, // rootSchema
            0, // depth
            currentModel,
            miroirMetaModel
          )
        : undefined;
      // log.info("useJzodElementEditorHooks unfoldJzodSchemaOnce", "count", count, "done, caller", caller);
      return {
        ...result,
        valuePath: [],
        typePath: [],
      } as any;
    }, [
      props.rawJzodSchema,
      context.miroirFundamentalJzodSchema /*context.miroirFundamentalJzodSchema,*/,
      currentModel,
      miroirMetaModel,
    ]);
  } catch (e) {
    throw e as Error; // rethrow the error to be caught by the error boundary
    // log.error(
    //   "caught error upon calling unfoldJzodSchemaOnce! count",
    //   count,
    //   "key",
    //   props.rootLessListKey,
    //   "error",
    //   e
    // );
  }
  // log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);
  if (!unfoldedRawSchemaReturnType || unfoldedRawSchemaReturnType.status == "error") {
    throw new Error(
      "useJzodElementEditorHooks could not unfold raw schema " +
       "error " +
        JSON.stringify(unfoldedRawSchemaReturnType, null, 2) +
        " props.rawJzodSchema " +
        JSON.stringify(props.rawJzodSchema, null, 2) +
        // props.rawJzodSchema +
        " count " +
        count +
        " result " +
        // JSON.stringify(unfoldedRawSchemaReturnType, null, 2) +
        unfoldedRawSchemaReturnType +
        " miroirFundamentalJzodSchema " +
        context.miroirFundamentalJzodSchema
      // JSON.stringify(currentMiroirFundamentalJzodSchema, null, 2)
    );
  }
  const unfoldedRawSchema: JzodElement = unfoldedRawSchemaReturnType.element;

  // log.info(
  //   "useJzodElementEditorHooks count",
  //   count,
  //   "'" + props.rootLessListKey + "'",
  //   "unfoldJzodSchemaOnce",
  //   "unfoldedRawSchema",
  //   unfoldedRawSchema,
  //   "props.rawJzodSchema",
  //   props.rawJzodSchema,
  //   "props.resolvedElementJzodSchema",
  //   props.resolvedElementJzodSchema,
  // );
  const recursivelyUnfoldedRawSchema: JzodUnion_RecursivelyUnfold_ReturnType | undefined =
    useMemo(() => {
      if (
        unfoldedRawSchema &&
        unfoldedRawSchema.type == "union" &&
        context.miroirFundamentalJzodSchema
      ) {
        const result = measurePerformance(
          "jzodUnion_recursivelyUnfold",
          jzodUnion_recursivelyUnfold,
          1,
          props.rootLessListKey
        )(
          unfoldedRawSchema,
          new Set(),
          context.miroirFundamentalJzodSchema,
          currentModel,
          miroirMetaModel,
          {} // relativeReferenceJzodContext
        );
        // const result = jzodUnion_recursivelyUnfold(
        //   unfoldedRawSchema,
        //   new Set(),
        //   context.miroirFundamentalJzodSchema,
        //   currentModel,
        //   miroirMetaModel,
        //   {} // relativeReferenceJzodContext
        // );
        return result;
      } else {
        return undefined;
      }
    }, [unfoldedRawSchema, context.miroirFundamentalJzodSchema, currentModel, miroirMetaModel]);

  if (recursivelyUnfoldedRawSchema && recursivelyUnfoldedRawSchema.status != "ok") {
    throw new Error(
      "useJzodElementEditorHooks could not recursively unfold raw schema " +
        "error " +
        JSON.stringify(recursivelyUnfoldedRawSchema, null, 2) +
        " unfoldedRawSchema " +
        JSON.stringify(unfoldedRawSchema, null, 2) +
        " count " +
        count
    );
  }
  // log.info(
  //   "useJzodElementEditorHooks count",
  //   count,
  //   "'" + props.rootLessListKey + "'",
  //   "caller",
  //   caller,
  //   "jzodUnion_recursivelyUnfold",
  //   "recursivelyUnfoldedRawSchema",
  //   recursivelyUnfoldedRawSchema
  // );
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ##############################################################################################
  // ########################## unionInformation #########################
  const unionInformation = useMemo(() => {
    return unfoldedRawSchema.type == "union" &&
      recursivelyUnfoldedRawSchema &&
      recursivelyUnfoldedRawSchema.status == "ok"
      // ? measurePerformance("getUnionInformation", getUnionInformation, 1, props.rootLessListKey)(
      //     unfoldedRawSchema,
      //     localResolvedElementJzodSchemaBasedOnValue,
      //     recursivelyUnfoldedRawSchema
      //   )
      ? getUnionInformation(
          unfoldedRawSchema,
          localResolvedElementJzodSchemaBasedOnValue,
          recursivelyUnfoldedRawSchema
        )
      : undefined;
  }, [unfoldedRawSchema, localResolvedElementJzodSchemaBasedOnValue, recursivelyUnfoldedRawSchema]);

  // log.info("useJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);
  // ##############################################################################################
  // state for Array / Object fold / unfold, order
  const [hiddenFormItems, setHiddenFormItems] = useState<{ [k: string]: boolean }>({});
  const itemsOrder: any[] = useMemo(
    () => getItemsOrder(currentValue, localResolvedElementJzodSchemaBasedOnValue),
    [localResolvedElementJzodSchemaBasedOnValue, currentValue]
  );

  // ######################### added union Object branch attribute #########################
  // TODO: DIRTY: this is a hack to add the new attribute to the union object branch
  // the addition should be done / resolved in the formik.values, not locally
  // in that objective, the JzodElementEditor must be fast enough to allow re-rendering without issue
   const discriminatedSchemaResult: JzodUnionResolvedTypeReturnType | undefined =
     props.rawJzodSchema?.type == "union" &&
     props.rawJzodSchema.discriminator &&
     typeof currentValue == "object" &&
     context.miroirFundamentalJzodSchema
       ? jzodUnionResolvedTypeForObject(
           recursivelyUnfoldedRawSchema?.result ?? [],
           props.rawJzodSchema.discriminator,
           currentValue,
           [], // currentValuePath
           [], // currentTypePath
           context.miroirFundamentalJzodSchema,
           currentModel,
           miroirMetaModel,
           {} // relativeReferenceJzodContext
         )
       : undefined;

  const discriminatedSchemaForObject: JzodObject | undefined = 
    discriminatedSchemaResult?.status === "ok" 
      ? discriminatedSchemaResult.resolvedJzodObjectSchema 
      : undefined;

 
  // ######################### foreignKeyObjects #########################
  const foreignKeyObjectsFetchQueryParams: SyncQueryRunnerParams<DeploymentEntityState> = useMemo(
    () =>
      getQueryRunnerParamsForDeploymentEntityState(
        props.currentDeploymentUuid &&
          unfoldedRawSchema.type == "uuid" &&
          unfoldedRawSchema.tag?.value?.targetEntity
          ? {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              deploymentUuid: props.currentDeploymentUuid,
              pageParams: {},
              queryParams: {},
              contextResults: {},
              extractors: {
                [unfoldedRawSchema.tag?.value?.targetEntity]: {
                  extractorOrCombinerType: "extractorByEntityReturningObjectList",
                  applicationSection: getApplicationSection(
                    props.currentDeploymentUuid,
                    unfoldedRawSchema.tag?.value?.targetEntity
                  ),
                  parentName: "",
                  parentUuid: unfoldedRawSchema.tag?.value?.targetEntity,
                  orderBy: {
                    attributeName:
                      unfoldedRawSchema.tag?.value?.targetEntityOrderInstancesBy ?? "name",
                  },
                },
              },
            }
          : dummyDomainManyQueryWithDeploymentUuid,
        deploymentEntityStateSelectorMap
      ),
    [deploymentEntityStateSelectorMap, props.currentDeploymentUuid, unfoldedRawSchema]
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
      // log.info(
      //   "useJzodElementEditorHooks count",
      //   count,
      //   "'" + props.rootLessListKey + "'",
      //   "unfoldedRawSchema.type == 'object'",
      //   "unfoldedRawSchema",
      //   unfoldedRawSchema,
      //   "typeCheckMapJzodObjectFlattenedSchema",
      //   typeCheckMapJzodObjectFlattenedSchema !== undefined,
      //   typeCheckMapJzodObjectFlattenedSchema,
      //   "computing undefinedOptionalAttributes",
      //   "typeCheckKeyMap",
      //   props.typeCheckKeyMap
      // );

      return Object.entries(typeCheckMapJzodObjectFlattenedSchema.definition)
        .filter((a) => a[1].optional)
        .filter((a) => !currentObjectAttributes.includes(a[0]))
        .map((a) => a[0]);
    }
    if (typeCheckKeyMapChosenUnionBranchObjectSchema) {
      // log.info(
      //   "useJzodElementEditorHooks count",
      //   count,
      //   "'" + props.rootLessListKey + "'",
      //   "unfoldedRawSchema.type == 'union'",
      //   "unfoldedRawSchema",
      //   unfoldedRawSchema,
      //   "typeCheckKeyMapChosenUnionBranchObjectSchema",
      //   typeCheckKeyMapChosenUnionBranchObjectSchema !== undefined,
      //   typeCheckKeyMapChosenUnionBranchObjectSchema,
      //   "computing undefinedOptionalAttributes",
      //   "typeCheckKeyMap",
      //   props.typeCheckKeyMap
      // );

      const currentObjectAttributes = Object.keys(currentValue);
      return Object.entries(typeCheckKeyMapChosenUnionBranchObjectSchema.definition)
        .filter((a) => a[1].optional)
        .filter((a) => !currentObjectAttributes.includes(a[0]))
        .map((a) => a[0]);
    }
    return [];
  }, [unfoldedRawSchema, currentValue]);

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
  }, [unfoldedRawSchema, currentValue]);

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
    // recursivelyUnfoldedRawSchema,
    unfoldedRawSchema,
    foreignKeyObjects,
    discriminatedSchemaForObject,
    // discriminatedSchemaForObject: typeCheckKeyMapChosenUnionBranchObjectSchema,
    unionInformation,
    // Array / Object fold / unfold state
    hiddenFormItems,
    setHiddenFormItems,
    itemsOrder,
    definedOptionalAttributes,
    stringSelectList,
    undefinedOptionalAttributes,
  };
}