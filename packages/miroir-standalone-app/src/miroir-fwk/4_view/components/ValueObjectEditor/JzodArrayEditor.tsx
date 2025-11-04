import { FormikContextType, useFormikContext } from "formik";
import { ErrorBoundary } from "react-error-boundary";
import {
  adminConfigurationDeploymentMiroir,
  ReduxDeploymentsState,
  entity,
  entityDefinition,
  EntityDefinition,
  entityEntityDefinition,
  EntityInstance,
  foldableElementTypes,
  getDefaultValueForJzodSchemaWithResolution,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  getEntityInstancesUuidIndexNonHook,
  JzodArray,
  JzodElement,
  JzodTuple,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  resolvePathOnObject,
  SyncBoxedExtractorOrQueryRunnerMap,
  miroirFundamentalJzodSchema,
  type JzodSchema,
  type MiroirModelEnvironment,
  type KeyMapEntry,
  // unfoldJzodSchemaOnce,
  // UnfoldJzodSchemaOnceReturnType,
  // UnfoldJzodSchemaOnceReturnTypeOK
} from "miroir-core";
import React, { useCallback, useMemo, useState, useEffect } from "react";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import {
  useMiroirContextService
} from "../../MiroirContextReactProvider";
import { useCurrentModel } from "../../ReduxHooks";
import { FoldUnfoldObjectOrArray, FoldUnfoldAllObjectAttributesOrArrayItems, JzodElementEditor } from "./JzodElementEditor";
import { JzodArrayEditorProps } from "./JzodElementEditorInterface";
import { getFoldedDisplayValue } from "./JzodElementEditorHooks";
import { ErrorFallbackComponent } from "../ErrorFallbackComponent";
import { 
  ThemedSizedButton, 
  ThemedAddIcon,
  ThemedStyledButton,
  ThemedFoldedValueDisplay,
  ThemedFlexRow
} from "../Themes/index"
import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { getMemoizedReduxDeploymentsStateSelectorMap, ReduxStateWithUndoRedo } from "miroir-localcache-redux";
import { useSelector } from "react-redux";
import { useReportPageContext } from "../Reports/ReportPageContext";
// import { JzodUnion } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// export const indentShift = "1em + 4px"; // TODO: centralize style
export const indentShift = "4px"; // TODO: centralize style

interface JzodArrayMoveButtonProps {
  direction: "up" | "down";
  index: number;
  itemsOrder: number[];
  listKey: string;
  rootLessListKey: string;
  reportSectionPathAsString: string;
  formik: FormikContextType<Record<string, any>>; // useFormikContext<Record<string, any>>()
  currentValue: any;
}

// ################################################################################################
export const JzodArrayEditorMoveButton: React.FC<JzodArrayMoveButtonProps> = ({
  direction,
  index,
  itemsOrder,
  listKey,
  reportSectionPathAsString,
  formik,
  currentValue,
  rootLessListKey
}) => {
  const isDisabled = direction === "up" ? index === 0 : index === itemsOrder.length - 1;

  // const handleClick = (e: React.MouseEvent) => {
  const handleClick = () => {
    const currentItemIndex: number = index;

    const newList: any[] = currentValue.slice();
    const movedItem = newList.splice(currentItemIndex, 1)[0];
    const insertAt = direction === "up" ? currentItemIndex - 1 : currentItemIndex + 1;
    newList.splice(insertAt, 0, movedItem);

    log.info(
      `JzodArrayMoveButton array moving ${direction} item`,
      currentItemIndex,
      "in object with items",
      itemsOrder,
      "newlist",
      JSON.stringify(newList, null, 2),
      "old formik.values",
      JSON.stringify(formik.values, null, 2),
    );

    formik.setFieldValue(`${reportSectionPathAsString}.${rootLessListKey}`, newList, true); // validate to trigger re-renders
  };

  return (
    <ThemedStyledButton
      variant="transparent"
      type="button"
      role={`${reportSectionPathAsString}.${rootLessListKey}.button.${direction}`}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {direction === "up" ? "^" : "v"}
    </ThemedStyledButton>
  );
};

// ################################################################################################
// Progressive Array Item Component
// ################################################################################################
interface ProgressiveArrayItemProps {
  index: number;
  listKey: string;
  rootLessListKey: string;
  rootLessListKeyArray: (string | number)[];
  reportSectionPathAsString: string;
  currentArrayElementRawDefinition: JzodElement | undefined;
  resolvedElementJzodSchema: JzodElement | undefined;
  typeCheckKeyMap?: Record<string, KeyMapEntry>;
  usedIndentLevel: number;
  currentDeploymentUuid: string | undefined;
  currentApplicationSection: string | undefined;
  foreignKeyObjects: any;
  insideAny: boolean | undefined;
  itemsOrder: number[];
  formik: FormikContextType<Record<string, any>>;
  currentValue: any;
  maxRenderDepth?: number;
  readOnly?: boolean;
  displayError?: {
    errorPath: string[];
    errorMessage: string;
  };
}

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
const ProgressiveArrayItem: React.FC<ProgressiveArrayItemProps> = ({
  index,
  listKey,
  rootLessListKey,
  rootLessListKeyArray,
  reportSectionPathAsString,
  currentArrayElementRawDefinition,
  resolvedElementJzodSchema,
  typeCheckKeyMap,
  usedIndentLevel,
  currentDeploymentUuid,
  currentApplicationSection,
  foreignKeyObjects,
  insideAny,
  itemsOrder,
  formik,
  currentValue,
  maxRenderDepth,
  readOnly,
  displayError,
}) => {
  const isTestMode = process.env.VITE_TEST_MODE === 'true';
  const [isRendered, setIsRendered] = useState(isTestMode);


  if (!isTestMode) {
    useEffect(() => {
      // Use requestIdleCallback if available, otherwise setTimeout
      const scheduleRender = () => {
        if (typeof requestIdleCallback !== "undefined") {
          requestIdleCallback(() => setIsRendered(true), { timeout: 1000 });
        } else {
          setTimeout(() => setIsRendered(true), 500);
        }
      };

      scheduleRender();
    }, []);
  }

  const itemRootLessListKey = rootLessListKey.length > 0 ? rootLessListKey + "." + index : "" + index;
  const itemListKey = listKey + "." + index;

  return (
    <div key={rootLessListKey + "." + index}>
      <div key={listKey + "." + index} style={{ marginLeft: `calc(${indentShift})` }}>
        {!isRendered ? (
          <div style={{ fontStyle: 'italic', color: '#666', padding: '4px' }}>
            Loading array item {index}...
          </div>
        ) : (
          <>
            {/* Only show move buttons in edit mode */}
            {!readOnly && (
              <>
                <JzodArrayEditorMoveButton
                  direction="down"
                  index={index}
                  itemsOrder={itemsOrder as number[]}
                  listKey={listKey}
                  rootLessListKey={rootLessListKey}
                  reportSectionPathAsString={reportSectionPathAsString}
                  formik={formik}
                  currentValue={currentValue}
                />
                <JzodArrayEditorMoveButton
                  direction="up"
                  index={index}
                  itemsOrder={itemsOrder as number[]}
                  listKey={listKey}
                  rootLessListKey={rootLessListKey}
                  reportSectionPathAsString={reportSectionPathAsString}
                  formik={formik}
                  currentValue={currentValue}
                />
              </>
            )}
            <ErrorBoundary
              FallbackComponent={({ error, resetErrorBoundary }) => (
                <ErrorFallbackComponent
                  error={error}
                  resetErrorBoundary={resetErrorBoundary}
                  context={{
                    origin: "JzodArrayEditor",
                    objectType: "array",
                    rootLessListKey: rootLessListKey.length > 0 ? rootLessListKey + "." + index : "" + index,
                    attributeRootLessListKeyArray: [...rootLessListKeyArray, "" + index],
                    attributeName: "" + index,
                    attributeListKey: listKey + "." + index,
                    currentValue: currentValue,
                    formikValues: formik.values,
                    // rawJzodSchema: currentArrayElementRawDefinition.element,
                    rawJzodSchema: currentArrayElementRawDefinition,
                    localResolvedElementJzodSchemaBasedOnValue: resolvedElementJzodSchema?.type == "array"
                      ? ((resolvedElementJzodSchema as JzodArray)?.definition as any)
                      : ((resolvedElementJzodSchema as JzodTuple).definition[index] as JzodElement),
                  }}
                />
              )}
            >
              <JzodElementEditor
                name={"" + index}
                listKey={listKey + "." + index}
                indentLevel={usedIndentLevel + 1}
                labelElement={<></>}
                currentDeploymentUuid={currentDeploymentUuid}
                currentApplicationSection={currentApplicationSection as any}
                rootLessListKey={
                  rootLessListKey.length > 0 ? rootLessListKey + "." + index : "" + index
                }
                rootLessListKeyArray={[...rootLessListKeyArray, "" + index]}
                reportSectionPathAsString={reportSectionPathAsString}
                resolvedElementJzodSchema={
                  resolvedElementJzodSchema?.type == "array"
                    ? ((resolvedElementJzodSchema as JzodArray)?.definition as any)
                    : ((resolvedElementJzodSchema as JzodTuple).definition[index] as JzodElement)
                }
                typeCheckKeyMap={ typeCheckKeyMap }
                foreignKeyObjects={foreignKeyObjects}
                insideAny={insideAny}
                maxRenderDepth={maxRenderDepth}
                readOnly={readOnly}
                displayError={displayError}
              />
            </ErrorBoundary>
          </>
        )}
      </div>
    </div>
  );
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
let jzodArrayEditorRenderCount: number = 0;
export const JzodArrayEditor: React.FC<JzodArrayEditorProps> = (
  // props: JzodArrayEditorProps
  {
    name,
    labelElement: label,
    listKey,
    rootLessListKey,
    rootLessListKeyArray,
    reportSectionPathAsString,
    resolvedElementJzodSchema,
    typeCheckKeyMap,
    currentDeploymentUuid,
    currentApplicationSection,
    indentLevel,
    foreignKeyObjects,
    itemsOrder,
    insideAny,
    displayAsStructuredElementSwitch,
    maxRenderDepth,
    readOnly,
    displayError,
  }
) => {
  jzodArrayEditorRenderCount++;
  const context = useMiroirContextService();
  
  const formik = useFormikContext<Record<string, any>>();
  const formikRootLessListKeyArray = [reportSectionPathAsString, ...rootLessListKeyArray];
  const formikRootLessListKey = formikRootLessListKeyArray.join(".");
  const currentValue = resolvePathOnObject(
    formik.values[reportSectionPathAsString],
    rootLessListKeyArray
  );
  // log.info(
  //   "############################################### JzodArrayEditor",
  //   "rootLessListKey",
  //   JSON.stringify(rootLessListKey),
  //   "reportSectionPathAsString",
  //   JSON.stringify(reportSectionPathAsString),
  //   "values",
  //   JSON.stringify(formik.values),
  //   "currentValue",
  //   currentValue,
  // );

  // log.info(
  //   "JzodArrayEditor render",
  //   jzodArrayEditorRenderCount,
  //   "name",
  //   name,
  //   "rootLessListKey",
  //   rootLessListKey,
  //   "itemsOrder",
  //   itemsOrder,
  //   "resolvedElementJzodSchema",
  //   // resolvedElementJzodSchema,
  //   JSON.stringify(resolvedElementJzodSchema, null, 2),
  //   "rawJzodSchema",
  //   JSON.stringify(rawJzodSchema, null, 2),
  // );

  const currentModel: MetaModel = useCurrentModel(currentDeploymentUuid);
  const reportContext = useReportPageContext();
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const currentMiroirModelEnvironment: MiroirModelEnvironment = useMemo(() => {
    return {
      miroirFundamentalJzodSchema: context.miroirFundamentalJzodSchema ?? (miroirFundamentalJzodSchema as JzodSchema),
      currentModel: currentModel,
      miroirMetaModel: miroirMetaModel,
    };
  }, [context.miroirFundamentalJzodSchema, currentModel, miroirMetaModel]);
  // ??
  const usedIndentLevel: number = indentLevel ?? 0;

  // const arrayValueObject = resolvePathOnObject(formik.values, rootLessListKeyArray);
  const arrayValueObject = currentValue;

  const currentTypeCheckKeyMap = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;
  // const parentKey = rootLessListKey.includes(".")
  //   ? rootLessListKey.substring(0, rootLessListKey.lastIndexOf("."))
  //   : "";
  // const parentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[parentKey] : undefined;
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
      getMemoizedReduxDeploymentsStateSelectorMap();

  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(state.presentModelSnapshot.current, () => ({}), {
        miroirFundamentalJzodSchema: context.miroirFundamentalJzodSchema??(miroirFundamentalJzodSchema as JzodSchema),
        currentModel: currentModel,
        miroirMetaModel: miroirMetaModel,
      })
  );

  const foldableItemsCount = useMemo(() => {
    return currentTypeCheckKeyMap?.resolvedSchema.type === "tuple" // for array type, the resolvedSchema is a JzodTuple
      ? (currentTypeCheckKeyMap.resolvedSchema as JzodTuple).definition.filter(
        (item: JzodElement) => foldableElementTypes.includes(item.type)
      ).length : 0
  }, [currentTypeCheckKeyMap?.resolvedSchema]);

  // ##############################################################################################
  // Get unfoldingDepth from schema tag or default to 1
  const unfoldingDepth = useMemo(() => {
    return (currentTypeCheckKeyMap?.resolvedSchema?.tag?.value?.display as any)?.unfoldSubLevels ?? 1;
  }, [currentTypeCheckKeyMap?.resolvedSchema]);

  // ##############################################################################################
  const addNewArrayItem = useCallback(
    async (e:any) => {
      e.stopPropagation();
      e.preventDefault();
      if (!currentTypeCheckKeyMap?.rawSchema || currentTypeCheckKeyMap.rawSchema.type !== "array") {
        throw new Error(
          "JzodArrayEditor addNewArrayItem called with a non-array schema: " +
            JSON.stringify(currentTypeCheckKeyMap?.rawSchema, null, 2)
        );
      }

      if (!context.miroirFundamentalJzodSchema) {
        throw new Error(
          "JzodArrayEditor addNewArrayItem called without miroirFundamentalJzodSchema: " +
            JSON.stringify(context.miroirFundamentalJzodSchema, null, 2)
        );
      }

      log.info(
        "JzodArrayEditor addNewArrayItem",
        "rootLessListKey",
        rootLessListKey,
        "currentTypeCheckKeyMap",
        currentTypeCheckKeyMap,
        "formik.values",
        formik.values,
        "currentValue",
        currentValue,
      );

      let newItemSchema: JzodElement | undefined = currentTypeCheckKeyMap?.rawSchema.definition;

      if ((currentTypeCheckKeyMap?.rawSchema as any).definition?.tag?.value?.ifThenElseMMLS?.parentUuid?.defaultValuePath) {
        const entityPath = (currentTypeCheckKeyMap?.rawSchema as any).definition?.tag?.value?.ifThenElseMMLS?.parentUuid?.defaultValuePath;
        const goUp =
          typeof  entityPath=== "string"
            ? (entityPath as string).split("#").length - 1
            : 0
        ;
        const valueObjectReferencePath = rootLessListKeyArray.slice(0, rootLessListKeyArray.length - goUp);
        const newItemEntityUuid = resolvePathOnObject(
          currentValue,// formik.values,
          valueObjectReferencePath
        )?.parentUuid;
  
        if (!newItemEntityUuid) {
          throw new Error(
            "JzodArrayEditor addNewArrayItem called without a newItemEntityUuid: " +
              JSON.stringify(newItemEntityUuid, null, 2)
          );
        }
        if (!currentDeploymentUuid) {
          throw new Error(
            "JzodArrayEditor addNewArrayItem called without a currentDeploymentUuid: " +
              JSON.stringify(currentDeploymentUuid, null, 2)
          );
        }
        const entityDefinitions  =  getEntityInstancesUuidIndexNonHook(
          deploymentEntityState,
          currentMiroirModelEnvironment,
          currentDeploymentUuid,
          entityEntityDefinition.uuid,
          "name",
        ) as any as Array<EntityDefinition>;
        const newItemEntity  =  entityDefinitions.find(
          (entityDef: EntityDefinition) => entityDef.entityUuid === newItemEntityUuid
        );

        log.info(
          "JzodArrayEditor addNewArrayItem",
          "rootLessListKey",
          rootLessListKey,
          "path",
          entityPath,
          "goUp",
          goUp,
          "currentTypeCheckKeyMap",
          currentTypeCheckKeyMap,
          "currentValueForNewItem",
          newItemEntityUuid,
          "formik.values",
          formik.values,
          "valueObjectReferencePath",
          valueObjectReferencePath,
          "currentValue",
          currentValue,
          "newItemEntityUuid",
          newItemEntityUuid,
          "entityDefinitions",
          entityDefinitions,
          "newItemEntity",
          newItemEntity,
        );
        if (!newItemEntity) {
          throw new Error(
            "JzodArrayEditor addNewArrayItem could not find entity for newItemEntityUuid: " +
              JSON.stringify(newItemEntityUuid, null, 2)
          );
        }
        newItemSchema = newItemEntity.jzodSchema;
      }

      // const newItemEntity:EntityDefinition  =  entityDefinitions[newItemEntityUuid];
      

      const newItem = getDefaultValueForJzodSchemaWithResolutionNonHook(
        "build",
        newItemSchema, // TODO: not correct with runtimeTypes
        currentValue, // formik.values,
        rootLessListKey,
        undefined, // currentDefaultValue is not known yet, this is what this call will determine
        [], // currentPath on value is root
        deploymentEntityState, // deploymentEntityState is not needed here
        false,
        currentDeploymentUuid,
        currentMiroirModelEnvironment,
        // context.miroirFundamentalJzodSchema,
        // currentModel,
        // miroirMetaModel,
        {}, // relativeReferenceJzodContext
      );
      // Create the new array value
      const newArrayValue = [
        ...arrayValueObject,
        newItem,
        // "value4",
        // "",
      ];
      log.info(
        "JzodArrayEditor addNewArrayItem setting value for",
        "rootLessListKey",
        rootLessListKey,
        "newItem",
        newItem,
        // JSON.stringify(newItem, null, 2),
        "rawJzodSchema",
        currentTypeCheckKeyMap?.rawSchema,
        // JSON.stringify(currentTypeCheckKeyMap.rawSchema, null, 2),
        "currentValue",
        currentValue,
        // "formik.values",
        // formik.values,
        // JSON.stringify(formik.values, null, 2),
        "newArrayValue",
        newArrayValue,
        // JSON.stringify(newArrayValue, null, 2),
      );

      // Update the specific field in Formik state
      // formik.setFieldValue(rootLessListKey, newArrayValue, true); // enable validation / refresh of formik component
      formik.setFieldValue(formikRootLessListKey, newArrayValue, true); // enable validation / refresh of formik component

      // // Update the items order
      // setItemsOrder(getItemsOrder(newArrayValue, resolvedElementJzodSchema));
    },
    [
      formik,
      currentTypeCheckKeyMap?.rawSchema,
      arrayValueObject,
    ]
  );
  
  // ##############################################################################################
  // Get displayed value when array/tuple is folded using the shared utility function
  const foldedDisplayValue = useMemo(() => {
    return getFoldedDisplayValue(currentTypeCheckKeyMap?.resolvedSchema, currentValue);
  }, [currentTypeCheckKeyMap?.resolvedSchema, currentValue]);

  // ##############################################################################################
  const arrayItems: JSX.Element = useMemo(
    () => (
      // const arrayItems: JSX.Element = (
      <>
        {!reportContext.isNodeFolded(rootLessListKeyArray) &&
          (itemsOrder as number[])
            .map((i: number): [number, JzodElement] => [i, arrayValueObject[i]])
            .map((attributeParam: [number, JzodElement]) => {
              const index: number = attributeParam[0];
              const attributeRootLessListKey: string =
                rootLessListKey.length > 0 ? rootLessListKey + "." + index : "" + index;
              // log.info(
              //   "JzodArrayEditor arrayItems map",
              //   "index",
              //   index,
              //   "attributeRootLessListKey",
              //   attributeRootLessListKey,
              //   "attributeValue",
              //   attributeParam[1],
              //   // JSON.stringify(attributeParam[1], null, 2),
              //   "typeCheckKeyMap",
              //   typeCheckKeyMap,
              // );
              const currentArrayElementRawDefinition: JzodElement | undefined =
                typeCheckKeyMap &&
                typeCheckKeyMap[rootLessListKey].rawSchema &&
                typeCheckKeyMap[rootLessListKey].rawSchema.type !== "any" &&
                typeCheckKeyMap[attributeRootLessListKey] &&
                typeCheckKeyMap[attributeRootLessListKey].rawSchema
                  ? typeCheckKeyMap[attributeRootLessListKey].rawSchema
                  : { type: "any" };
              // const attributeTypeCheckKeyMap = typeCheckKeyMap? typeCheckKeyMap[attributeRootLessListKey]: undefined;
              if (!currentArrayElementRawDefinition) {
                log.error(
                  "JzodArrayEditor could not find typeCheckKeyMap for attribute",
                  index,
                  "in rootLessListKey",
                  rootLessListKey,
                  "with typeCheckKeyMap",
                  typeCheckKeyMap
                  // typeCheckKeyMap?.[rootLessListKey],
                  // JSON.stringify(typeCheckKeyMap, null, 2)
                );
                throw new Error(
                  "JzodArrayEditor could not find typeCheckKeyMap for attribute " +
                    index +
                    " in rootLessListKey " +
                    rootLessListKey
                  // " with typeCheckKeyMap " +
                  // JSON.stringify(typeCheckKeyMap, null, 2)
                );
              }
              // const currentArrayElementRawDefinition: JzodElement | undefined = attributeTypeCheckKeyMap.rawSchema;
              return (
                <ProgressiveArrayItem
                  key={rootLessListKey + "." + index}
                  index={index}
                  listKey={listKey}
                  rootLessListKey={rootLessListKey}
                  rootLessListKeyArray={rootLessListKeyArray}
                  reportSectionPathAsString={reportSectionPathAsString}
                  currentArrayElementRawDefinition={currentArrayElementRawDefinition}
                  resolvedElementJzodSchema={resolvedElementJzodSchema}
                  typeCheckKeyMap={typeCheckKeyMap}
                  usedIndentLevel={usedIndentLevel}
                  currentDeploymentUuid={currentDeploymentUuid}
                  currentApplicationSection={currentApplicationSection}
                  foreignKeyObjects={foreignKeyObjects}
                  insideAny={insideAny}
                  itemsOrder={itemsOrder}
                  formik={formik}
                  currentValue={currentValue}
                  maxRenderDepth={maxRenderDepth}
                  readOnly={readOnly}
                  displayError={displayError}
                />
              );
            })}
      </>
    ),
    // );
    [
      rootLessListKey,
      formik.values,
      formikRootLessListKey,
      resolvedElementJzodSchema,
      typeCheckKeyMap,
      currentDeploymentUuid,
      currentApplicationSection,
      usedIndentLevel,
      foreignKeyObjects,
      reportContext.isNodeFolded,
      itemsOrder,
      insideAny,
      displayAsStructuredElementSwitch,
    ]
  );
  ;
  // ##############################################################################################
  return (
    <div id={rootLessListKey} key={rootLessListKey}>
      <div>
        <ThemedFlexRow justify="start" align="center">
          <span>
            <ThemedFlexRow align="center">
              {label}
              {/* Show folded display value when array is folded and a value is available */}
              {reportContext.isNodeFolded(rootLessListKeyArray) &&
                (() => {
                  return foldedDisplayValue !== null ? (
                    <ThemedFoldedValueDisplay
                      value={String(foldedDisplayValue)}
                      title={`Folded value: ${foldedDisplayValue}`}
                      maxLength={100}
                    />
                  ) : null;
                })()}
            </ThemedFlexRow>
          </span>
          <span id={rootLessListKey + "head"} key={rootLessListKey + "head"}>
            {/* Only show controls in edit mode */}
            {!readOnly && (
              <>
                <FoldUnfoldObjectOrArray
                  listKey={listKey}
                  rootLessListKeyArray={rootLessListKeyArray}
                  currentValue={currentValue}
                  unfoldingDepth={unfoldingDepth}
                ></FoldUnfoldObjectOrArray>
                <FoldUnfoldObjectOrArray
                  listKey={listKey}
                  rootLessListKeyArray={rootLessListKeyArray}
                  currentValue={currentValue}
                  unfoldingDepth={Infinity}
                ></FoldUnfoldObjectOrArray>
                {!reportContext.isNodeFolded(rootLessListKeyArray) ? (
                  <>
                    {itemsOrder.length >= 2 && foldableItemsCount > 1 ? (
                      <FoldUnfoldAllObjectAttributesOrArrayItems
                        listKey={listKey}
                        rootLessListKeyArray={rootLessListKeyArray}
                        itemsOrder={itemsOrder.map((i) => i.toString())}
                        maxDepth={maxRenderDepth ?? 1}
                      ></FoldUnfoldAllObjectAttributesOrArrayItems>
                    ) : (
                      <></>
                    )}
                    <ThemedSizedButton
                      aria-label={rootLessListKey + ".add"}
                      name={rootLessListKey + ".add"}
                      onClick={addNewArrayItem}
                      title="Add new array item"
                      style={{
                        flexShrink: 0,
                        marginLeft: "1em",
                      }}
                    >
                      <ThemedAddIcon />
                    </ThemedSizedButton>
                  </>
                ) : (
                  <></>
                )}
              </>
            )}
          </span>
          <span
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              zIndex: 2,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Only show switch in edit mode */}
            {!readOnly && (displayAsStructuredElementSwitch ?? <></>)}
          </span>
        </ThemedFlexRow>
        <div
          id={listKey + ".inner"}
          style={{
            marginLeft: `calc(${indentShift})`,
            display:
              reportContext.isNodeFolded(rootLessListKeyArray)
                ? "none"
                : "block",
          }}
          key={`${rootLessListKey}|body`}
        >
          {arrayItems}
        </div>
      </div>
    </div>
  );
};
