import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Clear } from "../Themes/MaterialSymbolWrappers";

import {
  alterObjectAtPath2,
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
  resolveJzodSchemaReferenceInContext,
  resolvePathOnObject,
  SyncBoxedExtractorOrQueryRunnerMap,
  transformer_extended_apply_wrapper,
  Uuid,
  type ApplicationDeploymentMap,
  type TransformerReturnType
} from "miroir-core";

import { BlobEditorField } from "./BlobEditorField";

import { packageName } from "../../../../constants";
import {
  getMemoizedReduxDeploymentsStateSelectorMap,
  ReduxStateWithUndoRedo,
  useSelector,
} from "../../../miroir-localcache-imports.js";
import { cleanLevel } from "../../constants";
import { useDefaultValueParams } from "../../ReduxHooks";
import {
  measuredUnfoldJzodSchemaOnce
} from "../../tools/hookPerformanceMeasure";
import { ErrorFallbackComponent } from "../ErrorFallbackComponent";
import { DebugHelper } from "../Page/DebugHelper.js";
import { useReportPageContext } from "../Reports/ReportPageContext";
import type { ValueObjectEditMode } from "../Reports/ReportSectionEntityInstance";
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
  ThemedSmallIconButton,
  ThemedStyledButton,
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
  valueObjectEditMode: ValueObjectEditMode;
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
  handleMoveAttribute: (direction: "up" | "down", attributeKey: string) => void;
  totalAttributes: number;
  hideOptionalButton?: boolean;
  formik: any;
  currentMiroirFundamentalJzodSchema: any;
  currentModel: any;
  miroirMetaModel: any;
  measuredUnfoldJzodSchemaOnce: any;
  // Add direct props from JzodObjectEditorProps that are used
  currentApplication: Uuid;
  applicationDeploymentMap: ApplicationDeploymentMap;
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
  valueObjectEditMode,
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
  handleMoveAttribute,
  totalAttributes,
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
  currentApplication,
  applicationDeploymentMap,
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
  const isRecordType = currentKeyMap?.rawSchema?.type === "record" || currentKeyMap?.resolvedReferenceSchemaInContext?.type === "record";

  // Move up/down buttons: visible when the attribute value carries a tag.value.id
  const attributeTagValueId = currentValue?.[attribute[0]]?.tag?.value?.id;
  const canMoveAttribute = !readOnly && typeof attributeTagValueId === "number";
  const isFirst = attributeNumber === 0;
  const isLast = attributeNumber === totalAttributes - 1;
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
            valueObjectEditMode={valueObjectEditMode}
            name={attribute[0]}
            existingObject={existingObject}
            labelElement={editableLabel}
            key={attribute[0]}
            listKey={attributeListKey}
            rootLessListKey={attributeRootLessListKey}
            rootLessListKeyArray={[...rootLessListKeyArray, attribute[0]]}
            reportSectionPathAsString={reportSectionPathAsString}
            indentLevel={usedIndentLevel + 1}
            currentApplication={currentApplication}
            applicationDeploymentMap={applicationDeploymentMap}
            currentApplicationSection={currentApplicationSection}
            currentDeploymentUuid={currentDeploymentUuid}
            typeCheckKeyMap={typeCheckKeyMap}
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
                  {canMoveAttribute && (
                    <ThemedStyledButton
                      variant="transparent"
                      type="button"
                      role={`${reportSectionPathAsString}.${attributeRootLessListKey}.button.up`}
                      disabled={isFirst}
                      onClick={() => handleMoveAttribute("up", attribute[0])}
                      title="Move attribute up"
                    >
                      ^
                    </ThemedStyledButton>
                  )}
                  {canMoveAttribute && (
                    <ThemedStyledButton
                      variant="transparent"
                      type="button"
                      role={`${reportSectionPathAsString}.${attributeRootLessListKey}.button.down`}
                      disabled={isLast}
                      onClick={() => handleMoveAttribute("down", attribute[0])}
                      title="Move attribute down"
                    >
                      v
                    </ThemedStyledButton>
                  )}
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
// Helper: compute the max tag.value.id across sibling object entries
function getMaxTagValueId(siblingObject: Record<string, any>): number | undefined {
  let maxId: number | undefined = undefined;
  for (const value of Object.values(siblingObject)) {
    const id = value?.tag?.value?.id;
    if (typeof id === "number") {
      maxId = maxId === undefined ? id : Math.max(maxId, id);
    }
  }
  return maxId;
}

// ##############################################################################################
// Helper: auto-assign tag.value.id to a new entry if sibling entries have tag.value.id values
function assignNextTagValueId(newValue: any, siblingObject: Record<string, any>): any {
  if (newValue == null || typeof newValue !== "object" || Array.isArray(newValue)) {
    return newValue;
  }
  const maxId = getMaxTagValueId(siblingObject);
  if (maxId === undefined) {
    // No sibling has tag.value.id, don't assign one
    return newValue;
  }
  const nextId = maxId + 1;
  // Set tag.value.id on the new value, creating the tag/value structure if needed
  return {
    ...newValue,
    tag: {
      ...(newValue.tag ?? {}),
      value: {
        ...(newValue.tag?.value ?? {}),
        id: nextId,
      },
    },
  };
}

// ##############################################################################################
// Helper: renumber tag.value.id values sequentially (starting from 1) based on the given key order,
// only if at least one entry has a tag.value.id. Returns the updated object.
function renumberTagValueIds(obj: Record<string, any>, keyOrder: string[]): Record<string, any> {
  // Check if any entries have tag.value.id
  const hasAnyId = Object.values(obj).some(
    (v) => v != null && typeof v === "object" && typeof v?.tag?.value?.id === "number"
  );
  if (!hasAnyId) {
    return obj;
  }
  const result: Record<string, any> = {};
  let nextId = 1;
  for (const key of keyOrder) {
    if (key in obj) {
      const entry = obj[key];
      if (entry != null && typeof entry === "object" && !Array.isArray(entry)) {
        result[key] = {
          ...entry,
          tag: {
            ...(entry.tag ?? {}),
            value: {
              ...(entry.tag?.value ?? {}),
              id: nextId,
            },
          },
        };
      } else {
        result[key] = entry;
      }
      nextId++;
    }
  }
  // Include any keys not in keyOrder (shouldn't happen, but be safe)
  for (const key of Object.keys(obj)) {
    if (!(key in result)) {
      result[key] = obj[key];
    }
  }
  return result;
}

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

  const {
    name,
    valueObjectEditMode,
    listKey,
    labelElement,
    rootLessListKey,
    rootLessListKeyArray,
    reportSectionPathAsString,
    typeCheckKeyMap,
    currentApplication,
    applicationDeploymentMap,
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
    currentApplicationModelEnvironment,
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
    currentApplication,
    applicationDeploymentMap,
    currentDeploymentUuid,
    count,
    "JzodElementEditor"
  );

  const reportContext = useReportPageContext();
  const currentTypeCheckKeyMap = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;

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
        applicationDeploymentMap,
        () => ({}),
        currentApplicationModelEnvironment??defaultMetaModelEnvironment,
        // currentMiroirFundamentalJzodSchema?{
        //   miroirFundamentalJzodSchema: currentMiroirFundamentalJzodSchema,
        //   currentModel,
        //   miroirMetaModel,
        // }: defaultMetaModelEnvironment
      )
  );

  const defaultValueParams = useDefaultValueParams(currentApplication, currentDeploymentUuid);
  
  // ##############################################################################################
  const foldableItemsCount = useMemo(() => {
    return currentTypeCheckKeyMap?.resolvedSchema.type === "object" // for record / object type, the resolvedSchema is a JzodObject
      ? Object.values(currentTypeCheckKeyMap.resolvedSchema.definition).filter(
        (item: JzodElement) => foldableElementTypes.includes(item.type)
      ).length : 0
  }, [currentTypeCheckKeyMap?.resolvedSchema]);

  // ##############################################################################################
  // Get unfoldingDepth from schema tag or default to 1
  const unfoldingDepth = useMemo(() => {
    return (currentTypeCheckKeyMap?.resolvedSchema?.tag?.value?.display as any)?.unfoldSubLevels ?? 1;
  }, [currentTypeCheckKeyMap?.resolvedSchema?.tag?.value?.display]);


  const resolvedRawSchema = currentTypeCheckKeyMap?.rawSchema.type === "schemaReference" ? resolveJzodSchemaReferenceInContext(
    currentTypeCheckKeyMap?.rawSchema,
    currentTypeCheckKeyMap?.rawSchema.context ?? {},
    currentApplicationModelEnvironment
  ) : currentTypeCheckKeyMap?.rawSchema;

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
      const newFormState2: any = alterObjectAtPath2(newFormState1, newPath, subObject);

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

    if (currentTypeCheckKeyMap?.rawSchema?.type != "record" && resolvedRawSchema?.type != "record") {
      throw "addExtraRecordEntry called for non-record type: " + currentTypeCheckKeyMap?.rawSchema.type;
    }
    const effectiveRawSchema: JzodRecord =
      currentTypeCheckKeyMap?.rawSchema?.type === "record"
        ? (currentTypeCheckKeyMap?.rawSchema as JzodRecord)
        : (resolvedRawSchema as JzodRecord);

    const newAttributeType: JzodElement = (effectiveRawSchema as JzodRecord)?.definition;
    log.info("addExtraRecordEntry newAttributeType", JSON.stringify(newAttributeType, null, 2));
    const newAttributeValue = currentMiroirFundamentalJzodSchema
      ? getDefaultValueForJzodSchemaWithResolutionNonHook(
          "build",
          effectiveRawSchema.definition,
          currentValueObject,//formik.values, // rootObject
          rootLessListKey,
          undefined, // currentDefaultValue is not known yet, this is what this call will determine
          [], // currentPath on value is root
          true, // force optional attributes to receive a default value
          currentApplication,
          applicationDeploymentMap,
          currentDeploymentUuid,
          currentApplicationModelEnvironment,
          defaultValueParams, // transformerParams
          {}, // contextResults
          deploymentEntityState,
          // Object.hasOwn(formik.values,"")?formik.values[""]:{}, // rootObject
        )
      : undefined;

    // Auto-assign tag.value.id if sibling entries have tag.value.id values
    const newAttributeValueWithId = assignNextTagValueId(newAttributeValue, currentValueObjectAtKey);

    const newRecordValue: any = { ["newRecordEntry"]: newAttributeValueWithId, ...currentValueObjectAtKey };
    log.info("addExtraRecordEntry", "newValue", newRecordValue);

    // Invoke onChangeVector callback if registered for this field
    if (onChangeVector?.[rootLessListKey]) {
      onChangeVector[rootLessListKey](newRecordValue, rootLessListKey);
    }
    // formik.setFieldValue(formikRootLessListKey, newRecordValue);
    // const targetRootLessListKey = [reportSectionPathAsString, ...formikRootLessListKeyArray].join(
    //   ".",
    // );
    // formik.setFieldValue(targetRootLessListKey, newRecordValue);
    formik.setFieldValue(formikRootLessListKey, newRecordValue);
    log.info(
      "addExtraRecordEntry clicked2!",
      // "targetRootLessListKey",
      // targetRootLessListKey,
      "formikRootLessListKey",
      '"' + formikRootLessListKey + '"',
      ", reportSectionPathAsString",
      '"' + reportSectionPathAsString + '"',
      ", listKey",
      '"' + listKey + '"',
      ", itemsOrder",
      itemsOrder,
      Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
      ", formik",
      formik.values
    );
  }, [
    props,
    itemsOrder,
    localResolvedElementJzodSchemaBasedOnValue,
    currentMiroirFundamentalJzodSchema,
    currentModel,
    miroirMetaModel,
    formik.values,
    resolvedRawSchema
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
            currentApplication,
            applicationDeploymentMap,
            currentDeploymentUuid,
            currentApplicationModelEnvironment,
            defaultValueParams, // transformerParams
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
      let newFormState: any = deleteObjectAtPath(currentValueObject, rootLessListKeyArray);
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

      // Renumber tag.value.id for sibling entries after deletion (for record-like objects)
      if (rootLessListKeyArray.length >= 1) {
        const parentPath = rootLessListKeyArray.slice(0, -1);
        const parentObject = parentPath.length > 0
          ? resolvePathOnObject(newFormState, parentPath)
          : newFormState;
        if (parentObject != null && typeof parentObject === "object" && !Array.isArray(parentObject)) {
          const renumbered = renumberTagValueIds(parentObject, Object.keys(parentObject));
          if (renumbered !== parentObject) {
            if (parentPath.length > 0) {
              newFormState = alterObjectAtPath2(newFormState, parentPath, renumbered);
            } else {
              newFormState = renumbered;
            }
          }
        }
      }

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
  // Move an attribute up or down in display order by adjusting tag.value.id values.
  // Works across the id/no-id boundary: the crossed-over entry receives an id so that
  // repeated moves remain coherent.  All id-tracked entries are renumbered sequentially
  // (1, 2, 3 …) in their new positions so the result is always gap-free.
  const handleMoveAttribute = useCallback(
    (direction: "up" | "down", attributeKey: string) => {
      const currentIndex = itemsOrder.indexOf(attributeKey);
      if (currentIndex === -1) return;
      const neighborIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
      if (neighborIndex < 0 || neighborIndex >= itemsOrder.length) return;
      const neighborKey = itemsOrder[neighborIndex];

      const currentEntry = currentValueObjectAtKey[attributeKey];
      // Only id-having entries can be moved (buttons are only rendered for those)
      if (typeof currentEntry?.tag?.value?.id !== "number") return;

      // Build new display order by swapping the two positions
      const newOrder = itemsOrder.slice();
      [newOrder[currentIndex], newOrder[neighborIndex]] = [newOrder[neighborIndex], newOrder[currentIndex]];

      // Assign sequential ids to:
      //   – every entry that had an id before the move, AND
      //   – the crossed-over neighbor (so it participates in future moves)
      const newObjectValue = { ...currentValueObjectAtKey };
      let nextId = 1;
      for (const key of newOrder) {
        const entry = currentValueObjectAtKey[key];
        const hadId = typeof entry?.tag?.value?.id === "number";
        const isCrossedNeighbor = key === neighborKey;
        if (hadId || isCrossedNeighbor) {
          newObjectValue[key] = {
            ...entry,
            tag: {
              ...(entry?.tag ?? {}),
              value: {
                ...(entry?.tag?.value ?? {}),
                id: nextId,
              },
            },
          };
          nextId++;
        }
      }

      log.info(
        "handleMoveAttribute",
        direction,
        "attribute",
        attributeKey,
        "->",
        neighborKey,
        "newOrder",
        newOrder,
        "assigned ids up to",
        nextId - 1
      );

      if (onChangeVector?.[rootLessListKey]) {
        onChangeVector[rootLessListKey](newObjectValue, rootLessListKey);
      }
      formik.setFieldValue(formikRootLessListKey, newObjectValue);
    },
    [itemsOrder, currentValueObjectAtKey, formik, formikRootLessListKey, onChangeVector, rootLessListKey]
  );

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
                valueObjectEditMode={valueObjectEditMode}
                listKey={listKey}
                rootLessListKey={rootLessListKey}
                formikRootLessListKey={formikRootLessListKey}
                formikRootLessListKeyArray={formikRootLessListKeyArray}
                rootLessListKeyArray={rootLessListKeyArray}
                reportSectionPathAsString={reportSectionPathAsString}
                attribute={attribute}
                attributeNumber={attributeNumber}
                currentApplication={currentApplication}
                applicationDeploymentMap={applicationDeploymentMap}
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
                handleMoveAttribute={handleMoveAttribute}
                totalAttributes={itemsOrder.length}
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
    handleMoveAttribute,
    formik,
    currentMiroirFundamentalJzodSchema,
    currentModel,
    miroirMetaModel,
    measuredUnfoldJzodSchemaOnce,
    reportContext.foldedObjectAttributeOrArrayItems, // This is the key addition!
  ]);

  return (
    <div id={rootLessListKey} key={rootLessListKey}>
      <DebugHelper
        componentName="JzodObjectEditor"
        elements={[{
          label: `JzodObjectEditor: ${rootLessListKey}`,
          data: {
            rootLessListKey,
            itemsOrder,
            formik: Object.keys(formik.values),
            pageParams: formik.values.pageParams,
            formikRootLessListKey,
            rawSchema: currentTypeCheckKeyMap?.rawSchema,
            resolvedSchema: currentTypeCheckKeyMap?.resolvedSchema,
            jzodObjectFlattenedSchema: currentTypeCheckKeyMap?.jzodObjectFlattenedSchema,
            currentValueObjectAtKey,
            // mlSchema: rootLessListKey == "mlSchema" ? Object.entries(currentValueObjectAtKey.definition) : undefined,
          },
          copyButton: true,
          useCodeBlock: true,
        }]}
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
          {/* fold/unfold controls */}
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
            (currentTypeCheckKeyMap?.rawSchema.type == "record" || resolvedRawSchema?.type == "record") &&
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
                      currentApplicationModelEnvironment,
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
