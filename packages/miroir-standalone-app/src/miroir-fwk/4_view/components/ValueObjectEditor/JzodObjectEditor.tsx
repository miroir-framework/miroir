import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Clear } from "../Themes/MaterialSymbolWrappers";

import {
  alterObjectAtPath,
  ApplicationSection,
  defaultMetaModelEnvironment,
  deleteObjectAtPath,
  EntityInstancesUuidIndex,
  foldableElementTypes,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  JzodElement,
  JzodObject,
  JzodRecord,
  KeyMapEntry,
  LoggerInterface,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  resolvePathOnObject,
  SyncBoxedExtractorOrQueryRunnerMap,
  transformer_extended_apply_wrapper,
  Uuid,
  type TransformerReturnType
} from "miroir-core";

import { BlobEditorField } from "./BlobEditorField";

import { getMemoizedReduxDeploymentsStateSelectorMap, ReduxStateWithUndoRedo } from "miroir-localcache-redux";
import { useSelector } from "react-redux";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import {
  measuredUnfoldJzodSchemaOnce
} from "../../tools/hookPerformanceMeasure";
import { ErrorFallbackComponent } from "../ErrorFallbackComponent";
import { useReportPageContext } from "../Reports/ReportPageContext";
import { ThemedOnScreenDebug } from "../Themes/BasicComponents";
import {
  ThemedAddIcon,
  ThemedAttributeLabel,
  ThemedAttributeName,
  ThemedDeleteButtonContainer,
  ThemedEditableInput,
  ThemedFlexRow,
  ThemedFoldedValueDisplay,
  ThemedLoadingCard,
  ThemedOptionalAttributeContainer,
  ThemedOptionalAttributeItem,
  ThemedSizedButton,
  ThemedSmallIconButton
} from "../Themes/index";
import { FoldUnfoldAllObjectAttributesOrArrayItems, FoldUnfoldObjectOrArray, JzodElementEditor } from "./JzodElementEditor";
import { getFoldedDisplayValue, useJzodElementEditorHooks } from "./JzodElementEditorHooks";
import { JzodObjectEditorProps } from "./JzodElementEditorInterface";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

// Performance tracking for unfoldJzodSchemaOnce - legacy approach
let totalUnfoldTime = 0;
let unfoldCallCount = 0;

// Editable attribute name component with local state management
// const EditableAttributeName = React.memo(({
const EditableAttributeName: FC<{
  initialValue: string;
  onCommit: (newValue: string) => void;
  rootLessListKey: string;
  formikRootLessListKey: string;
}> = ({
  initialValue,
  onCommit,
  rootLessListKey,
  formikRootLessListKey,
}: {
  initialValue: string;
  onCommit: (newValue: string) => void;
  rootLessListKey: string;
  formikRootLessListKey: string;
}) => {
  const [localValue, setLocalValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  const handleCommit = useCallback(() => {
    if (localValue.trim() && localValue !== initialValue) {
      onCommit(localValue.trim());
    } else if (!localValue.trim()) {
      // Reset to original if empty
      setLocalValue(initialValue);
    }
    setIsEditing(false);
  }, [localValue, initialValue, onCommit]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleCommit();
      } else if (event.key === "Escape") {
        setLocalValue(initialValue);
        setIsEditing(false);
      }
    },
    [handleCommit, initialValue]
  );

  // Update local value if the initial value changes (external update)
  React.useEffect(() => {
    if (!isEditing) {
      setLocalValue(initialValue);
    }
  }, [initialValue, isEditing]);

  return (
    <ThemedEditableInput
      value={localValue}
      name={formikRootLessListKey + "-NAME"}
      aria-label={formikRootLessListKey + "-NAME"}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={() => setIsEditing(true)}
      onBlur={handleCommit}
      onKeyDown={handleKeyDown}
      minWidth={60}
      dynamicWidth={true}
    />
  );
};

// ################################################################################################
// Progressive Attribute Component for asynchronous rendering
const ProgressiveAttribute: FC<{
  attribute: [string, JzodElement];
  attributeNumber: number;
  listKey: string;
  rootLessListKey: string;
  rootLessListKeyArray: (string | number)[];
  formikRootLessListKey: string;
  formikRootLessListKeyArray: (string | number)[];
  reportSectionPathAsString: string;
  localResolvedElementJzodSchemaBasedOnValue: JzodObject;
  // unfoldedRawSchema: any;
  typeCheckKeyMap?: Record<string, KeyMapEntry>;
  currentValue: any;
  usedIndentLevel: number;
  definedOptionalAttributes: Set<string>;
  onChangeVector?: Record<string, (newValue: any, rootLessListKey: string) => void>;
  handleAttributeNameChange: (newValue: string, attributeRootLessListKeyArray: (string | number)[]) => void;
  deleteElement: (formikRootLessListKeyArray: (string | number)[]) => () => void;
  hideOptionalButton?: boolean;
  formik: any;
  currentMiroirFundamentalJzodSchema: any;
  currentModel: any;
  miroirMetaModel: any;
  measuredUnfoldJzodSchemaOnce: any;
  // Add direct props from JzodObjectEditorProps that are used
  currentDeploymentUuid?: Uuid;
  currentApplicationSection?: ApplicationSection;
  foreignKeyObjects: Record<string, EntityInstancesUuidIndex>;
  insideAny?: boolean;
  maxRenderDepth?: number;
  readOnly?: boolean;
  existingObject?: boolean;

  displayError?: {
    errorPath: string[];
    errorMessage: string;
  };
}> = ({
  attribute,
  attributeNumber,
  listKey,
  rootLessListKey,
  rootLessListKeyArray,
  formikRootLessListKey,
  formikRootLessListKeyArray,
  reportSectionPathAsString,
  localResolvedElementJzodSchemaBasedOnValue,
  // unfoldedRawSchema,
  typeCheckKeyMap,
  currentValue,
  usedIndentLevel,
  definedOptionalAttributes,
  onChangeVector,
  handleAttributeNameChange,
  deleteElement,
  hideOptionalButton,
  formik,
  currentMiroirFundamentalJzodSchema,
  currentModel,
  miroirMetaModel,
  measuredUnfoldJzodSchemaOnce,
  maxRenderDepth,
  readOnly,
  existingObject,
  // Direct props
  currentDeploymentUuid,
  currentApplicationSection,
  foreignKeyObjects,
  insideAny,
  displayError,
}) => {
  const isTestMode = process.env.VITE_TEST_MODE === 'true';
  const [isRendered, setIsRendered] = useState(isTestMode);
  
  if (!isTestMode) {
    useEffect(() => {
      // Use requestIdleCallback for better performance, fallback to setTimeout
      const scheduleRender = () => {
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => setIsRendered(true), { timeout: 1000 });
        } else {
          setTimeout(() => setIsRendered(true), 500);
        }
      };
      
      scheduleRender();
    }, []); // Empty dependency array to run once on mount
  }

  const currentAttributeDefinition = localResolvedElementJzodSchemaBasedOnValue.definition[attribute[0]];
  const attributeListKey = listKey + "." + attribute[0];
  const formikAttributeRootLessListKey = formikRootLessListKey.length > 0 ? formikRootLessListKey + "." + attribute[0] : attribute[0];
  const attributeRootLessListKey = rootLessListKey.length > 0 ? rootLessListKey + "." + attribute[0] : attribute[0];
  const attributeRootLessListKeyArray: (string | number)[] =
    rootLessListKeyArray.length > 0 ? [...rootLessListKeyArray, attribute[0]] : [attribute[0]];
  const formikAttributeRootLessListKeyArray: (string | number)[] =
    formikRootLessListKeyArray.length > 0 ? [...formikRootLessListKeyArray, attribute[0]] : [attribute[0]];

  const currentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;

  // log.info(
  //   "ProgressiveAttribute",
  //   "attribute",
  //   attribute,
  //   "attributeRootLessListKey",
  //   JSON.stringify(attributeRootLessListKey),
  //   "attributeRootLessListKeyArray",
  //   JSON.stringify(attributeRootLessListKeyArray),
  //   "currentKeyMap", currentKeyMap,
  //   "reportSectionPathAsString", reportSectionPathAsString
  // )


  if (!currentKeyMap?.rawSchema) {
    throw new Error(
      "JzodElementEditor currentKeyMap?.rawSchema undefined for object " +
        listKey +
        " attribute " +
        attribute[0] +
        " attributeListKey " +
        attributeListKey
    );
  }


  // Determine if this is a record type where attribute names should be editable
  const isRecordType = currentKeyMap?.rawSchema?.type === "record";
  const editableLabel = isRecordType ? (
    <EditableAttributeName
      initialValue={attribute[0]}
      rootLessListKey={attributeRootLessListKey}
      formikRootLessListKey={formikAttributeRootLessListKey}
      onCommit={(newValue) => handleAttributeNameChange(newValue, formikAttributeRootLessListKeyArray)}
    />
  ) : (
    <ThemedAttributeLabel
      id={attributeRootLessListKey + ".label"}
      key={attributeRootLessListKey + ".label"}
      data-testid="miroirDisplayedValue"
    >
      {currentAttributeDefinition?.tag?.value?.defaultLabel || attribute[0]}
    </ThemedAttributeLabel>
  );

  return (
    <div key={attributeListKey}>
      {!isRendered ? (
        <ThemedLoadingCard message={`Loading ${attribute[0]}...`} />
      ) : (
        <ErrorBoundary
          FallbackComponent={({ error, resetErrorBoundary }) => (
            <ErrorFallbackComponent
              error={error}
              resetErrorBoundary={resetErrorBoundary}
              context={{
                origin: "JzodObjectEditor_ProgressiveAttribute",
                objectType: "object",
                rootLessListKey,
                attributeRootLessListKeyArray,
                attributeName: attribute[0],
                attributeListKey,
                currentValue,
                formikValues: formik.values,
                // rawJzodSchema,
                localResolvedElementJzodSchemaBasedOnValue,
              }}
            />
          )}
        >
          {/* <ThemedOnScreenHelper label="attribute" data={attributeRootLessListKey}/> */}
          {/* <ThemedOnScreenHelper label="attribute" data={attribute[0]}/> */}
          <JzodElementEditor
            name={attribute[0]}
            existingObject={existingObject}
            labelElement={editableLabel}
            key={attribute[0]}
            listKey={attributeListKey}
            rootLessListKey={attributeRootLessListKey}
            rootLessListKeyArray={[...rootLessListKeyArray, attribute[0]]}
            reportSectionPathAsString={reportSectionPathAsString}
            indentLevel={usedIndentLevel + 1}
            currentDeploymentUuid={currentDeploymentUuid}
            typeCheckKeyMap={typeCheckKeyMap}
            currentApplicationSection={currentApplicationSection}
            resolvedElementJzodSchemaDEFUNCT={currentAttributeDefinition}
            foreignKeyObjects={foreignKeyObjects}
            insideAny={insideAny}
            optional={definedOptionalAttributes.has(attribute[0])}
            onChangeVector={onChangeVector}
            maxRenderDepth={maxRenderDepth}
            readOnly={readOnly}
            displayError={displayError}
            deleteButtonElement={
              !readOnly && !hideOptionalButton ? (
                <>
                  <ThemedSmallIconButton
                    id={reportSectionPathAsString+ "." + attributeRootLessListKey + "-removeOptionalAttributeOrRecordEntry"}
                    aria-label={reportSectionPathAsString+ "." + attributeRootLessListKey + "-removeOptionalAttributeOrRecordEntry"}
                    onClick={deleteElement(attributeRootLessListKeyArray)}
                    visible={isRecordType || definedOptionalAttributes.has(attribute[0])}
                  >
                    <Clear />
                  </ThemedSmallIconButton>
                </>
              ) : (
                <></>
              )
            }
          />
        </ErrorBoundary>
      )}
    </div>
  );
};

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
let count = 0;
export function JzodObjectEditor(props: JzodObjectEditorProps) {
  // const [count, setCount] = useState(0);

  // React.useEffect(() => {
  //   setCount((prevCount) => prevCount + 1);
  // }, [props]);

  const {
    name,
    listKey,
    labelElement,
    rootLessListKey,
    rootLessListKeyArray,
    reportSectionPathAsString,
    typeCheckKeyMap,
    currentDeploymentUuid,
    currentApplicationSection,
    indentLevel,
    insideAny,
    displayAsStructuredElementSwitch,
    deleteButtonElement,
    displayError,
    maxRenderDepth,
    readOnly,
    existingObject,
    foreignKeyObjects = {}, // Add default empty object
    onChangeVector,
  } = props;

  // Memoize the onChangeVector callback for this field to avoid repeated lookups
  const onChangeCallback = useMemo(
    () => onChangeVector?.[rootLessListKey],
    [onChangeVector, rootLessListKey]
  );

  // count++;
  // log.info(
  //   "JzodObjectEditor render",
  //   count,
  //   "rootLessListKey",
  //   rootLessListKey,
  //   // "rawJzodSchema",
  //   // JSON.stringify(rawJzodSchema, null, 2),
  //   // "rootLessListKeyMapDEFUNCT",
  //   // JSON.stringify(localRootLessListKeyMap, null, 2),
  // );
  const {
    // general use
    currentValueObjectAtKey,
    context,
    currentModel,
    currentValueObject,
    formik,
    formikRootLessListKey,
    formikRootLessListKeyArray,
    localResolvedElementJzodSchemaBasedOnValue,
    miroirMetaModel,
    currentMiroirModelEnvironment,
    // Array / Object fold / unfold state
    itemsOrder,
    // object
    definedOptionalAttributes,
    // stringSelectList,
    undefinedOptionalAttributes,
    // } = useJzodElementEditorHooks(props, count, "JzodElementEditor");
  } = useJzodElementEditorHooks(
    rootLessListKey,
    rootLessListKeyArray,
    reportSectionPathAsString,
    typeCheckKeyMap,
    currentDeploymentUuid,
    count,
    "JzodElementEditor"
  );

  const reportContext = useReportPageContext();

  // log.info("JzodObjectEditor",
  //   count,
  //   "Rendering JzodObjectEditor for props.rootLessListKeyArray",
  //   rootLessListKeyArray,
  //   "rootLessListKey",
  //   rootLessListKey,
  //   // "formik.values",
  //   // JSON.stringify(formik.values, null, 2),
  //   // "currentValueObject",
  //   // JSON.stringify(currentValueObject, null, 2),
  //   "foreignKeyObjects",
  //   foreignKeyObjects,
  //   "itemsOrder",
  //   itemsOrder,
  //   // "typeCheckKeyMap[rootLessListKey]",
  //   // typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined,
  //   // "typeCheckKeyMap",
  //   // typeCheckKeyMap,
  //   // "currentReportSectionFormikValues",
  //   // currentReportSectionFormikValues,
  //   // "props",
  //   // props,
  //   // reportContext.isNodeFolded(props.rootLessListKeyArray),
  //   // "reportContext.foldedObjectAttributeOrArrayItems",
  //   // reportContext.foldedObjectAttributeOrArrayItems,
  // );

  const currentTypeCheckKeyMap = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;

  // Debug the schema structure for editorButton
  // if (currentTypeCheckKeyMap) {
  //   log.info("JzodObjectEditor DEBUG schema structure for", rootLessListKey, 
  //     "has resolvedSchema?", !!currentTypeCheckKeyMap.resolvedSchema,
  //     "has tag?", !!currentTypeCheckKeyMap.resolvedSchema?.tag,
  //     "has tag.value?", !!currentTypeCheckKeyMap.resolvedSchema?.tag?.value,
  //     "has editorButton?", !!currentTypeCheckKeyMap.resolvedSchema?.tag?.value?.editorButton,
  //     "tag structure:", JSON.stringify(currentTypeCheckKeyMap.resolvedSchema?.tag, null, 2)
  //   );
  //   console.log("JzodObjectEditor DEBUG schema structure", {
  //     rootLessListKey,
  //     hasResolvedSchema: !!currentTypeCheckKeyMap.resolvedSchema,
  //     hasTag: !!currentTypeCheckKeyMap.resolvedSchema?.tag,
  //     hasTagValue: !!currentTypeCheckKeyMap.resolvedSchema?.tag?.value,
  //     hasEditorButton: !!currentTypeCheckKeyMap.resolvedSchema?.tag?.value?.editorButton,
  //     tagStructure: currentTypeCheckKeyMap.resolvedSchema?.tag
  //   });
  // }

  // ##############################################################################################
  // Blob detection logic - check if this object should be rendered as a blob editor
  const isBlob = useMemo(() => {
    return currentTypeCheckKeyMap?.resolvedSchema?.tag?.value?.isBlob === true;
  }, [currentTypeCheckKeyMap?.resolvedSchema?.tag?.value?.isBlob]);

  // Extract allowed MIME types from schema definition for blob fields
  const allowedMimeTypes = useMemo(() => {
    if (!isBlob || !currentTypeCheckKeyMap?.resolvedSchema) {
      return undefined;
    }
    
    // The blob structure has a mimeType field with an enum definition
    const blobSchema = currentTypeCheckKeyMap.resolvedSchema as JzodObject;
    const mimeTypeField = blobSchema.definition?.mimeType;
    
    if (mimeTypeField && mimeTypeField.type === 'enum' && Array.isArray(mimeTypeField.definition)) {
      return mimeTypeField.definition as string[];
    }
    
    return undefined;
  }, [isBlob, currentTypeCheckKeyMap?.resolvedSchema]);

  // Construct blob value structure for BlobEditorField
  // When isBlob is true, currentValue contains the blob contents {encoding, mimeType, data}
  // but BlobEditorField needs the parent object with {filename, contents}
  const blobValue = useMemo(() => {
    if (!isBlob) {
      return undefined;
    }

    // Get parent path by removing last element from rootLessListKeyArray
    const parentPath = rootLessListKeyArray.slice(0, -1);
    const parentKey = parentPath.join('.');

    // Get parent object from Formik values
    const parentObject = parentKey ? 
      // parentPath.reduce((obj, key) => obj?.[key], formik.values) : 
      // formik.values;
      parentPath.reduce((obj, key) => obj?.[key], currentValueObjectAtKey) : 
      currentValueObjectAtKey;

    // Construct the blob object structure that BlobEditorField expects
    return {
      filename: parentObject?.filename,
      contents: currentValueObjectAtKey, // This is the {encoding, mimeType, data} object
    };
  }, [isBlob, currentValueObjectAtKey, rootLessListKeyArray, currentValueObjectAtKey]);

  const currentMiroirFundamentalJzodSchema = context.miroirFundamentalJzodSchema;
  const usedIndentLevel: number = indentLevel ? indentLevel : 0;

  // Early return if component can't be rendered properly
  const canRenderObject = useMemo(() => {
    if (
      !localResolvedElementJzodSchemaBasedOnValue ||
      localResolvedElementJzodSchemaBasedOnValue.type !== "object"
    ) {
      return false;
    }
    return true;
  }, [localResolvedElementJzodSchemaBasedOnValue]);


  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> =
      getMemoizedReduxDeploymentsStateSelectorMap();

  const deploymentEntityState: ReduxDeploymentsState = useSelector(
    (state: ReduxStateWithUndoRedo) =>
      deploymentEntityStateSelectorMap.extractState(
        state.presentModelSnapshot.current,
        () => ({}),
        currentMiroirFundamentalJzodSchema?{
          miroirFundamentalJzodSchema: currentMiroirFundamentalJzodSchema,
          currentModel,
          miroirMetaModel,
        }: defaultMetaModelEnvironment
      )
  );

  const foldableItemsCount = useMemo(() => {
    return currentTypeCheckKeyMap?.resolvedSchema.type === "object" // for record / object type, the resolvedSchema is a JzodObject
      ? Object.values(currentTypeCheckKeyMap.resolvedSchema.definition).filter(
        (item: JzodElement) => foldableElementTypes.includes(item.type)
      ).length : 0
  }, [currentTypeCheckKeyMap?.resolvedSchema]);

  // ##############################################################################################
  // Get unfoldingDepth from schema tag or default to 1
  const unfoldingDepth = useMemo(() => {
    // log.info(
    //   "JzodObjectEditor computing unfoldingDepth",
    //   "rootLessListKey",
    //   rootLessListKey,
    //   (currentTypeCheckKeyMap?.resolvedSchema?.tag?.value?.display as any)?.unfoldSubLevels,
    // );
    return (currentTypeCheckKeyMap?.resolvedSchema?.tag?.value?.display as any)?.unfoldSubLevels ?? 1;
  }, [currentTypeCheckKeyMap?.resolvedSchema?.tag?.value?.display]);

  // if (
  //   ["jzodSchema", "jzodSchema.definition.definition.context.transformerTest"].includes(rootLessListKey)
  // ) {
  //   log.info(
  //     "JzodObjectEditor computed for type tag unfoldingDepth",
  //     currentTypeCheckKeyMap?.resolvedSchema?.tag?.value?.display,
  //     "rootLessListKey",
  //     rootLessListKey,
  //     "unfoldingDepth",
  //     unfoldingDepth,
  //     "currentTypeCheckKeyMap",
  //     currentTypeCheckKeyMap,
  //   );
  // }

  // ##############################################################################################
  // JzodSchemaTooltip
  //   const jzodSchemaTooltip: JSX.Element = useMemo(
  //     () => canRenderObject?(
  //       <span
  //         title={`
  // ${parentType} / ${unfoldedRawSchema.type} / ${localResolvedElementJzodSchemaBasedOnValue?.type}

  // ${JSON.stringify(props.rawJzodSchema, null, 2)}`}
  //         style={{
  //           display: "inline-flex",
  //           alignItems: "center",
  //           color: "#888",
  //           background: "#fff",
  //           borderRadius: "50%",
  //           padding: "2px",
  //           border: "1px solid #ddd",
  //           fontSize: "18px",
  //           width: "24px",
  //           height: "24px",
  //           justifyContent: "center",
  //         }}
  //       >
  //         <span style={{ display: "flex", alignItems: "center" }}>
  //           <InfoOutlined fontSize="small" sx={{ color: "#888" }} />
  //         </span>
  //       </span>
  //       // </span>
  //     ):<></>,
  //     [props.rawJzodSchema]
  //   );

  // ##############################################################################################
  // Handle attribute name changes for Record objects
  const handleAttributeNameChange = useCallback(
    (newAttributeName: string, formikAttributeRootLessListKeyArray: (string | number)[]) => {
      const localAttributeRootLessListKeyArray: (string | number)[] = formikAttributeRootLessListKeyArray.slice(1);
      const oldAttributeName =
        localAttributeRootLessListKeyArray[localAttributeRootLessListKeyArray.length - 1];

      log.info(
        "handleAttributeNameChange renaming attribute",
        oldAttributeName,
        "into",
        newAttributeName,
        "current Value",
        formik.values,
        "formikAttributeRootLessListKeyArray",
        formikAttributeRootLessListKeyArray
      );

      // Get the value at the old attribute path
      const subObject = resolvePathOnObject(currentValueObject, localAttributeRootLessListKeyArray);
      // const subObject = resolvePathOnObject(formik.values, localAttributeRootLessListKeyArray);

      // Delete the old attribute path
      const newFormState1: any = deleteObjectAtPath(
        currentValueObject,
        localAttributeRootLessListKeyArray
      );

      // Create new path with the new attribute name
      const newPath = localAttributeRootLessListKeyArray.slice(
        0,
        localAttributeRootLessListKeyArray.length - 1
      );
      newPath.push(newAttributeName);

      // Set the value at the new attribute path
      const newFormState2: any = alterObjectAtPath(newFormState1, newPath, subObject);

      log.info("handleAttributeNameChange newFormState2", newFormState2);

      // Update formik values
      // formik.setValues(newFormState2);
      // Invoke onChangeVector callback if registered for this field
      if (onChangeCallback) {
        onChangeCallback(newFormState2, rootLessListKey);
      }
      formik.setFieldValue(reportSectionPathAsString, newFormState2);
    },
    [formik.values, formik.setValues, onChangeCallback, rootLessListKey]
  );

  // ##############################################################################################
  const addExtraRecordEntry = useCallback(async () => {
    if (localResolvedElementJzodSchemaBasedOnValue?.type != "object") {
      throw (
        "addExtraRecordEntry called for non-object type: " +
        localResolvedElementJzodSchemaBasedOnValue
      );
    }
    // log.info(
    //   "addExtraRecordEntry clicked!",
    //   rootLessListKey,
    //   itemsOrder,
    //   Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
    //   "formik",
    //   formik.values
    // );
    if (currentTypeCheckKeyMap?.rawSchema.type != "record" || currentTypeCheckKeyMap.rawSchema?.type != "record") {
      throw "addExtraRecordEntry called for non-record type: " + currentTypeCheckKeyMap?.rawSchema.type;
    }

    const newAttributeType: JzodElement = (currentTypeCheckKeyMap.rawSchema as JzodRecord)?.definition;
    // log.info("addExtraRecordEntry newAttributeType", JSON.stringify(newAttributeType, null, 2));
    const newAttributeValue = currentMiroirFundamentalJzodSchema
      ? getDefaultValueForJzodSchemaWithResolutionNonHook(
          "build",
          currentTypeCheckKeyMap?.rawSchema.definition,
          currentValueObject,//formik.values, // rootObject
          rootLessListKey,
          undefined, // currentDefaultValue is not known yet, this is what this call will determine
          [], // currentPath on value is root
          true, // force optional attributes to receive a default value
          currentDeploymentUuid,
          {
            miroirFundamentalJzodSchema: currentMiroirFundamentalJzodSchema,
            currentModel,
            miroirMetaModel,
          }, // miroirEnvironment
          {}, // transformerParams
          {}, // contextResults
          deploymentEntityState,
          // Object.hasOwn(formik.values,"")?formik.values[""]:{}, // rootObject
        )
      : undefined;

    // const currentValue = resolvePathOnObject(formik.values, rootLessListKeyArray);
    const newRecordValue: any = { ["newRecordEntry"]: newAttributeValue, ...currentValueObjectAtKey };
    // log.info("addExtraRecordEntry", "newValue", newRecordValue);

    // const newItemsOrder = getItemsOrder(newRecordValue, currentTypeCheckKeyMap.rawSchema);
    // log.info("addExtraRecordEntry", "itemsOrder", itemsOrder, "newItemsOrder", newItemsOrder);

    // Invoke onChangeVector callback if registered for this field
    if (onChangeVector?.[rootLessListKey]) {
      onChangeVector[rootLessListKey](newRecordValue, rootLessListKey);
    }
    formik.setFieldValue(formikRootLessListKey, newRecordValue);
    // log.info(
    //   "addExtraRecordEntry clicked2!",
    //   listKey,
    //   itemsOrder,
    //   Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
    //   "formik",
    //   formik.values
    // );
  }, [
    props,
    itemsOrder,
    localResolvedElementJzodSchemaBasedOnValue,
    currentMiroirFundamentalJzodSchema,
    currentModel,
    miroirMetaModel,
    formik.values,
  ]);

  // ##############################################################################################
  const addObjectOptionalAttribute = useCallback(
    async (attributeName: string) => {
      if (localResolvedElementJzodSchemaBasedOnValue?.type != "object") {
        throw "addObjectOptionalAttribute called for non-object type: " + currentTypeCheckKeyMap?.rawSchema.type;
      }
      log.info(
        "addObjectOptionalAttribute clicked!",
        listKey,
        "for",
        "attributeName",
        attributeName,
        "itemsOrder",
        itemsOrder,
        "objectKeys",
        Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
        "formik",
        formik.values,
        "undefinedOptionalAttributes",
        undefinedOptionalAttributes,
      );
      // const currentObjectValue = resolvePathOnObject(formik.values, rootLessListKeyArray);
      const newAttributeType: JzodElement = resolvePathOnObject(
        currentTypeCheckKeyMap?.chosenUnionBranchRawSchema ??
          currentTypeCheckKeyMap?.jzodObjectFlattenedSchema ??
          currentTypeCheckKeyMap?.rawSchema,
        ["definition", attributeName]
      );
      const newAttributeValue = !!currentMiroirFundamentalJzodSchema
        ? getDefaultValueForJzodSchemaWithResolutionNonHook(
            "build",
            newAttributeType,
            currentValueObject,
            rootLessListKey,
            undefined, // currentDefaultValue is not known yet, this is what this call will determine
            [], // currentPath on value is root
            true, // force optional attributes to receive a default value
            currentDeploymentUuid,
            {
              miroirFundamentalJzodSchema: currentMiroirFundamentalJzodSchema,
              currentModel,
              miroirMetaModel,
            }, // miroirEnvironment
            {}, // transformerParams
            {}, // contextResults
            deploymentEntityState,
          )
        : undefined;

      const newObjectValue = {
        ...currentValueObjectAtKey,
        [attributeName]: newAttributeValue,
      };
      log.info(
        "addObjectOptionalAttribute",
        "newAttributeType",
        newAttributeType,
        "newAttributeValue",
        newAttributeValue,
        "newObjectValue",
        JSON.stringify(newObjectValue, null, 2),
      );
      // const newItemsOrder = getItemsOrder(
      //   newObjectValue,
      //   currentTypeCheckKeyMap?.chosenUnionBranchRawSchema ??
      //     currentTypeCheckKeyMap?.jzodObjectFlattenedSchema ??
      //     currentTypeCheckKeyMap?.rawSchema
      // );

      // log.info(
      //   "addObjectOptionalAttribute clicked2!",
      //   listKey,
      //   itemsOrder,
      //   Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
      //   "newAttributeType",
      //   newAttributeType,
      //   "newObjectValue",
      //   newObjectValue,
      //   "newItemsOrder",
      //   newItemsOrder
      // );
      // if (rootLessListKey) {
        // Invoke onChangeVector callback if registered for this field
        if (onChangeVector?.[rootLessListKey]) {
          onChangeVector[rootLessListKey](newObjectValue, rootLessListKey);
        }
        formik.setFieldValue(formikRootLessListKey, newObjectValue, false);
      // } else {
      //   formik.setValues(newObjectValue, false);
      // }
      // log.info("addObjectOptionalAttribute clicked3 DONE!");
    },
    [
      props,
      itemsOrder,
      localResolvedElementJzodSchemaBasedOnValue,
      currentMiroirFundamentalJzodSchema,
      currentModel,
      miroirMetaModel,
      currentValueObjectAtKey,
      formik.setFieldValue,
      undefinedOptionalAttributes,
    ]
  );

  // // ##############################################################################################
  // // Get displayed value when object is folded using the shared utility function
  const foldedDisplayValue = useMemo(() => {
    return getFoldedDisplayValue(localResolvedElementJzodSchemaBasedOnValue, currentValueObjectAtKey);
  }, [localResolvedElementJzodSchemaBasedOnValue, currentValueObjectAtKey]);

  // ##############################################################################################
  const deleteElement = (rootLessListKeyArray: (string | number)[]) => () => {
    if (rootLessListKeyArray.length > 0) {
      const newFormState: any = deleteObjectAtPath(currentValueObject, rootLessListKeyArray);
      log.info(
        "deleteElement called for",
        "reportSectionPathAsString",
        reportSectionPathAsString,
        "rootLessListKeyArray",
        rootLessListKeyArray.join("."),
        "currentValueObject",
        currentValueObject,
        "formik.values",
        formik.values,
        "newFormState",
        newFormState
      );
      // Invoke onChangeVector callback if registered for this field
      if (onChangeVector?.[rootLessListKey]) {
        onChangeVector[rootLessListKey](newFormState, rootLessListKey);
      }
      formik.setFieldValue(reportSectionPathAsString, newFormState);
      log.info("Removed optional attribute:", rootLessListKeyArray.join("."));
    } else {
      log.warn("deleteElement called with empty rootLessListKeyArray, cannot delete root object");
    }
  };

  // ##############################################################################################
  // Render error state if we can't properly render an object
  if (!canRenderObject) {
    log.error(
      "JzodObjectEditor cannot render object",
      rootLessListKey,
      "localResolvedElementJzodSchemaBasedOnValue",
      localResolvedElementJzodSchemaBasedOnValue
    );
    return (
      <div>
        <span className="error">
          JzodObjectEditor: localResolvedElementJzodSchemaBasedOnValue is not an object type:{" "}
          {JSON.stringify(localResolvedElementJzodSchemaBasedOnValue, null, 2)}
        </span>
      </div>
    );
  }

  // ##############################################################################################
  // Render blob editor if this object has isBlob tag
  if (isBlob) {
    return (
      <ErrorBoundary
        FallbackComponent={({ error, resetErrorBoundary }) => (
          <ErrorFallbackComponent
            error={error}
            resetErrorBoundary={resetErrorBoundary}
            context={{
              origin: "JzodObjectEditor-BlobEditorField",
              objectType: "blob",
              rootLessListKey,
              rootLessListKeyArray,
              currentValue: blobValue,
              formikValues: formik.values,
              localResolvedElementJzodSchemaBasedOnValue,
            }}
          />
        )}
      >
        <BlobEditorField
          rootLessListKey={rootLessListKey}
          rootLessListKeyArray={rootLessListKeyArray}
          currentValue={blobValue}
          formik={formik}
          readOnly={readOnly}
          allowedMimeTypes={allowedMimeTypes}
          onError={(error) => {
            log.error("BlobEditorField error:", error);
          }}
        />
      </ErrorBoundary>
    );
  }

  // ##############################################################################################
  // Memoize the array of rendered attributes to prevent unnecessary re-renders
  const attributeElements = useMemo(() => {
    // log.info(
    //   "JzodObjectEditor rendering attributes for",
    //   rootLessListKey,
    //   "foldedObjectAttributeOrArrayItems",
    //   reportContext.foldedObjectAttributeOrArrayItems
    // );
    return (
      <div>
        {/* <ThemedOnScreenHelper label="itemsOrder" data={itemsOrder} /> */}
        {!reportContext.isNodeFolded(rootLessListKeyArray) &&
          itemsOrder
            .map((i): [string, JzodElement] => [
              i,
              formik.values[rootLessListKey.length > 0 ? rootLessListKey + "." + i[0] : i[0]],
              // currentValueObjectAtKey[rootLessListKey.length > 0 ? rootLessListKey + "." + i[0] : i[0]],
            ])
            .map((attribute: [string, JzodElement], attributeNumber: number) => (
              <ProgressiveAttribute
                key={attribute[0]}
                listKey={listKey}
                rootLessListKey={rootLessListKey}
                formikRootLessListKey={formikRootLessListKey}
                formikRootLessListKeyArray={formikRootLessListKeyArray}
                rootLessListKeyArray={rootLessListKeyArray}
                reportSectionPathAsString={reportSectionPathAsString}
                attribute={attribute}
                attributeNumber={attributeNumber}
                currentDeploymentUuid={currentDeploymentUuid}
                currentApplicationSection={currentApplicationSection}
                foreignKeyObjects={foreignKeyObjects || {}}
                insideAny={insideAny}
                localResolvedElementJzodSchemaBasedOnValue={
                  localResolvedElementJzodSchemaBasedOnValue as JzodObject
                }
                typeCheckKeyMap={typeCheckKeyMap}
                currentValue={currentValueObjectAtKey}
                usedIndentLevel={usedIndentLevel}
                definedOptionalAttributes={definedOptionalAttributes}
                onChangeVector={onChangeVector}
                handleAttributeNameChange={handleAttributeNameChange}
                deleteElement={deleteElement}
                hideOptionalButton={localResolvedElementJzodSchemaBasedOnValue?.tag?.value?.display?.objectHideOptionalButton}
                maxRenderDepth={maxRenderDepth}
                readOnly={readOnly}
                existingObject={existingObject}
                formik={formik}
                currentMiroirFundamentalJzodSchema={currentMiroirFundamentalJzodSchema}
                currentModel={currentModel}
                miroirMetaModel={miroirMetaModel}
                measuredUnfoldJzodSchemaOnce={measuredUnfoldJzodSchemaOnce}
                displayError={displayError}
              />
            ))}
      </div>
    );
  }, [
    itemsOrder,
    formik.values,
    rootLessListKey,
    listKey,
    rootLessListKeyArray,
    localResolvedElementJzodSchemaBasedOnValue,
    typeCheckKeyMap,
    currentDeploymentUuid,
    currentApplicationSection,
    foreignKeyObjects,
    insideAny,
    displayError,
    currentValueObjectAtKey,
    usedIndentLevel,
    definedOptionalAttributes,
    onChangeVector,
    handleAttributeNameChange,
    deleteElement,
    formik,
    currentMiroirFundamentalJzodSchema,
    currentModel,
    miroirMetaModel,
    measuredUnfoldJzodSchemaOnce,
    reportContext.foldedObjectAttributeOrArrayItems, // This is the key addition!
  ]);

  return (
    <div id={rootLessListKey} key={rootLessListKey}>
      <ThemedOnScreenDebug
        label={`JzodObjectEditor: ${rootLessListKey}`}
        data={{
          rootLessListKey,
          formikRootLessListKey,
          currentValueObjectAtKey,
          // currentKeyMap: currentTypeCheckKeyMap,
        }}
        copyButton={true}
        initiallyUnfolded={false}
        useCodeBlock={true}
      />
      {/* Performance statistics */}
      {!currentTypeCheckKeyMap?.resolvedSchema?.tag?.value?.display?.objectWithoutHeader && (
        <ThemedFlexRow justify="start" align="center">
          <span>
            <ThemedFlexRow align="center">
              {labelElement}
              {/* Show folded display value when object is folded and a value is available */}
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
            <FoldUnfoldObjectOrArray
              listKey={listKey}
              rootLessListKeyArray={rootLessListKeyArray}
              currentValue={currentValueObjectAtKey}
              unfoldingDepth={unfoldingDepth}
            ></FoldUnfoldObjectOrArray>
            <FoldUnfoldObjectOrArray
              listKey={listKey}
              rootLessListKeyArray={rootLessListKeyArray}
              currentValue={currentValueObjectAtKey}
              unfoldingDepth={Infinity}
            ></FoldUnfoldObjectOrArray>
            {!reportContext.isNodeFolded(rootLessListKeyArray) &&
              itemsOrder.length >= 2 &&
              foldableItemsCount > 1 && (
                <FoldUnfoldAllObjectAttributesOrArrayItems
                  listKey={listKey}
                  rootLessListKeyArray={rootLessListKeyArray}
                  itemsOrder={itemsOrder}
                  maxDepth={maxRenderDepth ?? 1}
                ></FoldUnfoldAllObjectAttributesOrArrayItems>
              )}
          </span>
          {/* add record attribute button for records */}
          <span>
            {!readOnly &&
            currentTypeCheckKeyMap?.rawSchema.type == "record" &&
            !reportContext.isNodeFolded(rootLessListKeyArray) ? (
              <ThemedSizedButton
                id={formikRootLessListKey + ".addRecordAttribute"}
                aria-label={formikRootLessListKey + ".addRecordAttribute"}
                onClick={addExtraRecordEntry}
                title="Add new record attribute"
              >
                <ThemedAddIcon />
              </ThemedSizedButton>
            ) : (
              <></>
            )}
          </span>
          {/* add optional attributes buttons */}
          <span>
            {!readOnly &&
              currentTypeCheckKeyMap?.rawSchema.type != "record" &&
              undefinedOptionalAttributes.length > 0 &&
              !reportContext.isNodeFolded(rootLessListKeyArray) && (
                <>
                  <ThemedOptionalAttributeContainer>
                    {undefinedOptionalAttributes.map((attributeName) => (
                      <ThemedOptionalAttributeItem key={attributeName}>
                        <ThemedSizedButton
                          aria-label={
                            formikRootLessListKey + ".addObjectOptionalAttribute." + attributeName
                          }
                          onClick={() => addObjectOptionalAttribute(attributeName)}
                          title={`Add optional attribute: ${attributeName}`}
                        >
                          <ThemedAddIcon />
                        </ThemedSizedButton>
                        <ThemedAttributeName>{attributeName}</ThemedAttributeName>
                      </ThemedOptionalAttributeItem>
                    ))}
                  </ThemedOptionalAttributeContainer>
                </>
              )}
          </span>
          {/* custom transformer for transformers (transform Entity Instance Transformer to an Entity Instance List Transformer) */}
          {currentTypeCheckKeyMap?.resolvedSchema &&
            currentTypeCheckKeyMap?.resolvedSchema.tag &&
            currentTypeCheckKeyMap.resolvedSchema.tag.value &&
            currentTypeCheckKeyMap.resolvedSchema.tag.value.editorButton && (
              <span>
                {(() => {
                  // log.info("JzodObjectEditor rendering editorButton",
                  //   "rootLessListKey", rootLessListKey,
                  //   "editorButton", currentTypeCheckKeyMap.resolvedSchema.tag.value.editorButton,
                  //   "tag.value", JSON.stringify(currentTypeCheckKeyMap.resolvedSchema.tag.value)
                  // );
                  return null;
                })()}
                {/* {JSON.stringify((currentTypeCheckKeyMap?.resolvedSchema.tag as any)?.value) ??
                    "tag undefined!"} */}
                <button
                  type="button"
                  onClick={(e: any) => {
                    e.preventDefault();
                    e.stopPropagation();
                    log.info("editorButton transformer button clicked", e);
                    console.log("editorButton transformer button clicked", e);
                    const result: TransformerReturnType<any> = transformer_extended_apply_wrapper(
                      context.miroirContext.miroirActivityTracker, // activityTracker
                      "runtime", // step
                      [], // transformerPath
                      currentTypeCheckKeyMap.resolvedSchema.tag?.value?.editorButton?.label, // label
                      currentTypeCheckKeyMap.resolvedSchema.tag?.value?.editorButton?.transformer, // transformer
                      currentMiroirModelEnvironment,
                      {}, // queryParams
                      { originTransformer: currentValueObjectAtKey }, // contextResults - pass the instance to transform
                      "value" // resolveBuildTransformersTo
                    );
                    if (result.status === "error") {
                      log.error("editorButton transformer error:", result.message);
                      console.error("editorButton transformer error:", result.message);
                    } else {
                      // Invoke onChangeVector callback if registered for this field
                      if (onChangeVector?.[rootLessListKey]) {
                        onChangeVector[rootLessListKey](result, rootLessListKey);
                      }
                      formik.setFieldValue(reportSectionPathAsString, result);
                    }
                    log.info("editorButton transformer button clicked, result:", result);
                  }}
                  // name={currentTypeCheckKeyMap.resolvedSchema.tag.value.editorButton.label}
                  // role="button"
                >
                  {(currentTypeCheckKeyMap?.resolvedSchema.tag as any)?.value.editorButton.label}
                </button>
              </span>
            )}
          {/* extra buttons */}
          {props.extraToolsButtons && <span>{props.extraToolsButtons}</span>}
          <ThemedDeleteButtonContainer>
            {deleteButtonElement ?? <></>}
            {displayAsStructuredElementSwitch ?? <></>}
            {/* {jzodSchemaTooltip ?? <></>} */}
          </ThemedDeleteButtonContainer>
        </ThemedFlexRow>
      )}
      {/* {!currentTypeCheckKeyMap?.resolvedSchema?.tag?.value?.display?.objectAttributesNoIndent ? (
          <ThemedIndentedContainer
            id={listKey + ".inner"}
            marginLeft={`calc(${indentShift})`}
            isVisible={!reportContext.isNodeFolded(rootLessListKeyArray)}
            key={`${rootLessListKey}|body`}
          >
            <div>{attributeElements}</div>
          </ThemedIndentedContainer>
        ) : ( */}
      {attributeElements}
      {/* )} */}
    </div>
  );
}
