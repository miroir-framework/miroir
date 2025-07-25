import { ErrorBoundary } from "react-error-boundary";
import React, { FC, useCallback, useMemo, useState, useRef, useEffect } from "react";
import Clear from "@mui/icons-material/Clear";
import InfoOutlined from "@mui/icons-material/InfoOutlined";

import {
  JzodElement,
  JzodObject,
  JzodLiteral,
  JzodEnum,
  unfoldJzodSchemaOnce,
  LoggerInterface,
  MiroirLoggerFactory,
  getDefaultValueForJzodSchemaWithResolution,
  JzodRecord,
  resolvePathOnObject,
  deleteObjectAtPath,
  alterObjectAtPath,
  ResolvedJzodSchemaReturnType,
  UnfoldJzodSchemaOnceReturnType,
  KeyMapEntry,
} from "miroir-core";

import { indentShift } from "./JzodArrayEditor";
import { FoldUnfoldObjectOrArray, FoldUnfoldAllObjectAttributesOrArrayItems, JzodElementEditor } from "./JzodElementEditor";
import { useJzodElementEditorHooks } from "./JzodElementEditorHooks";
import { JzodObjectEditorProps } from "./JzodElementEditorInterface";
import { SizedButton, SizedAddBox, SmallIconButton, getItemsOrder } from "./Style";
import { ErrorFallbackComponent } from "./ErrorFallbackComponent";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";
import {
  measuredGetDefaultValueForJzodSchemaWithResolution,
  measuredUnfoldJzodSchemaOnce,
  measuredUseJzodElementEditorHooks,
} from "../tools/hookPerformanceMeasure";
import { keymap } from "@uiw/react-codemirror";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

// Performance tracking for unfoldJzodSchemaOnce - legacy approach
let totalUnfoldTime = 0;
let unfoldCallCount = 0;

// // Legacy wrapper function redirects to our new generalized approach
// function measureUnfoldPerformance(
//   miroirFundamentalJzodSchema: any,
//   schema: any,
//   path: any[],
//   unfoldingReference: any[],
//   rootSchema: any,
//   depth: number,
//   currentModel: any,
//   miroirMetaModel: any
// ): UnfoldJzodSchemaOnceReturnType {
//   // Just call the measured version created with our higher-order function
//   return measuredUnfoldJzodSchemaOnce(
//     miroirFundamentalJzodSchema,
//     schema,
//     path,
//     unfoldingReference,
//     rootSchema,
//     depth,
//     currentModel,
//     miroirMetaModel
//   );
// }

// Editable attribute name component with local state management
// const EditableAttributeName = React.memo(({
const EditableAttributeName: FC<{
  initialValue: string;
  onCommit: (newValue: string) => void;
  rootLessListKey: string;
}> = ({
  initialValue,
  onCommit,
  rootLessListKey,
}: {
  initialValue: string;
  onCommit: (newValue: string) => void;
  rootLessListKey: string;
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
    <input
      type="text"
      value={localValue}
      name={"meta-" + rootLessListKey + "-NAME"}
      aria-label={"meta-" + rootLessListKey + "-NAME"}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={() => setIsEditing(true)}
      onBlur={handleCommit}
      onKeyDown={handleKeyDown}
      style={{
        border: "1px solid #ccc",
        borderRadius: "4px",
        padding: "2px 4px",
        fontSize: "inherit",
        fontFamily: "inherit",
        minWidth: "60px",
        width: `${Math.max(60, localValue.length * 8 + 16)}px`,
      }}
    />
  );
};

// Progressive Attribute Component for asynchronous rendering
const ProgressiveAttribute: FC<{
  attribute: [string, JzodElement];
  attributeNumber: number;
  props: JzodObjectEditorProps;
  listKey: string;
  rootLessListKey: string;
  rootLessListKeyArray: (string | number)[];
  localResolvedElementJzodSchemaBasedOnValue: JzodObject;
  // unfoldedRawSchema: any;
  typeCheckKeyMap?: Record<string, KeyMapEntry>;
  currentValue: any;
  usedIndentLevel: number;
  definedOptionalAttributes: Set<string>;
  handleAttributeNameChange: (newValue: string, attributeRootLessListKeyArray: (string | number)[]) => void;
  deleteElement: (rootLessListKeyArray: (string | number)[]) => () => void;
  formik: any;
  currentMiroirFundamentalJzodSchema: any;
  currentModel: any;
  miroirMetaModel: any;
  measuredUnfoldJzodSchemaOnce: any;
  foldedObjectAttributeOrArrayItems: { [k: string]: boolean };
  setFoldedObjectAttributeOrArrayItems: React.Dispatch<React.SetStateAction<{ [k: string]: boolean }>>;
}> = ({
  attribute,
  attributeNumber,
  props,
  listKey,
  rootLessListKey,
  rootLessListKeyArray,
  localResolvedElementJzodSchemaBasedOnValue,
  // unfoldedRawSchema,
  typeCheckKeyMap,
  currentValue,
  usedIndentLevel,
  definedOptionalAttributes,
  handleAttributeNameChange,
  deleteElement,
  formik,
  currentMiroirFundamentalJzodSchema,
  currentModel,
  miroirMetaModel,
  measuredUnfoldJzodSchemaOnce,
  foldedObjectAttributeOrArrayItems,
  setFoldedObjectAttributeOrArrayItems,
}) => {
  const isTestMode = process.env.VITE_TEST_MODE === 'true';
  const [isRendered, setIsRendered] = useState(isTestMode);
  
  useEffect(() => {
    // Skip progressive rendering in test mode to avoid timing issues
    if (isTestMode) {
      return;
    }
    
    // Use requestIdleCallback for better performance, fallback to setTimeout
    const scheduleRender = () => {
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(() => setIsRendered(true), { timeout: 1000 });
      } else {
        setTimeout(() => setIsRendered(true), 50);
      }
    };
    
    scheduleRender();
  }, [isTestMode]);

  // Original attribute rendering logic - always extract props to avoid hook issues
  const {
    currentDeploymentUuid,
    currentApplicationSection,
    // localRootLessListKeyMap,
    foreignKeyObjects,
    insideAny,
    // rawJzodSchema,
  } = props;

  const currentAttributeDefinition = localResolvedElementJzodSchemaBasedOnValue.definition[attribute[0]];
  const attributeListKey = listKey + "." + attribute[0];
  const attributeRootLessListKey = rootLessListKey.length > 0 ? rootLessListKey + "." + attribute[0] : attribute[0];
  const attributeRootLessListKeyArray: (string | number)[] =
    rootLessListKeyArray.length > 0 ? [...rootLessListKeyArray, attribute[0]] : [attribute[0]];

  const currentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;


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
      onCommit={(newValue) => handleAttributeNameChange(newValue, attributeRootLessListKeyArray)}
    />
  ) : (
    <span
      id={attributeRootLessListKey + ".label"}
      key={attributeRootLessListKey + ".label"}
      data-testid="miroirDisplayedValue"
      style={{
        minWidth: "120px",
        flexShrink: 0,
        textAlign: "left",
        justifyContent: "flex-start",
        display: "flex",
        paddingRight: "1ex",
      }}
    >
      {currentAttributeDefinition?.tag?.value?.defaultLabel || attribute[0]}
    </span>
  );

  return (
    <div key={attributeListKey}>
      {!isRendered ? (
        <div style={{ height: '40px', display: 'flex', alignItems: 'center', color: '#999', paddingLeft: '20px' }}>
          <span style={{ fontSize: '0.9em' }}>Loading {attribute[0]}...</span>
        </div>
      ) : (
        <ErrorBoundary
          FallbackComponent={({ error, resetErrorBoundary }) => (
            <ErrorFallbackComponent
              error={error}
              resetErrorBoundary={resetErrorBoundary}
              context={{
                origin: "JzodObjectEditor",
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
          <JzodElementEditor
            name={attribute[0]}
            labelElement={editableLabel}
            key={attribute[0]}
            listKey={attributeListKey}
            rootLessListKey={attributeRootLessListKey}
            rootLessListKeyArray={[...rootLessListKeyArray, attribute[0]]}
            indentLevel={usedIndentLevel + 1}
            currentDeploymentUuid={currentDeploymentUuid}
            // rawJzodSchema={attributeRawJzodSchema}
            typeCheckKeyMap={typeCheckKeyMap}
            currentApplicationSection={currentApplicationSection}
            resolvedElementJzodSchema={currentAttributeDefinition}
            foreignKeyObjects={foreignKeyObjects}
            foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
            setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
            insideAny={insideAny}
            optional={definedOptionalAttributes.has(attribute[0])}
            // parentType={currentKeyMap?.rawSchema?.type}
            deleteButtonElement={
              <>
                <SmallIconButton
                  id={attributeRootLessListKey + "-removeOptionalAttributeOrRecordEntry"}
                  aria-label={attributeRootLessListKey + "-removeOptionalAttributeOrRecordEntry"}
                  onClick={deleteElement(attributeRootLessListKeyArray)}
                  style={{
                    padding: 0,
                    visibility: isRecordType || definedOptionalAttributes.has(attribute[0]) ? "visible" : "hidden",
                  }}
                >
                  <Clear />
                </SmallIconButton>
              </>
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
// ##############################################################################################
export function JzodObjectEditor(props: JzodObjectEditorProps) {
  const [count, setCount] = useState(0);

  React.useEffect(() => {
    setCount((prevCount) => prevCount + 1);
  }, [props]);

  const {
    name,
    listKey,
    labelElement,
    rootLessListKey,
    rootLessListKeyArray,
    // rawJzodSchema,
    typeCheckKeyMap,
    currentDeploymentUuid,
    currentApplicationSection,
    indentLevel,
    // resolvedElementJzodSchema,
    // localRootLessListKeyMap,
    insideAny,
    displayAsStructuredElementSwitch,
    deleteButtonElement,
    foldedObjectAttributeOrArrayItems,
    setFoldedObjectAttributeOrArrayItems,
    // parentType, // used to control the parent type of the element, used for record elements
  } = props;

  // count++;
  // log.info(
  //   "JzodObjectEditor render",
  //   count,
  //   "rootLessListKey",
  //   rootLessListKey,
  //   "rawJzodSchema",
  //   JSON.stringify(rawJzodSchema, null, 2),
  //   "rootLessListKeyMap",
  //   JSON.stringify(localRootLessListKeyMap, null, 2),
  // );
  const {
    // general use
    context,
    currentModel,
    // deploymentEntityStateSelectorMap,
    formik,
    localResolvedElementJzodSchemaBasedOnValue,
    miroirMetaModel,
    // recursivelyUnfoldedRawSchema,
    // unfoldedRawSchema,
    // uuid
    // foreignKeyObjects,
    // union

    // Array / Object fold / unfold state
    // hiddenFormItems,  // Now comes from props
    // setHiddenFormItems,  // Now comes from props
    itemsOrder,
    // object
    definedOptionalAttributes,
    stringSelectList,
    undefinedOptionalAttributes,
    } = useJzodElementEditorHooks(props, count, "JzodElementEditor");
  // } = measuredUseJzodElementEditorHooks(props, count, "JzodElementEditor");

  const currentKeyMap = typeCheckKeyMap ? typeCheckKeyMap[rootLessListKey] : undefined;

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

  const currentValue = useMemo(
    () => resolvePathOnObject(formik.values, rootLessListKeyArray),
    [formik.values, rootLessListKeyArray]
  );

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
    (newAttributeName: string, attributeRootLessListKeyArray: (string | number)[]) => {
      const localAttributeRootLessListKeyArray: (string | number)[] = attributeRootLessListKeyArray.slice();
      const oldAttributeName =
        localAttributeRootLessListKeyArray[localAttributeRootLessListKeyArray.length - 1];

      log.info(
        "handleAttributeNameChange renaming attribute",
        oldAttributeName,
        "into",
        newAttributeName,
        "current Value",
        formik.values,
        "attributeRootLessListKeyArray",
        attributeRootLessListKeyArray
      );

      // Get the value at the old attribute path
      const subObject = resolvePathOnObject(formik.values, localAttributeRootLessListKeyArray);

      // Delete the old attribute path
      const newFormState1: any = deleteObjectAtPath(
        formik.values,
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
      formik.setValues(newFormState2);
    },
    [formik.values, formik.setValues]
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
    if (currentKeyMap?.rawSchema.type != "record" || currentKeyMap.rawSchema?.type != "record") {
      throw "addExtraRecordEntry called for non-record type: " + currentKeyMap?.rawSchema.type;
    }

    const newAttributeType: JzodElement = (currentKeyMap.rawSchema as JzodRecord)?.definition;
    // log.info("addExtraRecordEntry newAttributeType", JSON.stringify(newAttributeType, null, 2));
    const newAttributeValue = currentMiroirFundamentalJzodSchema
      ? measuredGetDefaultValueForJzodSchemaWithResolution(
          currentKeyMap?.rawSchema.definition,
          true, // force optional attributes to receive a default value
          currentMiroirFundamentalJzodSchema,
          currentModel,
          miroirMetaModel
        )
      : undefined;

    const currentValue = resolvePathOnObject(formik.values, rootLessListKeyArray);
    const newRecordValue: any = { ["newRecordEntry"]: newAttributeValue, ...currentValue };
    // log.info("addExtraRecordEntry", "newValue", newRecordValue);

    const newItemsOrder = getItemsOrder(newRecordValue, currentKeyMap.rawSchema);
    // log.info("addExtraRecordEntry", "itemsOrder", itemsOrder, "newItemsOrder", newItemsOrder);

    formik.setFieldValue(rootLessListKey, newRecordValue);
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
        throw "addObjectOptionalAttribute called for non-object type: " + currentKeyMap?.rawSchema.type;
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
      const currentObjectValue = resolvePathOnObject(formik.values, rootLessListKeyArray);
      const newAttributeType: JzodElement = resolvePathOnObject(
        currentKeyMap?.chosenUnionBranchRawSchema ?? currentKeyMap?.jzodObjectFlattenedSchema ?? currentKeyMap?.rawSchema,
        ["definition", attributeName]
      );
      const newAttributeValue = !!currentMiroirFundamentalJzodSchema
        ? getDefaultValueForJzodSchemaWithResolution(
            newAttributeType,
            true, // force optional attributes to receive a default value
            currentMiroirFundamentalJzodSchema,
            currentModel,
            miroirMetaModel,
          )
        : undefined;

      const newObjectValue = {
        ...currentObjectValue,
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
      const newItemsOrder = getItemsOrder(
        newObjectValue,
        currentKeyMap?.chosenUnionBranchRawSchema ?? currentKeyMap?.jzodObjectFlattenedSchema ?? currentKeyMap?.rawSchema
      );

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
      if (rootLessListKey) {
        formik.setFieldValue(rootLessListKey, newObjectValue, false);
      } else {
        formik.setValues(newObjectValue, false);
      }
      // log.info("addObjectOptionalAttribute clicked3 DONE!");
    },
    [
      props,
      itemsOrder,
      localResolvedElementJzodSchemaBasedOnValue,
      currentMiroirFundamentalJzodSchema,
      currentModel,
      miroirMetaModel,
      formik.values,
      formik.setFieldValue,
      undefinedOptionalAttributes,
    ]
  );

  // ##############################################################################################
  const deleteElement = (rootLessListKeyArray: (string | number)[]) => () => {
    if (rootLessListKeyArray.length > 0) {
      const newFormState: any = deleteObjectAtPath(formik.values, rootLessListKeyArray);
      formik.setValues(newFormState);
      log.info("Removed optional attribute:", rootLessListKeyArray.join("."));
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
  // Memoize the array of rendered attributes to prevent unnecessary re-renders
  const attributeElements = useMemo(() => (
    <>
      {itemsOrder
        .map((i): [string, JzodElement] => [
          i,
          formik.values[rootLessListKey.length > 0 ? rootLessListKey + "." + i[0] : i[0]],
        ])
        .map((attribute: [string, JzodElement], attributeNumber: number) => (
          <ProgressiveAttribute
            key={attribute[0]}
            attribute={attribute}
            attributeNumber={attributeNumber}
            props={props}
            listKey={listKey}
            rootLessListKey={rootLessListKey}
            rootLessListKeyArray={rootLessListKeyArray}
            localResolvedElementJzodSchemaBasedOnValue={localResolvedElementJzodSchemaBasedOnValue as JzodObject}
            typeCheckKeyMap={typeCheckKeyMap}
            currentValue={currentValue}
            usedIndentLevel={usedIndentLevel}
            definedOptionalAttributes={definedOptionalAttributes}
            handleAttributeNameChange={handleAttributeNameChange}
            deleteElement={deleteElement}
            formik={formik}
            currentMiroirFundamentalJzodSchema={currentMiroirFundamentalJzodSchema}
            currentModel={currentModel}
            miroirMetaModel={miroirMetaModel}
            measuredUnfoldJzodSchemaOnce={measuredUnfoldJzodSchemaOnce}
            foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
            setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
          />
        ))}
    </>
  ), [
    itemsOrder,
    formik.values,
    rootLessListKey,
    props,
    listKey,
    rootLessListKeyArray,
    localResolvedElementJzodSchemaBasedOnValue,
    typeCheckKeyMap,
    currentValue,
    usedIndentLevel,
    definedOptionalAttributes,
    handleAttributeNameChange,
    deleteElement,
    formik,
    currentMiroirFundamentalJzodSchema,
    currentModel,
    miroirMetaModel,
    measuredUnfoldJzodSchemaOnce,
    foldedObjectAttributeOrArrayItems // This is the key addition!
  ]);
  return (
    <div id={rootLessListKey} key={rootLessListKey}>
      {/* <span>JzodObjectEditor: {count}</span> */}
      <div>
        {/* Performance statistics */}
        <span
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "start",
            alignItems: "center",
          }}
        >
          {/* <span>
            {deleteButton ?? <></>}
          </span> */}
          <span>
            {/* {parentType == "record" || (parentType == "object" && rawJzodSchema?.optional) ? ( */}
            <span
              style={{
                display: "flex",
                flexDirection: "row",
                alignContent: "start",
                alignItems: "center",
              }}
            >
              {labelElement}
            </span>
          </span>
          <span id={rootLessListKey + "head"} key={rootLessListKey + "head"}>
            <FoldUnfoldObjectOrArray
              foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
              setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
              listKey={listKey}
            ></FoldUnfoldObjectOrArray>
            {!foldedObjectAttributeOrArrayItems[listKey] ? (
              <FoldUnfoldAllObjectAttributesOrArrayItems
                foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
                setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
                listKey={listKey}
                itemsOrder={itemsOrder}
              ></FoldUnfoldAllObjectAttributesOrArrayItems>
            ) : (
              <></>
            )}
          </span>
          <span>
            {/* add optional attributes buttons */}
            {currentKeyMap?.rawSchema.type != "record" &&
            undefinedOptionalAttributes.length > 0 &&
            !foldedObjectAttributeOrArrayItems[listKey] ? (
              <span
                style={{
                  display: "flex",
                  flexFlow: "row wrap",
                  alignItems: "center",
                  gap: "1em",
                  marginLeft: "1em",
                }}
              >
                {undefinedOptionalAttributes.map((attributeName) => (
                  <span
                    key={attributeName}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <SizedButton
                      variant="text"
                      aria-label={rootLessListKey + ".addObjectOptionalAttribute." + attributeName}
                      onClick={() => addObjectOptionalAttribute(attributeName)}
                      title={`Add optional attribute: ${attributeName}`}
                      style={{ flexShrink: 0 }}
                    >
                      <SizedAddBox />
                    </SizedButton>
                    <span
                      style={{
                        fontSize: "0.8em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {attributeName}
                    </span>
                  </span>
                ))}
              </span>
            ) : (
              <></>
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
            {deleteButtonElement ?? <></>}
            {displayAsStructuredElementSwitch ?? <></>}
            {/* {jzodSchemaTooltip ?? <></>} */}
          </span>
        </span>
        <div
          id={listKey + ".inner"}
          style={{
            marginLeft: `calc(${indentShift})`,
            display: foldedObjectAttributeOrArrayItems[listKey] ? "none" : "block",
          }}
          key={`${rootLessListKey}|body`}
        >
          {currentKeyMap?.rawSchema.type == "record" || currentKeyMap?.rawSchema.type == "any" ? (
            <span>
              <SizedButton
                id={rootLessListKey + ".addRecordAttribute"}
                variant="text"
                aria-label={rootLessListKey + ".addRecordAttribute"}
                onClick={addExtraRecordEntry}
              >
                <SizedAddBox />
              </SizedButton>
            </span>
          ) : (
            <></>
          )}
          <div>{attributeElements}</div>
        </div>
      </div>
    </div>
  );
}
