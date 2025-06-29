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
  ResolvedJzodSchemaReturnType,
} from "miroir-core";

import { indentShift } from "./JzodArrayEditor";
import { ExpandOrFoldObjectAttributes, JzodElementEditor } from "./JzodElementEditor";
import { useJzodElementEditorHooks } from "./JzodElementEditorHooks";
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

// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
// ##############################################################################################
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
    jzodSchemaTooltip,
    displayAsStructuredElementSwitch,
    deleteButton,
    parentType, // used to control the parent type of the element, used for record elements
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
    discriminatedSchemaForObject,
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
  } = useJzodElementEditorHooks(props, count, "JzodElementEditor");

  const currentMiroirFundamentalJzodSchema = context.miroirFundamentalJzodSchema;
  const usedIndentLevel: number = indentLevel ? indentLevel : 0;

  // Early return if component can't be rendered properly
  const canRenderObject = useMemo(() => {
    if (!localResolvedElementJzodSchemaBasedOnValue || 
        localResolvedElementJzodSchemaBasedOnValue.type !== "object") {
      return false;
    }
    return true;
  }, [localResolvedElementJzodSchemaBasedOnValue]);

  const currentValue = useMemo(() => 
    resolvePathOnObject(formik.values, rootLesslistKeyArray), 
    [formik.values, rootLesslistKeyArray]
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
      rootLesslistKey,
      itemsOrder,
      Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
      "formik",
      formik.values
    );
    if (unfoldedRawSchema.type != "record" || rawJzodSchema?.type != "record") {
      throw "addExtraRecordEntry called for non-record type: " + unfoldedRawSchema.type;
    }

    const newAttributeType: JzodElement = (rawJzodSchema as JzodRecord)?.definition;
    log.info("addExtraRecordEntry newAttributeType", JSON.stringify(newAttributeType, null, 2));
    const newAttributeValue = currentMiroirFundamentalJzodSchema
      ? getDefaultValueForJzodSchemaWithResolution(
          unfoldedRawSchema.definition,
          currentMiroirFundamentalJzodSchema,
          currentModel,
          miroirMetaModel
        )
      : undefined;

    const currentValue = resolvePathOnObject(formik.values, rootLesslistKeyArray);
    const newRecordValue: any = { ["newRecordEntry"]: newAttributeValue, ...currentValue };
    log.info("addExtraRecordEntry", "newValue", newRecordValue);

    const newItemsOrder = getItemsOrder(newRecordValue, rawJzodSchema);
    log.info("addExtraRecordEntry", "itemsOrder", itemsOrder, "newItemsOrder", newItemsOrder);

    formik.setFieldValue(rootLesslistKey, newRecordValue);
    log.info(
      "addExtraRecordEntry clicked2!",
      listKey,
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
      listKey,
      itemsOrder,
      Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
      "formik",
      formik.values,
      // "unfoldedrawSchema",
      // JSON.stringify(unfoldedRawSchema, null, 2),
      // "discriminatedSchemaForObject",
      // JSON.stringify(discriminatedSchemaForObject, null, 2),
      "undefinedOptionalAttributes",
      undefinedOptionalAttributes
    );
    const currentObjectValue = resolvePathOnObject(formik.values, rootLesslistKeyArray);
    // const newAttributeType: JzodElement = resolvePathOnObject(rawJzodSchema, [
    // const newAttributeType: JzodElement = resolvePathOnObject(unfoldedRawSchema, [
    const newAttributeType: JzodElement = resolvePathOnObject(discriminatedSchemaForObject??unfoldedRawSchema, [
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
    const newItemsOrder = getItemsOrder(newObjectValue, discriminatedSchemaForObject??unfoldedRawSchema);

    log.info(
      "addObjectOptionalAttribute clicked2!",
      listKey,
      itemsOrder,
      Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
      "newAttributeType",
      newAttributeType,
      "newObjectValue",
      newObjectValue,
      "newItemsOrder",
      newItemsOrder,
    );
    if (rootLesslistKey) {
      formik.setFieldValue(rootLesslistKey, newObjectValue, false);
    } else {
      formik.setValues(newObjectValue, false);
    }
    log.info(
      "addObjectOptionalAttribute clicked3 DONE!",
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

  const deleteElement = (rootLesslistKeyArray: (string | number)[]) => () => {
    if (rootLesslistKeyArray.length > 0) {
      const newFormState: any = deleteObjectAtPath(formik.values, rootLesslistKeyArray);
      formik.setValues(newFormState);
      log.info("Removed optional attribute:", rootLesslistKeyArray.join('.'));
    }
  };
  
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
          rootLesslistKey.length > 0 ? rootLesslistKey + "." + i[0] : i[0]
        ],
      ])
      .map((attribute: [string, JzodElement], attributeNumber: number) => {
        const currentAttributeDefinition =
          (localResolvedElementJzodSchemaBasedOnValue as JzodObject).definition[attribute[0]];
        const attributeListKey = listKey + "." + attribute[0];
        const attributeRootLessListKey =
          rootLesslistKey.length > 0
            ? rootLesslistKey + "." + attribute[0]
            : attribute[0];
        const attributeRootLessListKeyArray =
          rootLesslistKeyArray.length > 0
            ? [...rootLesslistKeyArray, attribute[0]]
            : [attribute[0]];

        let attributeRawJzodSchema: JzodElement;

        if (!unfoldedRawSchema) {
          throw new Error(
            "JzodElementEditor unfoldedRawSchema undefined for object " +
              listKey +
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
                        no discriminator value found in union for object {listKey}{" "}
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
                  listKey +
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
                    listKey +
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
                listKey +
                " attribute " +
                attribute[0] +
                " attributeListKey " +
                attributeListKey +
                " unfoldedRawSchema?.type " +
                unfoldedRawSchema?.type
            );
          }
        }
        let unfoldedAttributeRawSchemaReturnType: ResolvedJzodSchemaReturnType | undefined;
        try {
          unfoldedAttributeRawSchemaReturnType = {
            ...(context.miroirFundamentalJzodSchema
              ? unfoldJzodSchemaOnce(
                  context.miroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
                  attributeRawJzodSchema,
                  currentModel,
                  miroirMetaModel
                )
              : {}),
            valuePath: [],
            typePath: [],
          } as any;
          undefined;
        } catch (e) {
          throw e as Error; // rethrow the error to be caught by the error boundary
        }
        if (
          !unfoldedAttributeRawSchemaReturnType ||
          unfoldedAttributeRawSchemaReturnType.status == "error"
        ) {
          throw new Error(
            "JzodElementEditor could not unfold raw schema " +
              "error " +
              JSON.stringify(unfoldedAttributeRawSchemaReturnType, null, 2) +
              " props.rawJzodSchema " +
              JSON.stringify(props.rawJzodSchema, null, 2) +
              // props.rawJzodSchema +
              " count " +
              count +
              " result " +
              // JSON.stringify(unfoldedRawSchemaReturnType, null, 2) +
              unfoldedAttributeRawSchemaReturnType +
              " miroirFundamentalJzodSchema " +
              context.miroirFundamentalJzodSchema
            // JSON.stringify(currentMiroirFundamentalJzodSchema, null, 2)
          );
        }
        const unfoldedAttributeRawSchema: JzodElement = unfoldedAttributeRawSchemaReturnType.element;

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
                  error
                );
                return (
                  <div role="alert">
                    <div style={{ color: "red" }}>
                      <p>Something went wrong:</p>
                      <div key="1">object {rootLesslistKey}</div>
                      <div key="2">attribute {attributeRootLessListKeyArray.join(".")}</div>
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
                        rawJzodSchema: <pre>{JSON.stringify(rawJzodSchema, null, 2)}</pre>
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
              {/* <pre>
                {attributeRootLessListKey}: {JSON.stringify(unfoldedAttributeRawSchema, null, 2)}
              </pre> */}
              <JzodElementEditor
                name={attribute[0]}
                label={editableLabel}
                key={attribute[0]}
                listKey={attributeListKey}
                rootLesslistKey={attributeRootLessListKey}
                rootLesslistKeyArray={[...rootLesslistKeyArray, attribute[0]]}
                indentLevel={usedIndentLevel + 1}
                currentDeploymentUuid={currentDeploymentUuid}
                rawJzodSchema={attributeRawJzodSchema}
                currentApplicationSection={currentApplicationSection}
                resolvedElementJzodSchema={currentAttributeDefinition}
                foreignKeyObjects={foreignKeyObjects}
                unionInformation={unionInformation}
                insideAny={insideAny}
                optional={definedOptionalAttributes.has(attribute[0])}
                parentType={unfoldedRawSchema?.type}
                deleteButton={
                  <>
                  {/* {attributeRootLessListKey}#{unfoldedAttributeRawSchema.type}.{unfoldedAttributeRawSchema.optional? "optional" : "required"} */}
                  <SmallIconButton
                    id={attributeRootLessListKey + "-removeOptionalAttributeOrRecordEntry"}
                    aria-label={attributeRootLessListKey + "-removeOptionalAttributeOrRecordEntry"}
                    onClick={deleteElement(attributeRootLessListKeyArray)}
                    style={{ padding: 0, visibility: isRecordType || definedOptionalAttributes.has(attribute[0])? "visible" : "hidden" }}
                  >
                    <Clear />
                    {/* <Clear /> */}
                  </SmallIconButton>
                  </>
                }
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
    <div id={rootLesslistKey} key={rootLesslistKey}>
      <div>
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
                {deleteButton ?? <></>}
                {label}
              </span>
            {/* ) : (
              <span>{label ?? ""}</span>
            )} */}
          </span>
          <span id={rootLesslistKey + "head"} key={rootLesslistKey + "head"}>
            <ExpandOrFoldObjectAttributes
              hiddenFormItems={hiddenFormItems}
              setHiddenFormItems={setHiddenFormItems}
              listKey={listKey}
            ></ExpandOrFoldObjectAttributes>
            {displayAsStructuredElementSwitch ?? <></>}({parentType} / {unfoldedRawSchema.type} /{" "}
            {localResolvedElementJzodSchemaBasedOnValue.type})
          </span>
          <span
            id={listKey + ".inner"}
            style={{
              marginLeft: `calc(${indentShift})`,
              display: hiddenFormItems[listKey] ? "none" : "block",
            }}
            key={`${rootLesslistKey}|body`}
          >
            {unfoldedRawSchema.type == "record" || unfoldedRawSchema.type == "any" ? (
              <span>
                <SizedButton
                  id={rootLesslistKey + ".addRecordAttribute"}
                  variant="text"
                  aria-label={rootLesslistKey + ".addRecordAttribute"}
                  onClick={addExtraRecordEntry}
                >
                  <SizedAddBox />
                </SizedButton>
              </span>
            ) : (
              <></>
            )}
            <span>
              {unfoldedRawSchema.type != "record" && undefinedOptionalAttributes.length > 0 ? (
                <span>
                  <SizedButton
                    variant="text"
                    aria-label={rootLesslistKey + ".addObjectOptionalAttribute"}
                    onClick={addObjectOptionalAttribute}
                  >
                    <SizedAddBox />
                  </SizedButton>{" "}
                  <pre>
                    {JSON.stringify(undefinedOptionalAttributes, null, 2)}
                    {/* {undefinedOptionalAttributes.join(", ")} */}
                  </pre>
                </span>
              ) : (
                <></>
              )}
            </span>
          </span>
          {jzodSchemaTooltip ?? <></>}
        </span>
        {/* <div>ICIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII</div> */}
        {/* <div>definedOptionalAttributes: {Array.from(definedOptionalAttributes).join(", ")}</div> */}
        {/* <div>undefinedOptionalAttributes: {Array.from(undefinedOptionalAttributes).join(", ")}</div> */}
        {/* <div><pre>{JSON.stringify(unfoldedRawSchema, null, 2)}</pre></div> */}
        {/* <div>resolvedElement:<pre>{JSON.stringify(resolvedElementJzodSchema, null, 2)}</pre></div> */}
        {/* <div>resolvedElement:<pre>{JSON.stringify(localResolvedElementJzodSchemaBasedOnValue, null, 2)}</pre></div> */}
        <div>{attributeElements}</div>
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