import { ErrorBoundary } from "react-error-boundary";
import React, { useCallback, useMemo, useState } from "react";
import Clear from "@mui/icons-material/Clear";

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
} from "miroir-core";

import { indentShift } from "./JzodArrayEditor";
import { ExpandOrFoldObjectAttributes, JzodElementEditor } from "./JzodElementEditor";
import { getJzodElementEditorHooks } from "./JzodElementEditorHooks";
import { JzodObjectEditorProps } from "./JzodElementEditorInterface";
import { SizedButton, SizedAddBox, SmallIconButton, getItemsOrder } from "./Style";
import { packageName } from "../../../constants";
import { cleanLevel } from "../constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});


let count: number = 0;

// Editable attribute name component with local state management
const EditableAttributeName = React.memo(({ 
  initialValue, 
  onCommit,
  rootLesslistKey
}: { 
  initialValue: string;
  onCommit: (newValue: string) => void;
  rootLesslistKey: string;
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

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCommit();
    } else if (event.key === 'Escape') {
      setLocalValue(initialValue);
      setIsEditing(false);
    }
  }, [handleCommit, initialValue]);

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
      name={"meta-"+ rootLesslistKey + "-NAME"}
      aria-label={"meta-"+ rootLesslistKey + "-NAME"}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={() => setIsEditing(true)}
      onBlur={handleCommit}
      onKeyDown={handleKeyDown}
      style={{
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '2px 4px',
        fontSize: 'inherit',
        fontFamily: 'inherit',
        minWidth: '60px',
        width: `${Math.max(60, localValue.length * 8 + 16)}px`
      }}
    />
  );
});

  // #######################
  // #######################
  // #######################
  // const removeObjectOptionalAttribute = useCallback(
  //   (listKey: string) => {
  //     // const removeObjectOptionalAttribute = (listKey: string) => {
  //     if (localResolvedElementJzodSchemaBasedOnValue.type != "object") {
  //       throw "removeObjectOptionalAttribute called for non-object type: " + unfoldedRawSchema.type;
  //     }

  //     log.info(
  //       "removeOptionalAttribute clicked!",
  //       listKey,
  //       itemsOrder,
  //       Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
  //       "formik",
  //       formik.values
  //     );
  //     const newFormState: any = { ...formik.values };
  //     delete newFormState[listKey];
  //     formik.setFormikState(newFormState);
  //     const currentValue = resolvePathOnObject(newFormState, props.rootLesslistKeyArray);
  //     log.info(
  //       "clicked2!",
  //       listKey,
  //       itemsOrder,
  //       Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
  //       "formik",
  //       formik.values
  //     );
  //   },
  //   [
  //     props,
  //     itemsOrder,
  //     localResolvedElementJzodSchemaBasedOnValue,
  //     unfoldedRawSchema,
  //     formik.values,
  //     formik.setFormikState,
  //     currentMiroirFundamentalJzodSchema,
  //     currentModel,
  //     miroirMetaModel,
  //   ]
  // );
  // #######################
  // #######################
  // #######################
  // const handleAttributeNameChange = (event: any, attributeRootLessListKeyArray: string[]) => {
  //   const localAttributeRootLessListKeyArray: string[] = attributeRootLessListKeyArray.slice();
  //   const newAttributeName = event.target.value;
  //   const oldAttributeName =
  //     localAttributeRootLessListKeyArray[localAttributeRootLessListKeyArray.length - 1];
  //   log.info(
  //     "handleAttributeNameChange renaming attribute",
  //     oldAttributeName,
  //     "into",
  //     newAttributeName,
  //     "called with event",
  //     event,
  //     "current Value",
  //     formik.values,
  //     "props.rootLesslistKey",
  //     props.rootLesslistKey,
  //     "attributeRootLessListKeyArray",
  //     attributeRootLessListKeyArray,
  //     attributeRootLessListKeyArray.length,
  //     // "localAttributeRootLessListKeyArray",
  //     // localAttributeRootLessListKeyArray,
  //     // localAttributeRootLessListKeyArray.length,
  //     "props.resolvedJzodSchema",
  //     props.resolvedElementJzodSchema
  //   );
  //   const subObject = resolvePathOnObject(formik.values, localAttributeRootLessListKeyArray);
  //   const newFormState1: any = deleteObjectAtPath(
  //     formik.values,
  //     localAttributeRootLessListKeyArray
  //   );
  //   log.info(
  //     "handleAttributeNameChange newFormState1",
  //     newFormState1,
  //     localAttributeRootLessListKeyArray
  //   );
  //   // const newPath = attributeRootLessListKeyArray.slice(0,attributeRootLessListKeyArray.length-1);
  //   const parentPath = localAttributeRootLessListKeyArray.slice(
  //     0,
  //     localAttributeRootLessListKeyArray.length - 1
  //   );
  //   const newPath = localAttributeRootLessListKeyArray.slice(
  //     0,
  //     localAttributeRootLessListKeyArray.length - 1
  //   );
  //   log.info(
  //     "handleAttributeNameChange newPath before push",
  //     newPath,
  //     localAttributeRootLessListKeyArray
  //   );
  //   newPath.push(newAttributeName);
  //   log.info("handleAttributeNameChange newPath", newPath);
  //   const newFormState2: any = alterObjectAtPath(newFormState1, newPath, subObject);
  //   log.info("handleAttributeNameChange newFormState2", newFormState2);

  //   // log.info("handleSelectValueChange called with event", event, "current Value",props.formik.values,"newFormState", newFormState)
  //   // props.setFormState(newFormState2);
  //   // formik.setFormikState(newFormState2);
  //   formik.setValues(newFormState2);
  //   if (itemsOrder) {
  //     log.info(
  //       "handleAttributeNameChange reading path",
  //       props.rootLesslistKey,
  //       "from currentParentValue",
  //       newFormState2,
  //       "itemsOrder",
  //       itemsOrder
  //     );
  //     const localItemsOrder = itemsOrder.slice();
  //     const attributePosition = localItemsOrder?.indexOf(oldAttributeName);
  //     // const newItemsOrder = parentItemsOrder?.splice(uuidPosition,1)
  //     if (attributePosition != -1) {
  //       localItemsOrder[attributePosition] = newAttributeName;
  //     }
  //     log.info(
  //       "handleAttributeNameChange for path",
  //       props.rootLesslistKey,
  //       "new itemsOrder to be computed should be",
  //       localItemsOrder
  //     );
  //     // setItemsOrder(localItemsOrder);
  //   } else {
  //     log.warn("handleAttributeNameChange reading path", parentPath, "itemsOrder is undefined!");
  //   }
  //   // log.info(
  //   //   "handleAttributeNameChange new parent object items order",
  //   //   parentItemsOrder,
  //   // );
  //   // const currentParentValue = resolvePathOnObject(newFormState2,parentPath);
  // };


// Main component wrapped in React.memo
export const JzodObjectEditor = React.memo(function JzodObjectEditorComponent(props: JzodObjectEditorProps) {
  const {
    name,
    listKey,
    label,
    rootLesslistKey,
    rootLesslistKeyArray,
    rawJzodSchema,
    currentDeploymentUuid,
    currentApplicationSection,
    indentLevel,
    resolvedElementJzodSchema,
    insideAny,
  } = props;

  count++;
  const {
    // general use
    context,
    currentModel,
    deploymentEntityStateSelectorMap,
    formik,
    localResolvedElementJzodSchemaBasedOnValue,
    miroirMetaModel,
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
    // object
    definedOptionalAttributes,
    stringSelectList,
    undefinedOptionalAttributes,
  } = getJzodElementEditorHooks(props, count, "JzodElementEditor");

  const currentMiroirFundamentalJzodSchema = context.miroirFundamentalJzodSchema;
  const usedIndentLevel: number = props.indentLevel ? props.indentLevel : 0;

  // Early return if component can't be rendered properly
  const canRenderObject = useMemo(() => {
    if (!localResolvedElementJzodSchemaBasedOnValue || 
        localResolvedElementJzodSchemaBasedOnValue.type !== "object") {
      return false;
    }
    return true;
  }, [localResolvedElementJzodSchemaBasedOnValue]);

  const currentValue = useMemo(() => 
    resolvePathOnObject(formik.values, props.rootLesslistKeyArray), 
    [formik.values, props.rootLesslistKeyArray]
  );

  // Handle attribute name changes for Record objects
  const handleAttributeNameChange = useCallback((newAttributeName: string, attributeRootLessListKeyArray: string[]) => {
    const localAttributeRootLessListKeyArray: string[] = attributeRootLessListKeyArray.slice();
    const oldAttributeName = localAttributeRootLessListKeyArray[localAttributeRootLessListKeyArray.length - 1];
    
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
    const newFormState1: any = deleteObjectAtPath(formik.values, localAttributeRootLessListKeyArray);
    
    // Create new path with the new attribute name
    const newPath = localAttributeRootLessListKeyArray.slice(0, localAttributeRootLessListKeyArray.length - 1);
    newPath.push(newAttributeName);
    
    // Set the value at the new attribute path
    const newFormState2: any = alterObjectAtPath(newFormState1, newPath, subObject);
    
    log.info("handleAttributeNameChange newFormState2", newFormState2);
    
    // Update formik values
    formik.setValues(newFormState2);
  }, [formik.values, formik.setValues]);

  // ##############################################################################################
  const addExtraRecordEntry = useCallback(async () => {
    if (localResolvedElementJzodSchemaBasedOnValue.type != "object") {
      throw (
        "addExtraRecordEntry called for non-object type: " +
        localResolvedElementJzodSchemaBasedOnValue
      );
    }
    log.info(
      "addExtraRecordEntry clicked!",
      props.rootLesslistKey,
      itemsOrder,
      Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
      "formik",
      formik.values
    );
    if (unfoldedRawSchema.type != "record" || props.rawJzodSchema?.type != "record") {
      throw "addExtraRecordEntry called for non-record type: " + unfoldedRawSchema.type;
    }

    const newAttributeType: JzodElement = (props.rawJzodSchema as JzodRecord)?.definition;
    log.info("addExtraRecordEntry newAttributeType", JSON.stringify(newAttributeType, null, 2));
    const newAttributeValue = currentMiroirFundamentalJzodSchema
      ? getDefaultValueForJzodSchemaWithResolution(
          unfoldedRawSchema.definition,
          currentMiroirFundamentalJzodSchema,
          currentModel,
          miroirMetaModel
        )
      : undefined;

    const currentValue = resolvePathOnObject(formik.values, props.rootLesslistKeyArray);
    const newRecordValue: any = { ["newRecordEntry"]: newAttributeValue, ...currentValue };
    log.info("addExtraRecordEntry", "newValue", newRecordValue);

    const newItemsOrder = getItemsOrder(newRecordValue, props.rawJzodSchema);
    log.info("addExtraRecordEntry", "itemsOrder", itemsOrder, "newItemsOrder", newItemsOrder);

    formik.setFieldValue(props.rootLesslistKey, newRecordValue);
    log.info(
      "addExtraRecordEntry clicked2!",
      props.listKey,
      itemsOrder,
      Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
      "formik",
      formik.values
    );
  }, [
    props,
    itemsOrder,
    localResolvedElementJzodSchemaBasedOnValue,
    unfoldedRawSchema,
    currentMiroirFundamentalJzodSchema,
    currentModel,
    miroirMetaModel,
    formik.values,
  ]);

  // #######################
  // #######################
  // #######################
  const addObjectOptionalAttribute = useCallback(async () => {
    if (localResolvedElementJzodSchemaBasedOnValue.type != "object") {
      throw "addObjectOptionalAttribute called for non-object type: " + unfoldedRawSchema.type;
    }
    log.info(
      "addObjectOptionalAttribute clicked!",
      props.listKey,
      itemsOrder,
      Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
      "formik",
      formik.values,
      "props.rawJzodSchema",
      JSON.stringify(props.rawJzodSchema, null, 2),
      "undefinedOptionalAttributes",
      undefinedOptionalAttributes
    );
    const currentObjectValue = resolvePathOnObject(formik.values, props.rootLesslistKeyArray);
    const newAttributeType: JzodElement = resolvePathOnObject(props.rawJzodSchema, [
      "definition",
      undefinedOptionalAttributes[0],
    ]);
    // const newAttributeValue = getDefaultValueForJzodSchema(newAttributeType)
    const newAttributeValue = currentMiroirFundamentalJzodSchema
      ? getDefaultValueForJzodSchemaWithResolution(
          newAttributeType,
          currentMiroirFundamentalJzodSchema,
          currentModel,
          miroirMetaModel
        )
      : undefined;

    const newObjectValue = {
      ...currentObjectValue,
      [undefinedOptionalAttributes[0]]: newAttributeValue,
    };
    const newItemsOrder = getItemsOrder(newObjectValue, props.rawJzodSchema);

    formik.setFieldValue(props.rootLesslistKey, newObjectValue, false);

    log.info(
      "addObjectOptionalAttribute clicked2!",
      props.listKey,
      itemsOrder,
      Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
      "newObjectValue",
      newObjectValue,
      "newItemsOrder",
      newItemsOrder,
      "localResolvedElementJzodSchemaBasedOnValue",
      JSON.stringify(localResolvedElementJzodSchemaBasedOnValue, null, 2),
      "props.rawJzodSchema",
      JSON.stringify(props.rawJzodSchema, null, 2)
    );
  }, [ 
    props,
    itemsOrder,
    localResolvedElementJzodSchemaBasedOnValue,
    unfoldedRawSchema,
    currentMiroirFundamentalJzodSchema,
    currentModel,
    miroirMetaModel,
    formik.values,
    formik.setFieldValue,
    undefinedOptionalAttributes[0]
  ]);

  // Render error state if we can't properly render an object
  if (!canRenderObject) {
    return (
      <div>
        <span className="error">
          JzodObjectEditor: localResolvedElementJzodSchemaBasedOnValue is not an object type:{" "}
          {JSON.stringify(localResolvedElementJzodSchemaBasedOnValue, null, 2)}
        </span>
      </div>
    );
  }
  
  // Memoize the array of rendered attributes to prevent unnecessary re-renders
  const attributeElements = useMemo(() => {
    return itemsOrder
      .map((i): [string, JzodElement] => [
        i,
        formik.values[
          props.rootLesslistKey.length > 0 ? props.rootLesslistKey + "." + i[0] : i[0]
        ],
      ])
      .map((attribute: [string, JzodElement], attributeNumber: number) => {
        const currentAttributeDefinition =
          (localResolvedElementJzodSchemaBasedOnValue as JzodObject).definition[attribute[0]];
        const attributeListKey = props.listKey + "." + attribute[0];
        const attributeRootLessListKey =
          props.rootLesslistKey.length > 0
            ? props.rootLesslistKey + "." + attribute[0]
            : attribute[0];
        const attributeRootLessListKeyArray =
          props.rootLesslistKeyArray.length > 0
            ? [...props.rootLesslistKeyArray, attribute[0]]
            : [attribute[0]];

        let attributeRawJzodSchema: JzodElement;

        if (!unfoldedRawSchema) {
          throw new Error(
            "JzodElementEditor unfoldedRawSchema undefined for object " +
              props.listKey +
              " attribute " +
              attribute[0] +
              " attributeListKey " +
              attributeListKey
          );
        }

        const attributeDisplayedLabel: string =
          currentAttributeDefinition?.tag?.value?.defaultLabel ?? attribute[0];

        // determine raw schema of attribute
        switch (unfoldedRawSchema?.type) {
          case "any": {
            attributeRawJzodSchema = unfoldedRawSchema;
            break;
          }
          case "object": {
            attributeRawJzodSchema = unfoldedRawSchema.definition[attribute[0]];
            break;
          }
          case "record": {
            attributeRawJzodSchema = unfoldedRawSchema.definition;
            break;
          }
          case "union": {
            let concreteObjectRawJzodSchema: JzodObject | undefined;
            let resolvedConcreteObjectJzodSchema: JzodObject | undefined;

            const possibleObjectTypes =
              unionInformation?.objectBranches.filter((a: any) => a.type == "object") ?? []; // useless??

            if (possibleObjectTypes.length == 0) {
              return (
                <div key={attributeListKey}>
                  <span>
                    {attributeDisplayedLabel}{" "}
                    <span className="error">no object type found in union</span>
                  </span>
                </div>
              );
            }

            if (possibleObjectTypes.length > 1) {
              if (!unfoldedRawSchema.discriminator) {
                throw new Error(
                  "no discriminator found, could not choose branch of union type for object " +
                    unfoldedRawSchema +
                    " " +
                    localResolvedElementJzodSchemaBasedOnValue
                );
              }
              const discriminator: string = (unfoldedRawSchema as any).discriminator;
              const discriminatorValue = currentValue[discriminator];

              if (discriminator && discriminatorValue) {
                concreteObjectRawJzodSchema = possibleObjectTypes.find(
                  (a: any) =>
                    (a.type == "object" &&
                      a.definition[discriminator].type == "literal" &&
                      (a.definition[discriminator] as JzodLiteral).definition ==
                        discriminatorValue) ||
                    (a.type == "object" &&
                      a.definition[discriminator].type == "enum" &&
                      (a.definition[discriminator] as JzodEnum).definition.includes(
                        discriminatorValue
                      ))
                ) as any;
              } else {
                return (
                  <div key={attributeListKey}>
                    <span>
                      {attributeDisplayedLabel}{" "}
                      <span className="error">
                        no discriminator value found in union for object {props.listKey}{" "}
                        attribute {attribute[0]} attributeListKey {attributeListKey}
                      </span>
                    </span>
                  </div>
                );
              }
            } else {
              // possibleObjectTypes.length == 1
              concreteObjectRawJzodSchema = possibleObjectTypes[0] as JzodObject;
            }
            if (!concreteObjectRawJzodSchema) {
              throw new Error(
                "JzodElementEditor could not find concrete raw schema for " +
                  props.listKey +
                  " attribute " +
                  attribute[0] +
                  " listKey " +
                  attributeListKey +
                  " unfoldedRawSchema " +
                  JSON.stringify(unfoldedRawSchema, null, 2)
              );
            }
            if (
              concreteObjectRawJzodSchema.type == "object" &&
              concreteObjectRawJzodSchema.extend
            ) {
              const resolvedConcreteObjectJzodSchemaTmp = currentMiroirFundamentalJzodSchema
                ? unfoldJzodSchemaOnce(
                    currentMiroirFundamentalJzodSchema,
                    concreteObjectRawJzodSchema,
                    currentModel,
                    miroirMetaModel
                  )
                : undefined;

              if (
                !resolvedConcreteObjectJzodSchemaTmp ||
                resolvedConcreteObjectJzodSchemaTmp.status != "ok"
              ) {
                throw new Error(
                  "JzodElementEditor resolve 'extend' clause for concrete raw schema for " +
                    props.listKey +
                    " attribute " +
                    attribute[0] +
                    " listKey " +
                    attributeListKey +
                    " concreteObjectRawJzodSchema " +
                    JSON.stringify(concreteObjectRawJzodSchema) +
                    " error " +
                    resolvedConcreteObjectJzodSchemaTmp?.error
                );
              }
              resolvedConcreteObjectJzodSchema =
                resolvedConcreteObjectJzodSchemaTmp.element as JzodObject;
            } else {
              resolvedConcreteObjectJzodSchema = concreteObjectRawJzodSchema;
            }

            attributeRawJzodSchema =
              resolvedConcreteObjectJzodSchema.definition[attribute[0]];
            break;
          }
          default: {
            throw new Error(
              "JzodElementEditor unfoldedRawSchema.type incorrect for object " +
                props.listKey +
                " attribute " +
                attribute[0] +
                " attributeListKey " +
                attributeListKey +
                " unfoldedRawSchema?.type " +
                unfoldedRawSchema?.type
            );
          }
        }
        
        // Determine if this is a record type where attribute names should be editable
        const isRecordType = unfoldedRawSchema?.type === "record";
        const editableLabel = isRecordType ? (
          <EditableAttributeName
            initialValue={attribute[0]}
            rootLesslistKey={attributeRootLessListKey}
            onCommit={(newValue) =>
              handleAttributeNameChange(newValue, attributeRootLessListKeyArray)
            }
          />
        ) : (
          <span
            id={attributeRootLessListKey + ".label"}
            key={attributeRootLessListKey + ".label"}
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
            <ErrorBoundary
              FallbackComponent={({ error, resetErrorBoundary }: any) => {
                log.error(
                  "Object errorboundary for",
                  attributeListKey,
                  "currentValue",
                  currentValue,
                  "error",
                  error,
                );
                return (
                  <div role="alert">
                    <div style={{ color: "red" }}>
                      <p>Something went wrong:</p>
                      <div key="1">object {props.rootLesslistKey}</div>
                      <div key="2">attribute {attributeRootLessListKeyArray}</div>
                      <div>
                        calc attribute value{" "}
                        {JSON.stringify(
                          resolvePathOnObject(formik.values, attributeRootLessListKeyArray),
                          null,
                          2
                        )}
                      </div>
                      <div key="3">attribute name {attribute[0]}</div>
                      <div>
                        object value <pre>{JSON.stringify(currentValue, null, 2)}</pre>
                      </div>
                      <div>
                        attribute value{" "}
                        <pre>{JSON.stringify(currentValue[attribute[0]], null, 2)}</pre>
                      </div>
                      <div key="5">
                        rawJzodSchema:{" "}
                        <pre>{JSON.stringify(props.rawJzodSchema, null, 2)}</pre>
                      </div>
                      <div key="6"></div>
                      resolved type:{" "}
                      <pre>
                        {JSON.stringify(localResolvedElementJzodSchemaBasedOnValue, null, 2)}
                      </pre>
                      <div>error {error.message}</div>
                    </div>
                  </div>
                );
              }}
            >
              <JzodElementEditor
                name={attribute[0]}
                label={editableLabel}
                key={attribute[0]}
                listKey={attributeListKey}
                rootLesslistKey={attributeRootLessListKey}
                rootLesslistKeyArray={[...props.rootLesslistKeyArray, attribute[0]]}
                indentLevel={usedIndentLevel + 1}
                currentDeploymentUuid={props.currentDeploymentUuid}
                rawJzodSchema={attributeRawJzodSchema}
                currentApplicationSection={props.currentApplicationSection}
                resolvedElementJzodSchema={currentAttributeDefinition}
                foreignKeyObjects={props.foreignKeyObjects}
                unionInformation={unionInformation}
                insideAny={props.insideAny}
                optional={definedOptionalAttributes.has(attribute[0])}
              />
            </ErrorBoundary>
          </div>
        );
      });
  }, [
    itemsOrder,
    formik.values,
    props,
    localResolvedElementJzodSchemaBasedOnValue,
    unfoldedRawSchema,
    currentValue,
    unionInformation,
    currentMiroirFundamentalJzodSchema, 
    currentModel,
    miroirMetaModel,
    usedIndentLevel,
    foreignKeyObjects,
    definedOptionalAttributes,
    handleAttributeNameChange
  ]);
  
  return (
    <div id={props.rootLesslistKey} key={props.rootLesslistKey}>
      <div>
        <span
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "start",
          }}
        >
          <span>
            {unfoldedRawSchema.type == "record" ? (
              <span
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignContent: "start",
                  alignItems: "center",
                }}
              >
                <SmallIconButton
                  id={props.rootLesslistKey + ".removeRecordAttribute"}
                  aria-label={props.rootLesslistKey + ".removeRecordAttribute"}
                  onClick={() => {
                    log.info("removeRecordAttribute clicked!", props.rootLesslistKey);
                    const newFormState: any = deleteObjectAtPath(
                      formik.values,
                      props.rootLesslistKeyArray
                    );
                    formik.setValues(newFormState);
                  }}
                >
                  <Clear />
                </SmallIconButton>
                {label}
              </span>
            ) : (
              <span>{label??""}</span>
            )}
          </span>
          <span id={props.rootLesslistKey + "head"} key={props.rootLesslistKey + "head"}>
            <ExpandOrFoldObjectAttributes
              hiddenFormItems={hiddenFormItems}
              setHiddenFormItems={setHiddenFormItems}
              listKey={props.listKey}
            ></ExpandOrFoldObjectAttributes>
            {props.switches ?? <></>}({unfoldedRawSchema.type} /{" "}
            {localResolvedElementJzodSchemaBasedOnValue.type})
          </span>
          <span
            id={props.listKey + ".inner"}
            style={{
              marginLeft: `calc(${indentShift})`,
              display: hiddenFormItems[props.listKey] ? "none" : "block",
            }}
            key={`${props.rootLesslistKey}|body`}
          >
            {unfoldedRawSchema.type == "record" || unfoldedRawSchema.type == "any" ? (
              <span>
                <SizedButton
                  id={props.rootLesslistKey + ".addRecordAttribute"}
                  variant="text"
                  aria-label={props.rootLesslistKey + ".addRecordAttribute"}
                  onClick={addExtraRecordEntry}
                >
                  <SizedAddBox />
                </SizedButton>
              </span>
            ) : (
              <></>
            )}
          </span>
        </span>
        <div>{attributeElements}</div>

        {unfoldedRawSchema.type != "record" && undefinedOptionalAttributes.length > 0 ? (
          <div>
            <SizedButton
              variant="text"
              aria-label={props.rootLesslistKey + ".addObjectOptionalAttribute"}
              onClick={addObjectOptionalAttribute}
            >
              <SizedAddBox />
            </SizedButton>{" "}
            {JSON.stringify(undefinedOptionalAttributes)}
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom prop comparison for React.memo
  return (
    prevProps.listKey === nextProps.listKey &&
    prevProps.rootLesslistKey === nextProps.rootLesslistKey &&
    prevProps.hidden === nextProps.hidden &&
    prevProps.rawJzodSchema?.type === nextProps.rawJzodSchema?.type &&
    JSON.stringify(prevProps.rootLesslistKeyArray) === JSON.stringify(nextProps.rootLesslistKeyArray)
  );
});