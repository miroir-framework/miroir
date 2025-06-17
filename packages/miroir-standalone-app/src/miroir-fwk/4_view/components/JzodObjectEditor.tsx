import { ErrorBoundary } from "react-error-boundary";
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
import { useCallback } from "react";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});


let count: number = 0;
export function JzodObjectEditor(props: JzodObjectEditorProps) {
  const {
    name,
    listKey,
    label,
    rootLesslistKey,
    rootLesslistKeyArray,
    rawJzodSchema,
    currentDeploymentUuid,
    currentApplicationSection,
    // foreignKeyObjects,
    // unionInformation,
    indentLevel,
    resolvedElementJzodSchema, // handleSelectLiteralChange,
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

  if (
    !localResolvedElementJzodSchemaBasedOnValue ||
    localResolvedElementJzodSchemaBasedOnValue.type != "object"
  ) {
    return (
      <div>
        <span className="error">
          JzodObjectEditor: localResolvedElementJzodSchemaBasedOnValue is not an object type:{" "}
          {JSON.stringify(localResolvedElementJzodSchemaBasedOnValue, null, 2)}
        </span>
      </div>
    );
  }
  const currentValue = resolvePathOnObject(formik.values, props.rootLesslistKeyArray);

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
          currentMiroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
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
  // const addObjectOptionalAttribute = async () => {
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
          currentMiroirFundamentalJzodSchema, // context.miroirFundamentalJzodSchema,
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
      // Object.keys(localResolvedElementJzodSchema.definition),
      "newObjectValue",
      newObjectValue,
      "newItemsOrder",
      newItemsOrder,
      "localResolvedElementJzodSchemaBasedOnValue",
      JSON.stringify(localResolvedElementJzodSchemaBasedOnValue, null, 2),
      // "props.resolvedElementJzodSchema",
      // JSON.stringify(props.resolvedElementJzodSchema, null, 2),
      "props.rawJzodSchema",
      JSON.stringify(props.rawJzodSchema, null, 2)
    );
  }, [ props,
    itemsOrder,
    localResolvedElementJzodSchemaBasedOnValue,
    unfoldedRawSchema,
    currentMiroirFundamentalJzodSchema,
    currentModel,
    miroirMetaModel,
    formik.values,
    formik.setFieldValue,
    // props.rawJzodSchema, // TODO: remove this dependency, it is not used in the function
    undefinedOptionalAttributes[0]]);
  // }, [props, itemsOrder, localResolvedElementJzodSchemaBasedOnValue]);
  // #######################
  // #######################
  // #######################
  const removeObjectOptionalAttribute = useCallback(
    (listKey: string) => {
      // const removeObjectOptionalAttribute = (listKey: string) => {
      if (localResolvedElementJzodSchemaBasedOnValue.type != "object") {
        throw "removeObjectOptionalAttribute called for non-object type: " + unfoldedRawSchema.type;
      }

      log.info(
        "removeOptionalAttribute clicked!",
        listKey,
        itemsOrder,
        Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
        "formik",
        formik.values
      );
      const newFormState: any = { ...formik.values };
      delete newFormState[listKey];
      formik.setFormikState(newFormState);
      const currentValue = resolvePathOnObject(newFormState, props.rootLesslistKeyArray);
      log.info(
        "clicked2!",
        listKey,
        itemsOrder,
        Object.keys(localResolvedElementJzodSchemaBasedOnValue.definition),
        "formik",
        formik.values
      );
    },
    [
      props,
      itemsOrder,
      localResolvedElementJzodSchemaBasedOnValue,
      unfoldedRawSchema,
      formik.values,
      formik.setFormikState,
      currentMiroirFundamentalJzodSchema,
      currentModel,
      miroirMetaModel,
    ]
  );
  // #######################
  // #######################
  // #######################
  const handleAttributeNameChange = (event: any, attributeRootLessListKeyArray: string[]) => {
    const localAttributeRootLessListKeyArray: string[] = attributeRootLessListKeyArray.slice();
    const newAttributeName = event.target.value;
    const oldAttributeName =
      localAttributeRootLessListKeyArray[localAttributeRootLessListKeyArray.length - 1];
    log.info(
      "handleAttributeNameChange renaming attribute",
      oldAttributeName,
      "into",
      newAttributeName,
      "called with event",
      event,
      "current Value",
      formik.values,
      "props.rootLesslistKey",
      props.rootLesslistKey,
      "attributeRootLessListKeyArray",
      attributeRootLessListKeyArray,
      attributeRootLessListKeyArray.length,
      // "localAttributeRootLessListKeyArray",
      // localAttributeRootLessListKeyArray,
      // localAttributeRootLessListKeyArray.length,
      "props.resolvedJzodSchema",
      props.resolvedElementJzodSchema
    );
    const subObject = resolvePathOnObject(formik.values, localAttributeRootLessListKeyArray);
    const newFormState1: any = deleteObjectAtPath(
      formik.values,
      localAttributeRootLessListKeyArray
    );
    log.info(
      "handleAttributeNameChange newFormState1",
      newFormState1,
      localAttributeRootLessListKeyArray
    );
    // const newPath = attributeRootLessListKeyArray.slice(0,attributeRootLessListKeyArray.length-1);
    const parentPath = localAttributeRootLessListKeyArray.slice(
      0,
      localAttributeRootLessListKeyArray.length - 1
    );
    const newPath = localAttributeRootLessListKeyArray.slice(
      0,
      localAttributeRootLessListKeyArray.length - 1
    );
    log.info(
      "handleAttributeNameChange newPath before push",
      newPath,
      localAttributeRootLessListKeyArray
    );
    newPath.push(newAttributeName);
    log.info("handleAttributeNameChange newPath", newPath);
    const newFormState2: any = alterObjectAtPath(newFormState1, newPath, subObject);
    log.info("handleAttributeNameChange newFormState2", newFormState2);

    // log.info("handleSelectValueChange called with event", event, "current Value",props.formik.values,"newFormState", newFormState)
    // props.setFormState(newFormState2);
    // formik.setFormikState(newFormState2);
    formik.setValues(newFormState2);
    if (itemsOrder) {
      log.info(
        "handleAttributeNameChange reading path",
        props.rootLesslistKey,
        "from currentParentValue",
        newFormState2,
        "itemsOrder",
        itemsOrder
      );
      const localItemsOrder = itemsOrder.slice();
      const attributePosition = localItemsOrder?.indexOf(oldAttributeName);
      // const newItemsOrder = parentItemsOrder?.splice(uuidPosition,1)
      if (attributePosition != -1) {
        localItemsOrder[attributePosition] = newAttributeName;
      }
      log.info(
        "handleAttributeNameChange for path",
        props.rootLesslistKey,
        "new itemsOrder to be computed should be",
        localItemsOrder
      );
      // setItemsOrder(localItemsOrder);
    } else {
      log.warn("handleAttributeNameChange reading path", parentPath, "itemsOrder is undefined!");
    }
    // log.info(
    //   "handleAttributeNameChange new parent object items order",
    //   parentItemsOrder,
    // );
    // const currentParentValue = resolvePathOnObject(newFormState2,parentPath);
  };
  

  
          //   {unfoldedRawSchema?.type == "record" ? (
          //   <>
          //     {/* <input
          //       id={rootLesslistKey + "Name"}
          //       key={rootLesslistKey + "Name"}
          //       name={rootLesslistKey + "Name"}
          //       onChange={(e) =>
          //         handleAttributeNameChange(e, rootLesslistKeyArray.slice())
          //       }
          //       defaultValue={name}
          //     /> */}
          //   </>
          // ) : (
          //   <label htmlFor={props.rootLesslistKey + "head"}>{label}:</label>
          // )}
  return (
    // result = (
    <div id={props.rootLesslistKey} key={props.rootLesslistKey}>
      <span>
        <label>{label}</label>
        <span id={props.rootLesslistKey + "head"} key={props.rootLesslistKey + "head"}>
          {/* {"{"} */}
          <ExpandOrFoldObjectAttributes
            hiddenFormItems={hiddenFormItems}
            setHiddenFormItems={setHiddenFormItems}
            listKey={props.listKey}
          ></ExpandOrFoldObjectAttributes>
          {props.switches ?? <></>}
          ({unfoldedRawSchema.type} / {localResolvedElementJzodSchemaBasedOnValue.type})
        </span>
        {/* <label htmlFor={props.rootLesslistKey + "head"}>{label}</label> */}
        <div
          id={props.listKey + ".inner"}
          style={{
            marginLeft: `calc(${indentShift})`,
            display: hiddenFormItems[props.listKey] ? "none" : "block",
          }}
          key={`${props.rootLesslistKey}|body`}
        >
          {unfoldedRawSchema.type == "record" || unfoldedRawSchema.type == "any" ? (
            <div>
              <SizedButton
                id={props.rootLesslistKey + ".addRecordAttribute"}
                variant="text"
                aria-label={props.rootLesslistKey + ".addRecordAttribute"}
                onClick={addExtraRecordEntry}
              >
                <SizedAddBox />
              </SizedButton>
              {/* add new record: */}
            </div>
          ) : (
            <></>
          )}
          {itemsOrder
            .map((i): [string, JzodElement] => [
              i,
              formik.values[
                props.rootLesslistKey.length > 0 ? props.rootLesslistKey + "." + i[0] : i[0]
              ],
            ])
            .map((attribute: [string, JzodElement], attributeNumber: number) => {
              const currentAttributeDefinition =
                localResolvedElementJzodSchemaBasedOnValue.definition[attribute[0]];
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

              // switch (rawJzodSchema?.type) {
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
                  // const subDiscriminator: string = (unfoldedRawSchema as any).subDiscriminator;
                  // log.info(
                  //   "JzodElementEditor object with discrimitated union:",
                  //   props.listKey,
                  //   "attribute",
                  //   attribute[0],
                  //   "attributeListkey",
                  //   attributeListKey,
                  //   "currentValue",
                  //   currentValue,
                  //   // JSON.stringify(currentValue, null, 2),
                  //   "resolvedElementJzodSchema",
                  //   props.resolvedElementJzodSchema,
                  //   "rawJzodSchema",
                  //   props.rawJzodSchema,
                  // );
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
                          // JSON.stringify(unfoldedRawSchema, null, 2) +
                          unfoldedRawSchema +
                          " " +
                          localResolvedElementJzodSchemaBasedOnValue
                      );
                    }
                    const discriminator: string = (unfoldedRawSchema as any).discriminator;
                    const discriminatorValue = currentValue[discriminator];
                    // log.info(
                    //   "############### discriminator",
                    //   discriminator,
                    //   "discriminatorValue",
                    //   discriminatorValue,
                    //   "possibleObjectTypes",
                    //   JSON.stringify(possibleObjectTypes, null, 2),
                    //   "attribute",
                    //   JSON.stringify(attribute, null, 2),
                    // );
                    // discriminator only
                    // TODO: remove duplication from JzodUnfoldSchemaForValue. This is a core functionality, finding the concrete type for a value in a union.
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
                  break;
                }
              }              // Button display is now handled in JzodElementEditor
              return (
                <div key={attributeListKey}>
                  {/* {unfoldedRawSchema?.type == "record" ? (
                    <>
                      <input
                        id={attributeListKey + "Name"}
                        key={attributeListKey + "Name"}
                        // name={attributeListKey + "Name"}
                        name={attributeRootLessListKey + "Name"}
                        onChange={(e) =>
                          handleAttributeNameChange(e, attributeRootLessListKeyArray.slice())
                        }
                        defaultValue={attribute[0]}
                      />
                    </>
                  ) : (
                    <label htmlFor={attributeListKey}>{attributeDisplayedLabel}:</label>
                  )} */}
                  <ErrorBoundary
                    // FallbackComponent={Fallback}
                    FallbackComponent={({ error, resetErrorBoundary }: any) => {
                      // Call resetErrorBoundary() to reset the error boundary and retry the render.
                      log.error(
                        "Object errorboundary for",
                        attributeListKey,
                        "currentValue",
                        currentValue
                      );
                      return (
                        <div role="alert">
                          <div style={{ color: "red" }}>
                            <p>Something went wrong:</p>
                            <div key="1">object {props.listKey}</div>
                            <div key="2">attribute {attributeListKey}</div>
                            <div>
                              value <pre>{JSON.stringify(currentValue, null, 2)}</pre>
                            </div>
                            <div key="3">
                              rawJzodSchema:{" "}
                              <pre>{JSON.stringify(props.rawJzodSchema, null, 2)}</pre>
                            </div>
                            <div key="4"></div>
                            resolved type:{" "}
                            <pre>
                              {JSON.stringify(localResolvedElementJzodSchemaBasedOnValue, null, 2)}
                            </pre>
                            {/* resolved type {JSON.stringify(localResolvedElementJzodSchema)} */}
                            <div key="5">error {error.message}</div>
                          </div>
                        </div>
                      );
                    }}
                    // onReset={(details:any) => {
                    //   // Reset the state of your app so the error doesn't happen again
                    // }}
                  >
                    <JzodElementEditor
                      name={attribute[0]}
                      label={currentAttributeDefinition?.tag?.value?.defaultLabel || attribute[0]}
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
            })}
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
      </span>
      {/* <br /> */}
      {/* <div style={{ marginLeft: `calc(${indentShift})` }}>{"}"}</div> */}
    </div>
  );
}