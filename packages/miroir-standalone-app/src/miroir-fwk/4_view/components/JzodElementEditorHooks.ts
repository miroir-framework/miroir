import { FormikProps, useFormikContext } from "formik";
import { useCallback, useMemo, useRef, useState } from "react";


import { SyncBoxedExtractorOrQueryRunnerMap, DeploymentEntityState, MetaModel, JzodElement, JzodUnion_RecursivelyUnfold_ReturnType, JzodUnion, adminConfigurationDeploymentMiroir, resolvePathOnObject, ResolvedJzodSchemaReturnType, jzodTypeCheck, unfoldJzodSchemaOnce, jzodUnion_recursivelyUnfold, LoggerInterface, MiroirLoggerFactory, Domain2QueryReturnType, DomainElementSuccess, EntityInstancesUuidIndex, SyncQueryRunner, SyncQueryRunnerParams, dummyDomainManyQueryWithDeploymentUuid, getApplicationSection, getQueryRunnerParamsForDeploymentEntityState, EntityInstance, jzodUnionResolvedTypeForObject, UnfoldJzodSchemaOnceReturnType } from "miroir-core";
import { getMemoizedDeploymentEntityStateSelectorMap } from "miroir-localcache-redux";
import { getUnionInformation } from "../1-core/getUnionInformation";
import { MiroirReactContext, useMiroirContextService } from "../MiroirContextReactProvider";
import { useCurrentModel, useDeploymentEntityStateQuerySelectorForCleanedResult } from "../ReduxHooks";
import { JzodEditorPropsRoot, noValue } from "./JzodElementEditorInterface";
import { getItemsOrder } from "./Style";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import { JzodObject } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

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
  // rootLessListKeyMap: Record<string, { resolvedElementJzodSchema: JzodElement }>
  recursivelyUnfoldedRawSchema: JzodUnion_RecursivelyUnfold_ReturnType | undefined;
  unfoldedRawSchema: JzodElement;
  // union
  discriminatedSchemaForObject: JzodObject | undefined
  unionInformation:
    | {
        jzodSchema: JzodUnion;
        objectBranches: JzodElement[];
        discriminator: string;
        discriminatorValues: string[];
      }
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

export function useJzodElementEditorHooks<P extends JzodEditorPropsRoot>(
  props: P,
  count: number, // used for debugging
  caller: string,
): JzodElementEditorHooks {
  // general use
  const context = useMiroirContextService();
  const currentModel: MetaModel = useCurrentModel(props.currentDeploymentUuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  let dbgInt = 0;
  log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);
  
  // ################################################################################################
  // codeMirror state
  const formik = useFormikContext<Record<string, any>>();
  
  const currentValue = useMemo(() => {
    return props.rootLessListKeyArray.length > 0
      ? resolvePathOnObject(formik.values, props.rootLessListKeyArray)
      : formik.values;
  }, [formik.values, props.rootLessListKeyArray]);

  const [codeMirrorValue, setCodeMirrorValue] = useState<string>(""
    // () =>
    // // "\"start!\""
    // JSON.stringify(currentValue, null, 2)
  );
  const [codeMirrorIsValidJson, setCodeMirrorIsValidJson] = useState(true);

  const [displayAsStructuredElement, setDisplayAsStructuredElement] = useState(true);
  // const [displayEditor, setDisplayEditor] = useState(true);

  log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);

  // ################################################################################################
  // ################################################################################################
  // ################################################################################################
  // ################################################################################################
  // value schema
  const localResolvedElementJzodSchemaBasedOnValue: JzodElement | undefined = useMemo(() => {
    const result = props.localRootLessListKeyMap
      ? props.localRootLessListKeyMap[props.rootLessListKey]?.resolvedElementJzodSchema
      : undefined;
      // log.info(
      //   "getJzodElementEditorHooks new localResolvedElementJzodSchemaBasedOnValue",
      //   "rootLessListKey",
      //   `'${props.rootLessListKey}'`,
      //   "props.localRootLessListKeyMap",
      //   props.localRootLessListKeyMap,
      //   "localResolvedElementJzodSchemaBasedOnValue",
      //   // result,
      //   JSON.stringify(result, null, 2),
      // );
      return result;
  }, [
    props.localRootLessListKeyMap,
    props.rootLessListKey,
  ]);

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> =
    useMemo(() => getMemoizedDeploymentEntityStateSelectorMap(), []);
  log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);

  let unfoldedRawSchemaReturnType: UnfoldJzodSchemaOnceReturnType | undefined;
  try {
    unfoldedRawSchemaReturnType = useMemo(() => {
      const result = context.miroirFundamentalJzodSchema
        ? unfoldJzodSchemaOnce(
            context.miroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
            props.rawJzodSchema,
            currentModel,
            miroirMetaModel
          )
        : undefined;
      return {
        ...result,
        valuePath: [],
        typePath: [],
      } as any;
    }, [
      props.rawJzodSchema,
      props.listKey,
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
  log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);
  if (!unfoldedRawSchemaReturnType || unfoldedRawSchemaReturnType.status == "error") {
    throw new Error(
      "JzodElementEditor could not unfold raw schema " +
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

  log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);
  const recursivelyUnfoldedRawSchema: JzodUnion_RecursivelyUnfold_ReturnType | undefined =
    useMemo(() => {
      if (
        unfoldedRawSchema &&
        unfoldedRawSchema.type == "union" &&
        context.miroirFundamentalJzodSchema
      ) {
        const result = jzodUnion_recursivelyUnfold(
          unfoldedRawSchema,
          new Set(),
          context.miroirFundamentalJzodSchema,
          currentModel,
          miroirMetaModel,
          {} // relativeReferenceJzodContext
        );
        return result;
      } else {
        return undefined;
      }
    }, [unfoldedRawSchema, context.miroirFundamentalJzodSchema, currentModel, miroirMetaModel]);

  if (recursivelyUnfoldedRawSchema && recursivelyUnfoldedRawSchema.status == "error") {
    throw new Error(
      "JzodElementEditor could not recursively unfold raw schema " +
        "error " +
        JSON.stringify(recursivelyUnfoldedRawSchema, null, 2) +
        " unfoldedRawSchema " +
        JSON.stringify(unfoldedRawSchema, null, 2) +
        " count " +
        count
    );
  }
  log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);
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
      ? getUnionInformation(
          unfoldedRawSchema,
          localResolvedElementJzodSchemaBasedOnValue,
          recursivelyUnfoldedRawSchema
        )
      : undefined;
  }, [unfoldedRawSchema, localResolvedElementJzodSchemaBasedOnValue, recursivelyUnfoldedRawSchema]);

  log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);
  // ##############################################################################################
  // state for Array / Object fold / unfold, order
  const [hiddenFormItems, setHiddenFormItems] = useState<{ [k: string]: boolean }>({});
  const itemsOrder: any[] = useMemo(
    () => getItemsOrder(currentValue, localResolvedElementJzodSchemaBasedOnValue),
    [localResolvedElementJzodSchemaBasedOnValue, currentValue]
  );

  log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);
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
  log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);

  const foreignKeyObjects: Record<string, EntityInstancesUuidIndex> =
    useDeploymentEntityStateQuerySelectorForCleanedResult(
      deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
        DeploymentEntityState,
        Domain2QueryReturnType<DomainElementSuccess>
      >,
      foreignKeyObjectsFetchQueryParams
  );

  log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);
  const discriminatedSchemaForObject: JzodObject | undefined =
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

  log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);
  // ################################# objects ###################################
  const undefinedOptionalAttributes: string[] = useMemo(() => {
    if (unfoldedRawSchema.type == "object") {
      const currentObjectAttributes = Object.keys(currentValue);
      return Object.entries(unfoldedRawSchema.definition)
        .filter((a) => a[1].optional)
        .filter((a) => !currentObjectAttributes.includes(a[0]))
        .map((a) => a[0]);
    }
    if (unfoldedRawSchema.type == "union") {
      const currentObjectAttributes = Object.keys(currentValue);
      return Object.entries(discriminatedSchemaForObject?.definition??[])
        .filter((a) => a[1].optional)
        .filter((a) => !currentObjectAttributes.includes(a[0]))
        .map((a) => a[0]);
    }
    return [];
  }, [unfoldedRawSchema, currentValue]);

  const definedOptionalAttributes: Set<string> = useMemo(() => {
    if (unfoldedRawSchema?.type == "object") {
      const currentObjectAttributes = Object.keys(currentValue);
      return new Set(
        Object.entries(unfoldedRawSchema.definition)
          .filter((a) => a[1].optional)
          .filter((a) => currentObjectAttributes.includes(a[0]))
          .map((a) => a[0])
      );
    }
    if (unfoldedRawSchema.type == "union") {
      const currentObjectAttributes = Object.keys(currentValue);
      return new Set(
        Object.entries(discriminatedSchemaForObject?.definition ?? [])
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
  log.info("getJzodElementEditorHooks ", dbgInt++, "count", count, "caller", caller);

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
    recursivelyUnfoldedRawSchema,
    unfoldedRawSchema,
    foreignKeyObjects,
    discriminatedSchemaForObject,
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