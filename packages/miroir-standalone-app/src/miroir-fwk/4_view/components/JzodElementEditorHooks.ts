import { FormikProps, useFormikContext } from "formik";
import { SyncBoxedExtractorOrQueryRunnerMap, DeploymentEntityState, MetaModel, JzodElement, JzodUnion_RecursivelyUnfold_ReturnType, JzodUnion, adminConfigurationDeploymentMiroir, resolvePathOnObject, ResolvedJzodSchemaReturnType, jzodTypeCheck, unfoldJzodSchemaOnce, jzodUnion_recursivelyUnfold, LoggerInterface, MiroirLoggerFactory, Domain2QueryReturnType, DomainElementSuccess, EntityInstancesUuidIndex, SyncQueryRunner, SyncQueryRunnerParams, dummyDomainManyQueryWithDeploymentUuid, getApplicationSection, getQueryRunnerParamsForDeploymentEntityState, EntityInstance } from "miroir-core";
import { getMemoizedDeploymentEntityStateSelectorMap } from "miroir-localcache-redux";
import { useEffect, useMemo, useRef, useState } from "react";
import { getUnionInformation } from "../1-core/getUnionInformation";
import { MiroirReactContext, useMiroirContextService } from "../MiroirContextReactProvider";
import { useCurrentModel, useDeploymentEntityStateQuerySelectorForCleanedResult } from "../ReduxHooks";
import { JzodEditorPropsRoot, noValue } from "./JzodElementEditorInterface";
import { getItemsOrder } from "./Style";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditorHooks")
).then((logger: LoggerInterface) => {
  log = logger;
});

// ##################################################################################################
export interface JzodElementEditorHooks {
  context: MiroirReactContext;
  deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState>;
  formik: FormikProps<Record<string, any>>;
  currentModel: MetaModel;
  localResolvedElementJzodSchemaBasedOnValue: JzodElement;
  miroirMetaModel: MetaModel;
  // unfoldedRawSchemaReturnType: ResolvedJzodSchemaReturnType | undefined;
  recursivelyUnfoldedRawSchema: JzodUnion_RecursivelyUnfold_ReturnType | undefined;
  unfoldedRawSchema: JzodElement;
  // union
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
  // any
  codeMirrorRef: React.RefObject<any>;
  codeMirrorIsValidJson: boolean;
  setCodeMirrorIsValidJson: React.Dispatch<React.SetStateAction<boolean>>;
  codeMirrorValue: string;
  setCodeMirrorValue: React.Dispatch<React.SetStateAction<string>>;
}

export function getJzodElementEditorHooks<P extends JzodEditorPropsRoot>(
  // props: JzodElementEditorProps
  props: P,
  count: number, // used for debugging
  caller: string,
  // currentValue?: any,
): JzodElementEditorHooks {
  // general use
  const context = useMiroirContextService();
  const currentModel: MetaModel = useCurrentModel(props.currentDeploymentUuid);
  const formik = useFormikContext<Record<string, any>>();
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  const currentValue = resolvePathOnObject(formik.values, props.rootLesslistKeyArray);

  const returnedLocalResolvedElementJzodSchemaBasedOnValue:
    | ResolvedJzodSchemaReturnType
    | undefined = useMemo(() => {
    const newRecordResolvedElementJzodSchema =
      props.rawJzodSchema && context.miroirFundamentalJzodSchema
        ? jzodTypeCheck(
            props.rawJzodSchema,
            currentValue,
            [], // currentValuePath
            [], // currentTypePath
            context.miroirFundamentalJzodSchema,
            currentModel,
            miroirMetaModel,
            {}
          )
        : undefined;
    return newRecordResolvedElementJzodSchema;
  }, [currentValue, props.rawJzodSchema, context.miroirFundamentalJzodSchema]);

  if (
    !returnedLocalResolvedElementJzodSchemaBasedOnValue ||
    returnedLocalResolvedElementJzodSchemaBasedOnValue.status == "error"
  ) {
    throw new Error(
      "getJzodElementEditorHooks " +
        caller +
        " could not resolve jzod schema for " +
        props.listKey +
        " count " +
        count +
        " currentValue " +
        JSON.stringify(currentValue, null, 2) +
        " rawJzodSchema " +
        JSON.stringify(props.rawJzodSchema, null, 2) +
        " returnedLocalResolvedElementJzodSchemaBasedOnValue " +
        JSON.stringify(returnedLocalResolvedElementJzodSchemaBasedOnValue, null, 2)
    );
    // return (
    //   <div>
    //     <p>
    //       Error resolving jzod schema for {props.listKey} {count}:
    //     </p>
    //     <pre style={{ color: "red" }}>
    //       {JSON.stringify(returnedLocalResolvedElementJzodSchemaBasedOnValue, null, 2)}
    //     </pre>
    //     jzod schema:{" "}
    //     <pre style={{ color: "red" }}>
    //       {JSON.stringify(props.rawJzodSchema, null, 2)}
    //     </pre>
    //   </div>
    // );
  }
  const localResolvedElementJzodSchemaBasedOnValue: JzodElement =
    returnedLocalResolvedElementJzodSchemaBasedOnValue.element;

  // ??
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> =
    useMemo(() => getMemoizedDeploymentEntityStateSelectorMap(), []);

  let unfoldedRawSchemaReturnType: ResolvedJzodSchemaReturnType | undefined;
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
    log.error(
      "caught error upon calling unfoldJzodSchemaOnce! count",
      count,
      "key",
      props.rootLesslistKey,
      "error",
      e
    );
  }
  if (!unfoldedRawSchemaReturnType || unfoldedRawSchemaReturnType.status == "error") {
    throw new Error(
      "JzodElementEditor could not unfold raw schema " +
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

  const recursivelyUnfoldedRawSchema: JzodUnion_RecursivelyUnfold_ReturnType | undefined =
    useMemo(() => {
      if (unfoldedRawSchema.type == "union" && context.miroirFundamentalJzodSchema) {
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

  // ##############################################################################################
  // state for Array / Object fold / unfold, order
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

  // ################################# objects ###################################
  const undefinedOptionalAttributes: string[] = useMemo(() => {
    if (props.resolvedElementJzodSchema?.type == "object" && unfoldedRawSchema.type == "object") {
      const currentObjectAttributes = Object.keys(currentValue);
      return Object.entries(unfoldedRawSchema.definition)
        .filter((a) => a[1].optional)
        .filter((a) => !currentObjectAttributes.includes(a[0]))
        .map((a) => a[0]);
    }
    return [];
  }, [unfoldedRawSchema, currentValue]);

  const definedOptionalAttributes: Set<string> = useMemo(() => {
    if (props.resolvedElementJzodSchema?.type == "object" && unfoldedRawSchema.type == "object") {
      const currentObjectAttributes = Object.keys(currentValue);
      return new Set(
        Object.entries(unfoldedRawSchema.definition)
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
  }, [localResolvedElementJzodSchemaBasedOnValue, foreignKeyObjectsFetchQueryParams]);

  // ##############################################################################################
  // ANY
  const codeMirrorRef = useRef<any>(null);
  const [codeMirrorIsValidJson, setCodeMirrorIsValidJson] = useState(true);
  const [codeMirrorValue, setCodeMirrorValue] = useState<string>(() =>
    JSON.stringify(currentValue, null, 2)
  );
  
  useEffect(() => {
    if (props.rawJzodSchema?.type == "any") {
      try {
        if (JSON.stringify(JSON.parse(codeMirrorValue)) !== JSON.stringify(currentValue)) {
          setCodeMirrorValue(JSON.stringify(currentValue, null, 2));
        }
      } catch {
        // ignore parse error, user is editing
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);
  
  return {
    context,
    formik,
    deploymentEntityStateSelectorMap,
    currentModel,
    // returnedLocalResolvedElementJzodSchemaBasedOnValue,
    localResolvedElementJzodSchemaBasedOnValue,
    miroirMetaModel,
    // unfoldedRawSchemaReturnType,
    recursivelyUnfoldedRawSchema,
    unfoldedRawSchema,
    // uuid
    foreignKeyObjects,
    // union
    unionInformation,
    // Array / Object fold / unfold state
    hiddenFormItems,
    setHiddenFormItems,
    itemsOrder,
    definedOptionalAttributes,
    stringSelectList,
    undefinedOptionalAttributes,
    // any
    codeMirrorRef,
    codeMirrorIsValidJson,
    setCodeMirrorIsValidJson,
    codeMirrorValue,
    setCodeMirrorValue,
  };
}