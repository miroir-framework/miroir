import { FormikContextType, useFormikContext } from "formik";
import {
  defaultSelfApplicationDeploymentMap,
  entityMLSchema,
  foldableElementTypes,
  getDefaultValueForMlSchemaWithResolutionNonHook,
  MlArray,
  MlElement,
  MlTuple,
  LoggerInterface,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  resolveMlSchemaReferenceInContext,
  resolvePathOnObject,
  findEntityFromUuid,
  SyncBoxedExtractorOrQueryRunnerMap,
  type MlPlainAttribute,
  type MlReference,
  type KeyMapEntry,
  type MiroirModelEnvironment,
  type Uuid,
} from "miroir-core";
import {
  JsonDisplayHelper,
  getMemoizedReduxDeploymentsStateSelectorMap,
  ReduxStateWithUndoRedo,
  useMiroirContextService,
  useSelector,
} from "miroir-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { useCurrentModel, useCurrentModelEnvironment, useDefaultValueParams } from "../../ReduxHooks";
import { editorNavigationKey, useTrackedRender } from "../../tools/useTrackedRender.js";
import { useViewportReveal } from "../../tools/useViewportReveal.js";
import { ErrorFallbackComponent } from "../ErrorFallbackComponent";
import {
  findPathAnnotation,
  TransformerTitleRowAnnotations,
} from "../Reports/TransformerTypeAnnotation.js";
import { RenderInsightHeader } from "../RenderInsightHeader.js";
import { useReportPageContext } from "../Reports/ReportPageContext";
import type { ValueObjectEditMode } from "../Reports/ReportSectionEntityInstance";
import {
  ThemedAddIcon,
  ThemedFlexRow,
  ThemedFoldedValueDisplay,
  ThemedSizedButton,
  ThemedStyledButton
} from "../Themes/index";
import {
  FoldUnfoldAllObjectAttributesOrArrayItems,
  FoldUnfoldObjectOrArray,
  MlElementEditor,
} from "./MlElementEditor";
import { getFoldedDisplayValue } from "./MlElementEditorHooks";
import { MlArrayEditorProps } from "./MlElementEditorInterface";
import { emptyContainerMarker } from "./renderedValueMarkers";
import { valueToJzod } from "@miroir-framework/jzod";
import { selfApplicationMiroir } from "miroir-app-miroir";
// import { MlUnion } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MlElementEditor");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// export const indentShift = "1em + 4px"; // TODO: centralize style
export const indentShift = "4px"; // TODO: centralize style

interface MlArrayMoveButtonProps {
  direction: "up" | "down";
  index: number;
  itemsOrder: any[];
  listKey: string;
  rootLessListKey: string;
  reportSectionPathAsString: string;
  formik: FormikContextType<Record<string, any>>; // useFormikContext<Record<string, any>>()
  currentValue: any;
  onChangeVector?: Record<string, (value: any, rootLessListKey: string) => void>;
}

// ################################################################################################
export const MlArrayEditorMoveButton: React.FC<MlArrayMoveButtonProps> = ({
  direction,
  index,
  itemsOrder,
  listKey,
  reportSectionPathAsString,
  formik,
  currentValue,
  rootLessListKey,
  onChangeVector
}) => {
  // Memoize the callback lookup
  const onChangeCallback = useMemo(
    () => onChangeVector?.[rootLessListKey],
    [onChangeVector, rootLessListKey]
  );
  const isDisabled = direction === "up" ? index === 0 : index === itemsOrder.length - 1;

  // const handleClick = (e: React.MouseEvent) => {
  const handleClick = () => {
    const currentItemIndex: number = index;

    const newList: any[] = currentValue.slice();
    const movedItem = newList.splice(currentItemIndex, 1)[0];
    const insertAt = direction === "up" ? currentItemIndex - 1 : currentItemIndex + 1;
    newList.splice(insertAt, 0, movedItem);

    log.info(
      `MlArrayMoveButton array moving ${direction} item`,
      currentItemIndex,
      "in object with items",
      itemsOrder,
      "newlist",
      JSON.stringify(newList, null, 2),
      "old formik.values",
      JSON.stringify(formik.values, null, 2),
    );

    // Invoke onChangeVector callback if registered for this field
    if (onChangeCallback) {
      onChangeCallback(newList, rootLessListKey);
    }
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
  valueObjectEditMode: ValueObjectEditMode;
  listKey: string;
  rootLessListKey: string;
  rootLessListKeyArray: (string | number)[];
  anyRootLessListKey: string | undefined;
  reportSectionPathAsString: string;
  // currentArrayElementRawDefinitionDEFUNCT: MlElement | undefined;
  typeCheckKeyMap?: Record<string, KeyMapEntry>;
  usedIndentLevel: number;
  currentApplication: Uuid;
  applicationDeploymentMap: Record<string, string>;
  currentDeploymentUuid: string | undefined;
  currentApplicationSection: string | undefined;
  foreignKeyObjects: any;
  insideAny: boolean;
  itemsOrder: number[];
  formik: FormikContextType<Record<string, any>>;
  currentValue: any;
  maxRenderDepth?: number;
  readOnly?: boolean;
  existingObject?: boolean;
  displayError?: {
    errorPath: string[];
    errorMessage: string;
  };
  compatibilityWarnings?: { path: (string | number)[]; title: string }[];
  showMlSchemaTypes?: boolean;
  mlSchemaTypeAnnotations?: { path: (string | number)[]; label: string }[];
  environmentAnnotations?: { path: (string | number)[]; label: string }[];
  onChangeVector?: Record<string, (value: any, rootLessListKey: string) => void>;
  removeItemAtIndex?: (index: number) => void;
  duplicateItemAtIndex?: (index: number) => void;
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
  // currentArrayElementRawDefinitionDEFUNCT,
  typeCheckKeyMap,
  usedIndentLevel,
  currentDeploymentUuid,
  currentApplicationSection,
  foreignKeyObjects,
  insideAny,
  anyRootLessListKey,
  itemsOrder,
  formik,
  currentValue,
  maxRenderDepth,
  readOnly,
  existingObject,
  displayError,
  compatibilityWarnings,
  showMlSchemaTypes,
  mlSchemaTypeAnnotations,
  environmentAnnotations,
  onChangeVector,
  removeItemAtIndex,
  duplicateItemAtIndex,
  ...props
}) => {
  // Viewport-gated — same policy as ProgressiveAttribute.
  const { ref: viewportRef, revealed: isRendered } = useViewportReveal();

  const itemRootLessListKey = rootLessListKey.length > 0 ? rootLessListKey + "." + index : "" + index;
  const itemListKey = listKey + "." + index;

  return (
    <div key={rootLessListKey + "." + index} ref={viewportRef}>
      <div key={listKey + "." + index} style={{ marginLeft: `calc(${indentShift})` }}>
        {!isRendered ? (
          <div style={{ fontStyle: "italic", color: "#666", padding: "4px" }}>
            Loading array item {index}...
          </div>
        ) : (
          <>
            {/* Only show move buttons in edit mode */}
            {!readOnly && (
              <>
                <MlArrayEditorMoveButton
                  direction="down"
                  index={index}
                  itemsOrder={itemsOrder as number[]}
                  listKey={listKey}
                  rootLessListKey={rootLessListKey}
                  reportSectionPathAsString={reportSectionPathAsString}
                  formik={formik}
                  currentValue={currentValue}
                  onChangeVector={onChangeVector}
                />
                <MlArrayEditorMoveButton
                  direction="up"
                  index={index}
                  itemsOrder={itemsOrder as number[]}
                  listKey={listKey}
                  rootLessListKey={rootLessListKey}
                  reportSectionPathAsString={reportSectionPathAsString}
                  formik={formik}
                  currentValue={currentValue}
                  onChangeVector={onChangeVector}
                />
                {removeItemAtIndex && (
                  <ThemedStyledButton
                    variant="transparent"
                    type="button"
                    aria-label={reportSectionPathAsString + "." + itemRootLessListKey + "-removeArrayItem"}
                    onClick={() => removeItemAtIndex(index)}
                    title="Remove array item"
                  >
                    ×
                  </ThemedStyledButton>
                )}
                {duplicateItemAtIndex && (
                  <ThemedStyledButton
                    variant="transparent"
                    type="button"
                    aria-label={reportSectionPathAsString + "." + itemRootLessListKey + "-duplicateArrayItem"}
                    onClick={() => duplicateItemAtIndex(index)}
                    title="Duplicate array item"
                  >
                    ⧉
                  </ThemedStyledButton>
                )}
              </>
            )}
            <ErrorBoundary
              FallbackComponent={({ error, resetErrorBoundary }) => (
                <ErrorFallbackComponent
                  error={error}
                  resetErrorBoundary={resetErrorBoundary}
                  context={{
                    origin: "MlArrayEditor",
                    objectType: "array",
                    rootLessListKey:
                      rootLessListKey.length > 0 ? rootLessListKey + "." + index : "" + index,
                    attributeRootLessListKeyArray: [...rootLessListKeyArray, "" + index],
                    attributeName: "" + index,
                    attributeListKey: listKey + "." + index,
                    currentValue: currentValue,
                    formikValues: formik.values,
                    // rawMlSchema: currentArrayElementRawDefinition.element,
                    // rawMlSchema: currentArrayElementRawDefinitionDEFUNCT,
                  }}
                />
              )}
            >
              <JsonDisplayHelper debug={true}
                componentName="ProgressiveArrayItem"
                elements={[{
                  label: `ProgressiveArrayItem rendering item at ${itemRootLessListKey}`,
                  data: { itemRootLessListKey },
                  useCodeBlock: true,
                }]}
              />
              <MlElementEditor
                name={"" + index}
                valueObjectEditMode={props.valueObjectEditMode}
                listKey={listKey + "." + index}
                indentLevel={usedIndentLevel + 1}
                labelElement={<></>}
                currentApplication={props.currentApplication}
                applicationDeploymentMap={props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap}
                currentDeploymentUuid={currentDeploymentUuid}
                currentApplicationSection={currentApplicationSection as any}
                rootLessListKey={
                  rootLessListKey.length > 0 ? rootLessListKey + "." + index : "" + index
                }
                rootLessListKeyArray={[...rootLessListKeyArray, "" + index]}
                reportSectionPathAsString={reportSectionPathAsString}
                typeCheckKeyMap={typeCheckKeyMap}
                foreignKeyObjects={foreignKeyObjects}
                insideAny={insideAny}
                anyRootLessListKey={anyRootLessListKey}
                maxRenderDepth={maxRenderDepth}
                readOnly={readOnly}
                existingObject={existingObject}
                displayError={displayError}
                compatibilityWarnings={compatibilityWarnings}
                showMlSchemaTypes={showMlSchemaTypes}
                mlSchemaTypeAnnotations={mlSchemaTypeAnnotations}
                environmentAnnotations={environmentAnnotations}
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
let mlArrayEditorRenderCount: number = 0;
export const MlArrayEditor: React.FC<MlArrayEditorProps> = (
  // props: MlArrayEditorProps
  {
    name,
    labelElement: label,
    listKey,
    rootLessListKey,
    rootLessListKeyArray,
    reportSectionPathAsString,
    typeCheckKeyMap,
    currentDeploymentUuid,
    currentApplicationSection,
    indentLevel,
    foreignKeyObjects,
    itemsOrder,
    insideAny,
    displayAsStructuredElementSwitch,
    extraToolsButtons,
    maxRenderDepth,
    readOnly,
    existingObject,
    displayError,
    compatibilityWarnings,
    showMlSchemaTypes,
    mlSchemaTypeAnnotations,
    environmentAnnotations,
    onChangeVector,
    ...props
  }
) => {
  mlArrayEditorRenderCount++;
  const context = useMiroirContextService();
  const trackedRender = useTrackedRender(
    editorNavigationKey(currentDeploymentUuid, currentApplicationSection),
  );
  
  const formik = useFormikContext<Record<string, any>>();
  const formikRootLessListKeyArray = [reportSectionPathAsString, ...rootLessListKeyArray];
  const formikRootLessListKey = formikRootLessListKeyArray.join(".");

  // Memoize the onChangeVector callback for this field to avoid repeated lookups
  const onChangeCallback = useMemo(
    () => onChangeVector?.[rootLessListKey],
    [onChangeVector, rootLessListKey]
  );

  // current value & type
  const currentValue = resolvePathOnObject(
    formik.values[reportSectionPathAsString],
    rootLessListKeyArray
  );

  const currentTypeCheckKeyMap =  typeCheckKeyMap
    ? typeCheckKeyMap[rootLessListKey]
    : undefined;

  const currentRawMlSchema: MlElement | undefined = insideAny ? { type: "any" } : currentTypeCheckKeyMap?.rawSchema;
  const localResolvedElementMlSchemaBasedOnValue: MlElement | undefined = useMemo(
    () => {
      if (insideAny) {
        return valueToJzod(currentValue) as MlElement;
      }
      if (currentTypeCheckKeyMap?.resolvedSchema) {
        return currentTypeCheckKeyMap.resolvedSchema;
      }
      if (currentValue !== undefined && currentValue !== null) {
        return valueToJzod(currentValue) as MlElement;
      }
      return undefined;
    },
    [currentTypeCheckKeyMap, currentValue]
  );

  const reportContext = useReportPageContext();
  const currentMiroirModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    currentDeploymentUuid ?? selfApplicationMiroir.uuid,
    props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap
  );
  const defaultValueParams = useDefaultValueParams(
    props.currentApplication,
    currentDeploymentUuid
  );
  const usedIndentLevel: number = indentLevel ?? 0;

  const arrayValueObject = currentValue;

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
      getMemoizedReduxDeploymentsStateSelectorMap();

  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        props.applicationDeploymentMap,
        () => ({}),
        currentMiroirModelEnvironment
      )
  );

  const foldableItemsCount = useMemo(() => {
    return localResolvedElementMlSchemaBasedOnValue?.type === "tuple" // for array type, the resolvedSchema is a MlTuple
      ? (localResolvedElementMlSchemaBasedOnValue as MlTuple).definition.filter(
        (item: MlElement) => foldableElementTypes.includes(item.type)
      ).length : 0
  }, [localResolvedElementMlSchemaBasedOnValue]);

  // ##############################################################################################
  // Get unfoldingDepth from schema tag or default to 1
  const unfoldingDepth = useMemo(() => {
    return (localResolvedElementMlSchemaBasedOnValue?.tag?.value?.display as any)?.unfoldSubLevels ?? 1;
  }, [localResolvedElementMlSchemaBasedOnValue]);

  // ##############################################################################################
  const addNewArrayItem = useCallback(
    async (e:any) => {
      e.stopPropagation();
      e.preventDefault();
      let schema: MlElement | undefined = currentRawMlSchema;

      if (schema?.type === "schemaReference") {
        schema = resolveMlSchemaReferenceInContext(
          schema as MlReference,
          {},
          currentMiroirModelEnvironment
        );
      }

      if (!currentRawMlSchema || !["array", "any"].includes(currentRawMlSchema.type)) {
        throw new Error(
          "MlArrayEditor addNewArrayItem called with a non-array / non-any schema: " +
            JSON.stringify(currentRawMlSchema, null, 2)
        );
      }

      if (!currentMiroirModelEnvironment.miroirFundamentalMlSchema) {
        throw new Error(
          "MlArrayEditor addNewArrayItem called without miroirFundamentalMlSchema: " +
            JSON.stringify(currentMiroirModelEnvironment.miroirFundamentalMlSchema, null, 2)
        );
      }

      log.info(
        "MlArrayEditor addNewArrayItem",
        "rootLessListKey",
        rootLessListKey,
        "currentTypeCheckKeyMap",
        currentTypeCheckKeyMap,
        "formik.values",
        formik.values,
        "currentValue",
        currentValue,
      );

      let newItemSchema: MlElement | undefined = insideAny?{ type: "string"}:(schema as any)?.definition;

      if ((schema as any).definition?.tag?.value?.ifThenElseMMLS?.parentUuid?.defaultValuePath) {
        const entityPath = (schema as any).definition?.tag?.value?.ifThenElseMMLS?.parentUuid?.defaultValuePath;
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
            "MlArrayEditor addNewArrayItem called without a newItemEntityUuid: " +
              JSON.stringify(newItemEntityUuid, null, 2)
          );
        }
        if (!currentDeploymentUuid) {
          throw new Error(
            "MlArrayEditor addNewArrayItem called without a currentDeploymentUuid: " +
              JSON.stringify(currentDeploymentUuid, null, 2)
          );
        }
        const newItemEntity = findEntityFromUuid(
          currentMiroirModelEnvironment.currentModel,
          newItemEntityUuid,
        );

        log.info(
          "MlArrayEditor addNewArrayItem",
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
          "newItemEntity",
          newItemEntity,
        );
        if (!newItemEntity) {
          throw new Error(
            "MlArrayEditor addNewArrayItem could not find entity for newItemEntityUuid: " +
              JSON.stringify(newItemEntityUuid, null, 2)
          );
        }
        newItemSchema = entityMLSchema(newItemEntity);
      }

      
      const newItem = getDefaultValueForMlSchemaWithResolutionNonHook(
        "build",
        newItemSchema ?? { type: "string" }, // TODO: not correct with runtimeTypes
        currentValue, // formik.values,
        rootLessListKey,
        undefined, // currentDefaultValue is not known yet, this is what this call will determine
        [], // currentPath on value is root
        false,
        props.currentApplication,
        props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
        currentDeploymentUuid,
        currentMiroirModelEnvironment,
        defaultValueParams, // transformerParams
        {}, // contextResults
        deploymentEntityState, // deploymentEntityState is not needed here
        {}, // relativeReferenceMlContext
      );
      // Create the new array value
      const newArrayValue = [
        ...arrayValueObject,
        newItem,
        // "value4",
        // "",
      ];
      log.info(
        "MlArrayEditor addNewArrayItem setting value for",
        "rootLessListKey",
        rootLessListKey,
        "newItem",
        newItem,
        // JSON.stringify(newItem, null, 2),
        "rawMlSchema",
        currentRawMlSchema,
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
      // Invoke onChangeVector callback if registered for this field
      if (onChangeVector?.[rootLessListKey]) {
        onChangeVector[rootLessListKey](newArrayValue, rootLessListKey);
      }
      formik.setFieldValue(formikRootLessListKey, newArrayValue, true); // enable validation / refresh of formik component

      reportContext.unfoldAllChildren(rootLessListKeyArray, Object.keys(newItem));
    },
    [
      formik,
      currentRawMlSchema,
      arrayValueObject,
      onChangeCallback,
      rootLessListKey,
      formikRootLessListKey,
    ]
  );
  
  // ##############################################################################################
  const removeItemAtIndex = useCallback(
    (index: number) => {
      const arr = [...(arrayValueObject as any[])];
      const numIndex = typeof index === "string" ? parseInt(index, 10) : index;
      const newArrayValue = arr.filter((_: any, i: number) => i !== numIndex);
      if (onChangeVector?.[rootLessListKey]) {
        onChangeVector[rootLessListKey](newArrayValue, rootLessListKey);
      }
      formik.setFieldValue(formikRootLessListKey, newArrayValue, true);
    },
    [arrayValueObject, formik, formikRootLessListKey, onChangeVector, rootLessListKey]
  );

  // ##############################################################################################
  const duplicateItemAtIndex = useCallback(
    (index: number) => {
      const arr = [...(arrayValueObject as any[])];
      const numIndex = typeof index === "string" ? parseInt(index, 10) : index;
      const itemToDuplicate = arr[numIndex];
      const duplicate =
        typeof itemToDuplicate === "object" && itemToDuplicate !== null
          ? JSON.parse(JSON.stringify(itemToDuplicate))
          : itemToDuplicate;
      const newArrayValue = [...arr.slice(0, numIndex + 1), duplicate, ...arr.slice(numIndex + 1)];
      if (onChangeVector?.[rootLessListKey]) {
        onChangeVector[rootLessListKey](newArrayValue, rootLessListKey);
      }
      formik.setFieldValue(formikRootLessListKey, newArrayValue, true);
    },
    [arrayValueObject, formik, formikRootLessListKey, onChangeVector, rootLessListKey]
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
            .map((i: number): [number, MlElement] => [i, arrayValueObject[i]])
            .map((attributeParam: [number, MlElement]) => {
              const index: number = attributeParam[0];
              const attributeRootLessListKey: string =
                rootLessListKey.length > 0 ? rootLessListKey + "." + index : "" + index;
              // log.info(
              //   "MlArrayEditor arrayItems map",
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
              // const currentArrayElementRawDefinitionDEFUNCT: MlElement | undefined =
              //   typeCheckKeyMap &&
              //   typeCheckKeyMap[rootLessListKey]?.rawSchema &&
              //   typeCheckKeyMap[rootLessListKey]?.rawSchema.type !== "any" &&
              //   typeCheckKeyMap[attributeRootLessListKey] &&
              //   typeCheckKeyMap[attributeRootLessListKey]?.rawSchema
              //     ? typeCheckKeyMap[attributeRootLessListKey]?.rawSchema
              //     : { type: "any" };
              // // const attributeTypeCheckKeyMap = typeCheckKeyMap? typeCheckKeyMap[attributeRootLessListKey]: undefined;
              // if (!currentArrayElementRawDefinitionDEFUNCT) {
              //   log.error(
              //     "MlArrayEditor could not find typeCheckKeyMap for attribute",
              //     index,
              //     "in rootLessListKey",
              //     rootLessListKey,
              //     "with typeCheckKeyMap",
              //     typeCheckKeyMap
              //     // typeCheckKeyMap?.[rootLessListKey],
              //     // JSON.stringify(typeCheckKeyMap, null, 2)
              //   );
              //   throw new Error(
              //     "MlArrayEditor could not find typeCheckKeyMap for attribute " +
              //       index +
              //       " in rootLessListKey " +
              //       rootLessListKey
              //     // " with typeCheckKeyMap " +
              //     // JSON.stringify(typeCheckKeyMap, null, 2)
              //   );
              // }
              // const currentArrayElementRawDefinition: MlElement | undefined = attributeTypeCheckKeyMap.rawSchema;
              return (
                <ProgressiveArrayItem
                  key={rootLessListKey + "." + index}
                  index={index}
                  listKey={listKey}
                  rootLessListKey={rootLessListKey}
                  rootLessListKeyArray={rootLessListKeyArray}
                  reportSectionPathAsString={reportSectionPathAsString}
                  // currentArrayElementRawDefinitionDEFUNCT={currentArrayElementRawDefinitionDEFUNCT}
                  typeCheckKeyMap={typeCheckKeyMap}
                  usedIndentLevel={usedIndentLevel}
                  currentApplication={props.currentApplication}
                  applicationDeploymentMap={props.applicationDeploymentMap}
                  currentDeploymentUuid={currentDeploymentUuid}
                  currentApplicationSection={currentApplicationSection}
                  foreignKeyObjects={foreignKeyObjects}
                  insideAny={insideAny}
                  anyRootLessListKey={props.anyRootLessListKey}
                  itemsOrder={itemsOrder}
                  formik={formik}
                  currentValue={currentValue}
                  maxRenderDepth={maxRenderDepth}
                  readOnly={readOnly}
                  valueObjectEditMode={props.valueObjectEditMode}
                  
                  displayError={displayError}
                compatibilityWarnings={compatibilityWarnings}
                showMlSchemaTypes={showMlSchemaTypes}
                mlSchemaTypeAnnotations={mlSchemaTypeAnnotations}
                environmentAnnotations={environmentAnnotations}
                  onChangeVector={onChangeVector}
                  removeItemAtIndex={!readOnly || insideAny ? removeItemAtIndex : undefined}
                  duplicateItemAtIndex={!readOnly ? duplicateItemAtIndex : undefined}
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
      typeCheckKeyMap,
      currentDeploymentUuid,
      currentApplicationSection,
      usedIndentLevel,
      foreignKeyObjects,
      reportContext.isNodeFolded,
      itemsOrder,
      insideAny,
      displayAsStructuredElementSwitch,
      removeItemAtIndex,
      duplicateItemAtIndex,
      compatibilityWarnings,
      showMlSchemaTypes,
      mlSchemaTypeAnnotations,
      environmentAnnotations,
    ]
  );
  ;
  // ##############################################################################################
  // The declared type decides (arrays resolve to tuples by value); resolved type only under any / unions.
  const declaredType = currentTypeCheckKeyMap?.rawSchema?.type ?? currentRawMlSchema?.type;
  const schemaType =
    declaredType === "array" || declaredType === "tuple"
      ? declaredType
      : localResolvedElementMlSchemaBasedOnValue?.type ??
        currentTypeCheckKeyMap?.resolvedSchema?.type ??
        currentRawMlSchema?.type;
  const insightRole = schemaType === "tuple" ? "tuple" : "array";
  const insightComponentId =
    insightRole === "tuple" ? "MlTupleEditor" : "MlArrayEditor";
  // Sync accrual: chips need live counts; progressive mount limits fan-out.
  const insightCounts = trackedRender.end(insightComponentId, formikRootLessListKey);

  const titleRowWarning = findPathAnnotation(compatibilityWarnings, rootLessListKeyArray);

  return (
    <div
      id={rootLessListKey}
      key={rootLessListKey}
      {...emptyContainerMarker("array", formikRootLessListKey, Array.isArray(currentValue) && currentValue.length === 0)}
    >
      <JsonDisplayHelper debug={true}
        componentName="MlArrayEditor"
        elements={[{
          label: `Rendering MlArrayEditor for array at ${rootLessListKey || "ROOT"}`,
          data: { rootLessListKey, readOnly, currentTypeCheckKeyMap },
          copyButton: true,
          useCodeBlock: true,
        }]}
      />
      <div>
        <ThemedFlexRow justify="start" align="center">
          {context.showPerformanceDisplay && (
            <RenderInsightHeader
              componentName={insightRole}
              navigationCount={insightCounts.navigationCount}
              totalCount={insightCounts.totalCount}
              formikPath={formikRootLessListKey}
              lastRenderTime={insightCounts.lastRenderTime}
            />
          )}
          <span>
            <ThemedFlexRow align="center">
              {label}
              <TransformerTitleRowAnnotations
                path={rootLessListKeyArray}
                skipRoot
                showMlSchemaTypes={showMlSchemaTypes}
                mlSchemaTypeAnnotations={mlSchemaTypeAnnotations}
                environmentAnnotations={environmentAnnotations}
                inadequate={!!titleRowWarning}
                inadequateTitle={titleRowWarning?.title}
              />
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
                {!reportContext.isNodeFolded(rootLessListKeyArray) && (
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
                  </>
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
            {extraToolsButtons ?? <></>}
            {/* Only show switch in edit mode */}
            {!readOnly && (displayAsStructuredElementSwitch ?? <></>)}
          </span>
        </ThemedFlexRow>
        <div
          id={listKey + ".inner"}
          style={{
            marginLeft: `calc(${indentShift})`,
            display: reportContext.isNodeFolded(rootLessListKeyArray) ? "none" : "block",
          }}
          key={`${rootLessListKey}|body`}
        >
          {/* <ThemedOnScreenDebug
            label={`MlArrayEditor rendering items for array at ${rootLessListKey || "ROOT"}`}
            data={{ 
              rootLessListKey,
              typeCheckKeyMap,
              // resolvedElementMlSchema,
             }}
            copyButton={true}
            initiallyUnfolded={false}
            useCodeBlock={true}
          /> */}
          {arrayItems}
        </div>
      </div>
    </div>
  );
};
