import { ErrorBoundary, withErrorBoundary } from "react-error-boundary";

import Clear from "@mui/icons-material/Clear";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Checkbox from "@mui/material/Checkbox";

import {
  EntityAttribute,
  EntityInstance,
  EntityInstanceWithName,
  JzodElement,
  JzodEnum,
  JzodLiteral,
  JzodObject,
  JzodRecord,
  LoggerInterface,
  MiroirLoggerFactory,
  alterObjectAtPath,
  deleteObjectAtPath,
  getDefaultValueForJzodSchemaWithResolution,
  mStringify,
  resolvePathOnObject,
  unfoldJzodSchemaOnce
} from "miroir-core";

import { MenuItem } from "@mui/material";
import { packageName } from "../../../constants.js";
import { cleanLevel } from "../constants.js";
import { JzodAnyEditor } from "./JzodAnyEditor.js";
import { JzodArrayEditor, indentShift } from "./JzodArrayEditor.js";
import { getJzodElementEditorHooks } from "./JzodElementEditorHooks.js";
import { JzodElementEditorProps } from "./JzodElementEditorInterface.js";
import { JzodEnumEditor } from "./JzodEnumEditor.js";
import { JzodLiteralEditor } from "./JzodLiteralEditor.js";
import {
  LineIconButton,
  SizedAddBox,
  SizedButton,
  SmallIconButton,
  StyledSelect,
  getItemsOrder,
} from "./Style.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JzodElementEditor")
).then((logger: LoggerInterface) => {
  log = logger;
});

// #####################################################################################################
export type JzodObjectFormEditorInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

// ################################################################################################
export const ExpandOrFoldObjectAttributes = (props: {
  hiddenFormItems: { [k: string]: boolean };
  // setHiddenFormItems: any,
  setHiddenFormItems: React.Dispatch<
    React.SetStateAction<{
      [k: string]: boolean;
    }>
  >;
  listKey: string;
}): JSX.Element => {
  return (
    <LineIconButton
      style={{
        border: 0,
        backgroundColor: "transparent",
      }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        props.setHiddenFormItems({
          ...props.hiddenFormItems,
          [props.listKey]: props.hiddenFormItems[props.listKey] ? false : true,
        });
      }}
    >
      {props.hiddenFormItems[props.listKey] ? (
        <ExpandMore sx={{ color: "darkgreen" }} />
      ) : (
        // <ExpandMore sx={{ color: "darkred",maxWidth: "15px", maxHeight: "15px" }} />
        // <ExpandLess sx={{ maxWidth: "15px", maxHeight: "15px" }} />
        <ExpandLess />
      )}
    </LineIconButton>
  );
};

// // #####################################################################################################
// function Fallback({ error, resetErrorBoundary }: any) {
//   // Call resetErrorBoundary() to reset the error boundary and retry the render.

//   return (
//     <div role="alert">
//       <p>Something went wrong:</p>
//       <pre style={{ color: "red" }}>{error.message}</pre>
//     </div>
//   );
// }

// #####################################################################################################
const objectTypes: string[] = ["record", "object", "union"];
const enumTypes: string[] = ["enum", "literal"];

// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
let count = 0;

// export const JzodElementEditor = (props: JzodObjectEditorProps): JSX.Element => {
export function JzodElementEditor(props: JzodElementEditorProps): JSX.Element {
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
  // let result: JSX.Element = <></>;

  log.info("#####################################################################################");
  // log.info(
  //   "JzodElementEditor rendering for",
  //   props.listKey,
  //   "count",
  //   count,
  //   "formik.values",
  //   formik.values,
  //   // JSON.stringify(formik.values, null, 2),
  //   "props.rawJzodSchema",
  //   props.rawJzodSchema,
  //   // JSON.stringify(props.rawJzodSchema, null, 2),
  // );

  const currentValue = resolvePathOnObject(formik.values, props.rootLesslistKeyArray);

  if (localResolvedElementJzodSchemaBasedOnValue && props.rawJzodSchema) {
    if (
      props.rawJzodSchema?.type != "any" &&
      localResolvedElementJzodSchemaBasedOnValue.type != props.rawJzodSchema?.type &&
      ((localResolvedElementJzodSchemaBasedOnValue.type == "object" &&
        !objectTypes.includes(props.rawJzodSchema.type)) ||
        (props.rawJzodSchema.type == "enum" &&
          // !enumTypes.includes(localResolvedElementJzodSchema.type)))
          !enumTypes.includes(localResolvedElementJzodSchemaBasedOnValue.type)))
    ) {
      throw new Error(
        "JzodElementEditor mismatching jzod schemas, resolved schema " +
          JSON.stringify(props.resolvedElementJzodSchema, null, 2) +
          " raw schema " +
          JSON.stringify(props.rawJzodSchema, null, 2)
      );
    }

    if (recursivelyUnfoldedRawSchema && recursivelyUnfoldedRawSchema.status == "error") {
      return (
        <div>
          <p>
            Error unfolding union schema {props.listKey} {count}:
          </p>
          <pre style={{ color: "red" }}>
            {JSON.stringify(recursivelyUnfoldedRawSchema, null, 2)}
          </pre>
        </div>
      );
    }

    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // uses setFormState to update the formik state
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
      formik.setFormikState(newFormState2);
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

    if (props.returnsEmptyElement) {
      return <></>;
    }

    if (props.rawJzodSchema?.type == "any" && !props.insideAny) {
      return (
        <JzodAnyEditor
          name={props.name}
          listKey={props.listKey}
          rootLesslistKey={props.rootLesslistKey}
          rootLesslistKeyArray={props.rootLesslistKeyArray}
          rawJzodSchema={props.rawJzodSchema}
          currentDeploymentUuid={props.currentDeploymentUuid}
          currentApplicationSection={props.currentApplicationSection}
          unionInformation={unionInformation}
          resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
          label={props.label}
          foreignKeyObjects={props.foreignKeyObjects}
        ></JzodAnyEditor>
      );
    }

    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // #######################
    // uses setFormState to update the formik state
    // const addExtraRecordEntry = useCallback(async () => {
    const addExtraRecordEntry = async () => {
      if (localResolvedElementJzodSchemaBasedOnValue.type != "object") {
        throw (
          "addExtraRecordEntry called for non-object type: " +
          localResolvedElementJzodSchemaBasedOnValue.type
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
    };

    // #######################
    // #######################
    // #######################
    // const addObjectOptionalAttribute = useCallback(async () => {
    const addObjectOptionalAttribute = async () => {
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
    };
    // }, [props, itemsOrder, localResolvedElementJzodSchemaBasedOnValue]);
    // #######################
    // #######################
    // #######################
    // const removeObjectOptionalAttribute = useCallback(
    const removeObjectOptionalAttribute = (listKey: string) => {
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
    };
    //   ,
    //   [props, itemsOrder, localResolvedElementJzodSchemaBasedOnValue]
    // );
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    // ############################################################################################
    switch (localResolvedElementJzodSchemaBasedOnValue.type) {
      case "object": {
        // ########################################################################################
        return (
          // result = (
          <div id={props.rootLesslistKey} key={props.rootLesslistKey}>
            <span id={props.rootLesslistKey} key={props.rootLesslistKey + "head"}>
              <span>
                {"{"}
                <ExpandOrFoldObjectAttributes
                  hiddenFormItems={hiddenFormItems}
                  setHiddenFormItems={setHiddenFormItems}
                  listKey={props.listKey}
                ></ExpandOrFoldObjectAttributes>
                {localResolvedElementJzodSchemaBasedOnValue.type} {unfoldedRawSchema.type}
              </span>
              <div
                id={props.listKey + ".inner"}
                style={{
                  marginLeft: `calc(${indentShift})`,
                  display: hiddenFormItems[props.listKey] ? "none" : "block",
                }}
                key={`${props.rootLesslistKey}|body`}
              >
                {unfoldedRawSchema.type == "record"  || unfoldedRawSchema.type == "any"? (
                  <div>
                    <SizedButton
                      variant="text"
                      aria-label={props.rootLesslistKey + ".addRecordAttribute"}
                      onClick={addExtraRecordEntry}
                    >
                      <SizedAddBox />
                    </SizedButton>
                    add new record:
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
                          unionInformation?.objectBranches.filter((a: any) => a.type == "object") ??
                          []; // useless??

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
                          const resolvedConcreteObjectJzodSchemaTmp =
                            currentMiroirFundamentalJzodSchema
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

                        // if (attribute[0] == discriminator) {
                        //   attributeRawJzodSchema =
                        //     currentAttributeDefinition.type == "enum"
                        //       ? currentAttributeDefinition
                        //       : { type: "literal", definition: "literal" }; // definition is not taken into account, possible values come from unionInformation
                        // } else {
                        attributeRawJzodSchema =
                          resolvedConcreteObjectJzodSchema.definition[attribute[0]];
                        // }

                        // log.info(
                        //   "JzodElementEditor attribute for object",
                        //   currentValue,
                        //   "listKey",
                        //   props.listKey,
                        //   "attribute",
                        //   attribute[0],
                        //   "attributeListkey",
                        //   attributeListKey,
                        //   "props.resolvedElementJzodSchema",
                        //   props.resolvedElementJzodSchema,
                        //   "unfoldedRawSchema",
                        //   unfoldedRawSchema,
                        //   "resolvedConcreteObjectJzodSchema",
                        //   resolvedConcreteObjectJzodSchema,
                        //   "attributeRawJzodSchema",
                        //   attributeRawJzodSchema,
                        // );
                        // log.info("unfoldedRawSchema",unfoldedRawSchema,"attributeRawJzodSchema", attributeRawJzodSchema)
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
                    }
                    const attributeCanBeRemoved = definedOptionalAttributes.has(attribute[0])
                      ? "visible"
                      : "hidden";
                    return (
                      <div
                        key={attributeListKey}
                      >
                        <SmallIconButton
                          onClick={() => removeObjectOptionalAttribute(attributeRootLessListKey)}
                          style={{ visibility: attributeCanBeRemoved, padding: 0 }}
                        >
                          <Clear />
                        </SmallIconButton>
                        {unfoldedRawSchema?.type == "record" ? (
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
                            {/* attributeName for {attributeRootLessListKeyArray} */}
                          </>
                        ) : (
                          <label htmlFor={attributeListKey}>{attributeDisplayedLabel}:</label>
                        )}
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
                                <p>Something went wrong:</p>
                                <div style={{ color: "red" }}>
                                  <div key="1">object {props.listKey}</div>
                                  <div key="2">attribute {attributeListKey}</div>
                                  value {JSON.stringify(currentValue)}
                                  <div key="3"></div>
                                  resolved type{" "}
                                  {JSON.stringify(localResolvedElementJzodSchemaBasedOnValue)}
                                  {/* resolved type {JSON.stringify(localResolvedElementJzodSchema)} */}
                                  <div key="4">error {error.message}</div>
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
                            key={attribute[0]}
                            listKey={attributeListKey}
                            rootLesslistKey={attributeRootLessListKey}
                            rootLesslistKeyArray={[...props.rootLesslistKeyArray, attribute[0]]}
                            indentLevel={usedIndentLevel + 1}
                            label={currentAttributeDefinition?.tag?.value?.defaultLabel}
                            currentDeploymentUuid={props.currentDeploymentUuid}
                            rawJzodSchema={attributeRawJzodSchema}
                            currentApplicationSection={props.currentApplicationSection}
                            resolvedElementJzodSchema={currentAttributeDefinition}
                            foreignKeyObjects={props.foreignKeyObjects}
                            unionInformation={unionInformation}
                            insideAny={props.insideAny}
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
            <br />
            <div style={{ marginLeft: `calc(${indentShift})` }}>
              {"}"}
            </div>
          </div>
        );
        break;
      }
      // DONE
      case "tuple":
      case "array": {
        return (
          // <div key={props.rootLesslistKey}>
          //   {invisibleEditor}
          <JzodArrayEditor
            {...props}
            key={props.rootLesslistKey}
            rootLesslistKeyArray={props.rootLesslistKeyArray}
            rootLesslistKey={props.rootLesslistKey}
            rawJzodSchema={props.rawJzodSchema as any}
            itemsOrder={itemsOrder}
            hiddenFormItems={hiddenFormItems}
            setHiddenFormItems={setHiddenFormItems}
            currentApplicationSection={props.currentApplicationSection}
            currentDeploymentUuid={props.currentDeploymentUuid}
            foreignKeyObjects={props.foreignKeyObjects}
            unionInformation={props.unionInformation}
            insideAny={props.insideAny}
          ></JzodArrayEditor>
          // </div>
        );
        break;
      }
      case "boolean": {
        log.info(
          "JzodElementEditor boolean!",
          props.listKey,
          "formik.getFieldProps",
          mStringify(formik.getFieldProps(props.rootLesslistKey)),
          "formik.values[props.rootLesslistKey]",
          formik.values[props.rootLesslistKey]
        );
        const fieldProps = formik.getFieldProps(props.rootLesslistKey);
        return (
          // result = (
          <Checkbox
            // defaultChecked={formik.values[props.rootLesslistKey]}
            id={props.rootLesslistKey}
            key={props.rootLesslistKey}
            aria-label={props.rootLesslistKey}
            {...fieldProps}
            name={props.rootLesslistKey}
            checked={fieldProps.value}
          />
        );
        break;
      }
      case "number": {
        // log.info("JzodElementEditor number!", props.listKey, "formState", props.formState);
        return (
          // result = (
          <input
            type="number"
            id={props.rootLesslistKey}
            key={props.rootLesslistKey}
            role="textbox"
            {...formik.getFieldProps(props.rootLesslistKey)}
          />
        );
        break;
      }
      case "bigint": {
        return (
          // result = (
          <input
            type="text"
            id={props.rootLesslistKey}
            key={props.rootLesslistKey}
            role="textbox"
            {...formik.getFieldProps(props.rootLesslistKey)}
            value={currentValue.toString()} // Convert bigint to string
            onChange={(e) => {
              const value = e.target.value;
              formik.setFieldValue(props.rootLesslistKey, value ? BigInt(value) : BigInt(0)); // Convert string back to bigint
            }}
          />
        );
        break;
      }
      case "string": {
        return (
          // result = (
          <input
            type="text"
            role="textbox"
            id={props.rootLesslistKey}
            key={props.rootLesslistKey}
            {...formik.getFieldProps(props.rootLesslistKey)}
          />
        );
        break;
      }
      case "uuid": {
        return localResolvedElementJzodSchemaBasedOnValue.tag?.value?.targetEntity ? (
          // result = localResolvedElementJzodSchemaBasedOnValue.tag?.value?.targetEntity ? (
          <StyledSelect
            id={props.rootLesslistKey}
            key={props.rootLesslistKey}
            aria-label={props.rootLesslistKey}
            labelId="demo-simple-select-label"
            variant="standard"
            {...formik.getFieldProps(props.rootLesslistKey)}
            name={props.rootLesslistKey}
          >
            {stringSelectList.map((e: [string, EntityInstance], index: number) => (
              <MenuItem id={props.rootLesslistKey + "." + index} key={e[1].uuid} value={e[1].uuid}>
                {(e[1] as EntityInstanceWithName).name}
              </MenuItem>
            ))}
          </StyledSelect>
        ) : (
          <input
            type="text"
            id={props.rootLesslistKey}
            key={props.rootLesslistKey}
            role="textbox"
            {...formik.getFieldProps(props.rootLesslistKey)}
          />
        );
        break;
      }
      // DONE
      case "literal": {
        return (
          // result = (
          <JzodLiteralEditor
            name={props.name}
            key={props.rootLesslistKey}
            currentApplicationSection={props.currentApplicationSection}
            currentDeploymentUuid={props.currentDeploymentUuid}
            listKey={props.listKey}
            rootLesslistKey={props.rootLesslistKey}
            rootLesslistKeyArray={props.rootLesslistKeyArray}
            foreignKeyObjects={props.foreignKeyObjects}
            rawJzodSchema={props.rawJzodSchema as JzodLiteral}
            resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
            label={props.label}
            unionInformation={props.unionInformation}
            insideAny={props.insideAny}
            // setParentResolvedElementJzodSchema={setLocalResolvedElementJzodSchema}
          />
        );
      }
      // DONE
      case "enum": {
        const enumValues: string[] =
          // (localResolvedElementJzodSchema && localResolvedElementJzodSchema.definition) ||
          (localResolvedElementJzodSchemaBasedOnValue &&
            localResolvedElementJzodSchemaBasedOnValue.definition) ||
          (props.rawJzodSchema && ((props.rawJzodSchema as any).definition ?? [])) ||
          [];
        return (
          // result = (
          <JzodEnumEditor
            name={props.name}
            label={props.label}
            key={props.rootLesslistKey}
            listKey={props.listKey}
            rootLesslistKey={props.rootLesslistKey}
            rootLesslistKeyArray={props.rootLesslistKeyArray}
            rawJzodSchema={props.rawJzodSchema as any}
            resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
            foreignKeyObjects={props.foreignKeyObjects}
            currentApplicationSection={props.currentApplicationSection}
            currentDeploymentUuid={props.currentDeploymentUuid}
            enumValues={enumValues}
            unionInformation={unionInformation}
            forceTestingMode={props.forceTestingMode}
            insideAny={props.insideAny}
          />
        );
        break;
      }
      case "undefined":
      case "any": {
        return (
          // JzodAnyEditor
          <JzodAnyEditor
            name={props.name}
            label={props.label}
            key={props.rootLesslistKey}
            listKey={props.listKey}
            rootLesslistKey={props.rootLesslistKey}
            rootLesslistKeyArray={props.rootLesslistKeyArray}
            foreignKeyObjects={props.foreignKeyObjects}
            currentApplicationSection={props.currentApplicationSection}
            currentDeploymentUuid={props.currentDeploymentUuid}
            rawJzodSchema={props.rawJzodSchema as JzodLiteral}
            resolvedElementJzodSchema={localResolvedElementJzodSchemaBasedOnValue}
            unionInformation={props.unionInformation}
            insideAny={props.insideAny}
          />
        );
        break;
      }
      case "function":
      case "lazy":
      case "intersection":
      case "map":
      case "promise":
      case "record":
      case "schemaReference":
      case "set":
      case "union":
      case "never":
      case "null":
      case "unknown":
      case "void":
      case "date":
      // case "tuple":
      default: {
        return (
          <span>
            default case: {localResolvedElementJzodSchemaBasedOnValue.type}, for {props.listKey}{" "}
            values{" "}
            {/* default case: {localResolvedElementJzodSchema.type}, for {props.listKey} values{" "} */}
            <pre>{JSON.stringify(currentValue, null, 2)}</pre>
            <br />
            <pre>
              resolved Jzod schema: {JSON.stringify(props.resolvedElementJzodSchema, null, 2)}
            </pre>
            <pre>raw Jzod schema: {JSON.stringify(props.rawJzodSchema, null, 2)}</pre>
            {/* <div>
              found schema: {JSON.stringify(props.resolvedJzodSchema, null, 2)}
            </div>
            <div>
              for object: {JSON.stringify(props.initialValuesObject, null, 2)}
            </div> */}
          </span>
        );
        break;
      }
    }
  } else {
    return (
      <div>
        Could not find schema for item: {props.rootLesslistKey}
        <br />
        value {formik.values[props.rootLesslistKey]}
        <br />
        raw Jzod schema: {JSON.stringify(props.rawJzodSchema)}
        <br />
        resolved schema: {JSON.stringify(localResolvedElementJzodSchemaBasedOnValue)}
      </div>
    );
  }
  // return result;
}

export const JzodObjectEditorWithErrorBoundary = withErrorBoundary(JzodElementEditor, {
  fallback: <div>Something went wrong</div>,
  onError(error, info) {
    log.error("JzodElementEditor error", error);
    // Do something with the error
    // E.g. log to an error logging client here
  },
});
