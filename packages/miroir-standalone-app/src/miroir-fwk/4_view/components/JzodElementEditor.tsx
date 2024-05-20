import AddBoxIcon from '@mui/icons-material/AddBox';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Button, Checkbox } from "@mui/material";
import styled from "@emotion/styled";

import { useState } from "react";

// import { FieldValues, UseFormRegister, UseFormSetValue, useFormContext } from "react-hook-form";


import {
  ApplicationSection,
  EntityAttribute,
  EntityInstance,
  EntityInstanceWithName,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Uuid,
  adminConfigurationDeploymentMiroir,
  getLoggerName,
  getMiroirFundamentalJzodSchema,
  unfoldJzodSchemaOnce
} from "miroir-core";

import { packageName } from "../../../constants";
import { useMiroirContextService, useMiroirContextformHelperState } from "../MiroirContextReactProvider";
import { cleanLevel } from "../constants";
import { useCurrentModel } from '../ReduxHooks';
import { JzodRecord, JzodUnion } from 'miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType';


const loggerName: string = getLoggerName(packageName, cleanLevel,"JzodElementEditor");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export const noValue = { uuid: "31f3a03a-f150-416d-9315-d3a752cb4eb4", name: "no value", parentUuid: "" } as EntityInstance;


// #####################################################################################################
export type JzodObjectFormEditorInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

export interface JzodElementEditorProps {
  label?: string;
  name: string,
  listKey: string,
  rootLesslistKey: string,
  rootLesslistKeyArray: string[],
  indentLevel?:number,
  unresolvedJzodSchema?: JzodElement | undefined,
  rawJzodSchema: JzodElement | undefined,
  resolvedJzodSchema: JzodElement | undefined,
  foreignKeyObjects: Record<string,EntityInstancesUuidIndex>,
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection,
  formik: any,
}

// export interface JzodElementEditorWithButtonPropsFormik extends JzodElementFormEditorCorePropsFormik {
//   showButton: true;
// }

// export interface JzodElementEditorWithoutButtonPropsFormik extends JzodElementFormEditorCorePropsFormik {
//   showButton: false;
// }

// export type JzodElementEditorProps = JzodElementFormEditorCoreProps

// // ################################################################################################
// export function getUnionDiscriminantValues(
//   jzodUnion:JzodUnion, 
//   rootJzodSchema:JzodObject, 
//   currentModel:MetaModel,
//   miroirFundamentalJzodSchema: JzodSchema,
// ) {
//   return jzodUnion.discriminator
//     ? {
//         [jzodUnion.discriminator]:jzodUnion.definition.map(
//           (e: JzodElement) => {
//             const resolvedSchema =
//               e.type == "schemaReference" ? resolveJzodSchemaReference(miroirFundamentalJzodSchema, e, currentModel, rootJzodSchema) : e;
//             return e.type;
//           }
//         )
//       }
//     : {};
// }

// ################################################################################################
export const ExpandOrFold = (
  props: {
    hiddenFormItems: {[k: string]: boolean},
    // setHiddenFormItems: any,
    setHiddenFormItems: React.Dispatch<
    React.SetStateAction<{
      [k: string]: boolean;
    }>
    >,
    listKey: string,
  }
): JSX.Element => {
  return (
    <button
      // style={{maxHeight:"20px",maxWidth:"20px"}}
      // style={{display:"inline-flex"}}
      style={{ border: 0, backgroundColor: "transparent" }}
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
        <ExpandMore sx={{ maxWidth: "15px", maxHeight: "15px" }} />
      ) : (
        <ExpandLess sx={{ maxWidth: "15px", maxHeight: "15px" }} />
      )}
    </button>
  );
}

// ################################################################################################
function getValue(valueObject:any, path: string[]) {
    // log.info("getValue called with", valueObject, "path", path)
    return path.reduce((acc, curr, index) => {
      if (index == path.length && (acc == undefined || acc[curr] == undefined)) {
        throw new Error(
          "getValue value object=" +
            valueObject +
            ", path=" +
            path +
            " either attribute " +
            curr +
            " not found in " +
            acc +
            " or not last in path but leading to undefined " +
            curr[acc]
        );
      } else {
        return acc[curr];
      }
    }, valueObject);
}

// #####################################################################################################
const SizedButton = styled(Button)(({ theme }) => ({height: "1em", width: "auto", padding: "0px"}));
const SizedAddBoxIcon = styled(AddBoxIcon)(({ theme }) => ({height: "1em", width: "1em"}));

// const Item = styled(Paper)(({ theme }) => ({
//   backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
//   ...theme.typography.body2,
//   padding: theme.spacing(1),
//   textAlign: "left",
//   display: "flex",
//   maxHeight: "50vh",
//   // height: '80vh',
//   color: theme.palette.text.secondary,
// }));

const labelStyle = {
  paddingRight: "10px"
}

const StyledLabel = styled('label')(
  ({ theme }) => ({
    ...theme,
    paddingRight: "10px"
  })
)

const indentShift =  "1em + 4px";

let count = 0;
// #####################################################################################################
export const JzodElementEditor = (
  props: JzodElementEditorProps
): JSX.Element => {
  count++;
  // log.info("JzodElementEditor count", count, props)
  const context = useMiroirContextService();

  // const [selectedOption, setSelectedOption] = useState({label:props.name,value:props.initialValuesObject});
  const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

  const [hiddenFormItems,setHiddenFormItems] = useState<{[k:string]:boolean}>({})

  const currentModel: MetaModel = useCurrentModel(props.currentDeploymentUuid);
  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  const displayedLabel: string = props.label??props.name;

  const usedIndentLevel: number = props.indentLevel?props.indentLevel:0;
  // log.info(
  //   "rendering",
  //   props.listKey,
  //   "type=",
  //   props.resolvedJzodSchema?.type,
  //   "jzodSchema=",
  //   props.resolvedJzodSchema,
  //   "props=",
  //   props
  // );

  const currentValue = getValue(props.formik.values,props.rootLesslistKeyArray);
  // log.info(
  //   "rendering",
  //   props.listKey,
  //   "currentValue",
  //   currentValue,
  // );

  const [itemsOrder, setItemsOrder] = useState<any[]>(
    props.resolvedJzodSchema?.type == "object" && typeof(currentValue) == "object" && currentValue !== null?
      Object.keys(currentValue)
    :
      (
        Array.isArray(currentValue)?currentValue.map((e:any, k:number) => k):[]
      )
  );

  // log.info(
  //   "rendering",
  //   props.listKey,
  //   "itemsOrder",
  //   itemsOrder,
  // );
  
  if (props.resolvedJzodSchema && props.rawJzodSchema) {
    const objectTypes: string[] = ["record", "object"];
    if (
      !objectTypes.includes(props.resolvedJzodSchema.type) &&
      !objectTypes.includes(props.rawJzodSchema.type) &&
      props.resolvedJzodSchema.type != props.rawJzodSchema?.type) {
      throw new Error(
        "JzodElementEditor mismatching jzod schemas, resolved schema " + 
        JSON.stringify(props.resolvedJzodSchema, null, 2) +
        " raw schema " +
        JSON.stringify(props.rawJzodSchema, null, 2)
      );
    }
    const unfoldedRawSchemaReturnType = unfoldJzodSchemaOnce(
      context.miroirFundamentalJzodSchema,
      // props.rawJzodSchema?.type == "object"?props.rawJzodSchema.definition[attribute[0]]:props.rawJzodSchema?.definition as any,
      props.rawJzodSchema,
      currentModel,
      miroirMetaModel
    );
    if (unfoldedRawSchemaReturnType.status == "error") {
      throw new Error(
        "JzodElementEditor could not unfold raw schema " +
          JSON.stringify(props.rawJzodSchema, null, 2) +
          " result " +
          JSON.stringify(unfoldedRawSchemaReturnType, null, 2)
      );
    }
    const unfoldedRawSchema = unfoldedRawSchemaReturnType.element
    log.info(
      "JzodElementEditor",
      props.listKey,
      "rawJzodSchema",
      props.rawJzodSchema,
      "unfoldedRawSchema",
      unfoldedRawSchema,
    );
    switch (props.resolvedJzodSchema.type) {
      case "object": {
        let resolvedJzodSchema: JzodObject = props.resolvedJzodSchema;
        // const rawJzodSchema: JzodObject | JzodRecord | JzodUnion = props.rawJzodSchema as any;
        // log.info("object", props.listKey, "found resolvedJzodSchema after resolving 'extend' clause:",resolvedJzodSchema);
        // log.info("object", props.listKey, "found value:",props.initialValuesObject, "itemsOrder", itemsOrder);
        let allSchemaObjectAttributes: string[]
        switch (unfoldedRawSchema.type) {
          case 'record': {
            allSchemaObjectAttributes = ["ANY"]
            break;
          }
          case 'union': {
            if (!unfoldedRawSchema.discriminator) {
              throw new Error(
                "JzodElementEditor could not compute allSchemaObjectAttributes, no discriminator found in " + 
                JSON.stringify(unfoldedRawSchema, null, 2)
              );
            }
            allSchemaObjectAttributes = unfoldedRawSchema.definition.map(
              (a: any) => a.definition[(unfoldedRawSchema as any).discriminator as any].definition
            );
            break;
          }
          case 'object':
          case 'function':
          case 'array':
          case 'simpleType':
          case 'enum':
          case 'lazy':
          case 'literal':
          case 'intersection':
          case 'map':
          case 'promise':
          case 'schemaReference':
          case 'set':
          case 'tuple':
          default: {
            allSchemaObjectAttributes = Object.keys(unfoldedRawSchema.definition)
            break;
          }
        }
        // const allSchemaObjectAttributes = unfoldedRawSchema.type == "record"?["ANY"]:
        return (
          <div style={{ marginLeft: `calc(${usedIndentLevel}*(${indentShift}))` }}>
            {/* <div>
            JzodElementEditor rendered! {count}
            </div> */}
            {/* {props.listKey}:{'\{'} */}
            {displayedLabel}:{" {"}
            <SizedButton variant="text" onClick={()=>{log.info("clicked!",props.listKey, itemsOrder, Object.keys(resolvedJzodSchema.definition))}}>
              <SizedAddBoxIcon/>
            </SizedButton>
            {/* {" "}{props.listKey} */}
            {" "}{JSON.stringify(allSchemaObjectAttributes)}
            <ExpandOrFold
              hiddenFormItems={hiddenFormItems}
              setHiddenFormItems={setHiddenFormItems}
              listKey={props.listKey}
            ></ExpandOrFold>
            <div id={props.listKey + ".inner"} style={{ display: hiddenFormItems[props.listKey] ? "none" : "block" }}>
              {
                itemsOrder
                  .map((i): [string, JzodElement] => [i, props.formik.values[props.rootLesslistKey.length > 0? (props.rootLesslistKey + "." + i[0]):i[0]]])
                  .map((attribute: [string, JzodElement]) => {
                    const currentAttributeDefinition = resolvedJzodSchema.definition[attribute[0]];
                    // log.info("calling unfoldJzodSchemaOnce for object with attribute", attribute[0], "rawJzodSchema", props.rawJzodSchema)
                    let attributeRawJzodSchema: JzodElement
                    // switch (rawJzodSchema?.type) {
                    switch (unfoldedRawSchema?.type) {
                      case "object": {
                        // jzodSchemaToUnfold = rawJzodSchema.definition[attribute[0]]
                        attributeRawJzodSchema = unfoldedRawSchema.definition[attribute[0]]
                        break;
                      }
                      case "record": {
                        // jzodSchemaToUnfold = rawJzodSchema.definition
                        attributeRawJzodSchema = unfoldedRawSchema.definition
                        break;
                      }
                      case "union": {
                        // if (!rawJzodSchema.discriminator) {
                        if (!unfoldedRawSchema.discriminator) {
                          throw new Error(
                            "no discriminator found, could not choose branch of union type for object " +
                              JSON.stringify(unfoldedRawSchema, null, 2) +
                              " " +
                              JSON.stringify(props.resolvedJzodSchema, null, 2)
                          );
                        }

                        attributeRawJzodSchema = unfoldedRawSchema.definition.find(
                          (a) =>
                            (a.definition as any)[(unfoldedRawSchema as any).discriminator].definition ==
                            (props.resolvedJzodSchema?.definition as any)[(unfoldedRawSchema as any).discriminator]
                              .definition
                        ) as any;
                        break;

                      }
                      default: {
                        // jzodSchemaToUnfold = props.rawJzodSchema as any // linter complains about props.rawJzodSchema being potentially undefined in spite of test above
                        attributeRawJzodSchema = unfoldedRawSchema // linter complains about props.rawJzodSchema being potentially undefined in spite of test above
                        break;
                      }
                    }
                    // log.info(
                    //   "calling unfoldJzodSchemaOnce for object with attribute",
                    //   attribute[0],
                    //   "props.resolvedJzodSchema",
                    //   props.resolvedJzodSchema,
                    //   "rawJzodSchema",
                    //   props.rawJzodSchema,
                    //   "jzodSchemaToUnfold",
                    //   jzodSchemaToUnfold,
                    // );
                    // const currentAttributeRawDefinition = unfoldJzodSchemaOnce(
                    //   context.miroirFundamentalJzodSchema,
                    //   // props.rawJzodSchema?.type == "object"?props.rawJzodSchema.definition[attribute[0]]:props.rawJzodSchema?.definition as any,
                    //   jzodSchemaToUnfold,
                    //   currentModel,
                    //   miroirMetaModel
                    // );
                    // if (currentAttributeRawDefinition.status != "ok") {
                    //   throw new Error("JzodElementEditor could not resolve jzod schema " + JSON.stringify(currentAttributeRawDefinition, null, 2));
                    // }
                    const listKey = props.listKey + "." + attribute[0]
                    // log.info(
                    //   "JzodElementEditor",
                    //   listKey,
                    //   "rawJzodSchema",
                    //   rawJzodSchema,
                    //   "unfoldedRawSchema",
                    //   unfoldedRawSchema.element,
                    //   "currentAttributeDefinition",
                    //   currentAttributeDefinition,
                    //   "currentAttributeRawDefinition",
                    //   currentAttributeRawDefinition.element
                    // );
                    return (
                      <div
                        key={listKey}
                        style={{ marginLeft: `calc((${usedIndentLevel} + 1)*(${indentShift}))` }}
                      >
                        <JzodElementEditor
                          name={attribute[0]}
                          listKey={props.listKey + "." + attribute[0]}
                          rootLesslistKey={props.rootLesslistKey.length > 0? props.rootLesslistKey + "." + attribute[0]:attribute[0]}
                          rootLesslistKeyArray={[...props.rootLesslistKeyArray,attribute[0]]}
                          indentLevel={usedIndentLevel}
                          label={currentAttributeDefinition?.extra?.defaultLabel}
                          currentDeploymentUuid={props.currentDeploymentUuid}
                          // rawJzodSchema={currentAttributeRawDefinition.element}
                          rawJzodSchema={attributeRawJzodSchema}
                          currentApplicationSection={props.currentApplicationSection}
                          resolvedJzodSchema={currentAttributeDefinition}
                          foreignKeyObjects={props.foreignKeyObjects}
                          formik={props.formik}
                        />
                      </div>
                    );
                  }
                )
              }
            </div>
            {"}"}
          </div>
        );
        break;
      }
      case "array": {
        log.info("############################################### JzodElementEditor array rootLesslistKey", props.rootLesslistKey, "values", props.formik.values);
        const arrayValueObject = getValue(props.formik.values,props.rootLesslistKeyArray);
        log.info("array",arrayValueObject, "resolvedJzodSchema",props.resolvedJzodSchema);

        
        return (
          <div style={{ marginLeft: `calc(${usedIndentLevel}*(${indentShift}))` }}>
            {displayedLabel}:{" ["}{" "}
            <ExpandOrFold
              hiddenFormItems={hiddenFormItems}
              setHiddenFormItems={setHiddenFormItems}
              listKey={props.listKey}
            ></ExpandOrFold>
            {/* <div>itemsOrder {JSON.stringify(itemsOrder)}</div> */}
            <div id={props.listKey + ".inner"} style={{ display: hiddenFormItems[props.listKey] ? "none" : "block" }}>
              {/* {props.initialValuesObject.map((attribute: JzodElement, index: number) => { */}
              {(itemsOrder as number[])
                .map((i: number):[number, JzodElement] => [i, arrayValueObject[i]])
                .map((attributeParam: [number, JzodElement]) => {
                  const index: number = attributeParam[0];
                  const attribute = attributeParam[1];
                  // HACK HACK HACK
                  // TODO: allow individualized schmema resolution for items of an array, in case the definition of the array schema is a union type
                  // resulting type of an array type would be a tuple type.

                  // const currentAttributeJzodSchema: JzodElement = props.resolvedJzodSchema.definition
                  const currentArrayElementRawDefinition = unfoldJzodSchemaOnce(
                    context.miroirFundamentalJzodSchema,
                    (props as any).rawJzodSchema.definition,
                    currentModel,
                    miroirMetaModel
                  );
                  if (currentArrayElementRawDefinition.status != "ok") {
                    throw new Error("JzodElementEditor could not resolve jzod schema " + JSON.stringify(currentArrayElementRawDefinition, null, 2));
                  }

                  log.info(
                    "array [",
                    index,
                    "]",
                    attribute,
                    "type",
                    attribute.type,
                    "found schema",
                    props.resolvedJzodSchema
                  );
                  return (
                    <div
                      key={props.listKey + "." + index}
                      style={{ marginLeft: `calc((${usedIndentLevel} + 1)*(${indentShift}))` }}
                    >
                      <button
                        style={{ border: 0, backgroundColor: "transparent" }}
                        disabled={index == itemsOrder.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();

                          const currentItemIndex: number = index;
                          let newItemsOrder = itemsOrder.slice();
                          const cutOut = newItemsOrder.splice(currentItemIndex, 1)[0];
                          newItemsOrder.splice(currentItemIndex + 1, 0, cutOut);
                          setformHelperState(Object.assign(formHelperState, { [props.listKey]: newItemsOrder }));
                          log.info(
                            "JzodElementEditor array moving item",
                            currentItemIndex,
                            "in object with items",
                            itemsOrder,
                            "cutOut",
                            cutOut,
                            "new order",
                            newItemsOrder
                          );
                          setItemsOrder(newItemsOrder);
                        }}
                      >
                        {"v"}
                      </button>
                      <button
                        style={{ border: 0, backgroundColor: "transparent" }}
                        disabled={index == 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();

                          const currentItemIndex: number = index;
                          let newItemsOrder = itemsOrder.slice();
                          const cutOut = newItemsOrder.splice(currentItemIndex, 1)[0];
                          newItemsOrder.splice(currentItemIndex - 1, 0, cutOut);
                          setformHelperState(Object.assign(formHelperState, { [props.listKey]: newItemsOrder }));
                          log.info(
                            "JzodElementEditor array moving item",
                            currentItemIndex,
                            "in object with items",
                            itemsOrder,
                            "cutOut",
                            cutOut,
                            "new order",
                            newItemsOrder
                          );
                          setItemsOrder(newItemsOrder);
                        }}
                      >
                        {"^"}
                      </button>
                      <JzodElementEditor
                        name={"" + index}
                        listKey={props.listKey + "." + index}
                        // currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
                        indentLevel={usedIndentLevel}
                        label={props.resolvedJzodSchema?.extra?.defaultLabel}
                        currentDeploymentUuid={props.currentDeploymentUuid}
                        currentApplicationSection={props.currentApplicationSection}
                        rootLesslistKey={props.rootLesslistKey.length > 0? (props.rootLesslistKey + "." + index):("" +index)}
                        rootLesslistKeyArray={[...props.rootLesslistKeyArray,""+index]}
                        rawJzodSchema={currentArrayElementRawDefinition.element}
                        resolvedJzodSchema={props.resolvedJzodSchema?.definition as any} // TODO: wrong type seen for props.resolvedJzodSchema! (cannot be undefined, really)
                        foreignKeyObjects={props.foreignKeyObjects}
                        formik={props.formik}
                    />
                    </div>
                  );
                })}
            </div>
            {"]"}
          </div>
        );
        break;

      }
      case "simpleType": {
        switch (props.resolvedJzodSchema.definition) {
          case "string":{
            const selectList = 
              props.resolvedJzodSchema.extra?.targetEntity?
              [
                [noValue.uuid, noValue] as [string, EntityInstance],
                ...(Object.entries(props.foreignKeyObjects[props.resolvedJzodSchema.extra.targetEntity] ?? {}))
              ]
              : []
            ;

            // log.info("selectList for targetEntity", props.resolvedJzodSchema.extra?.targetEntity, "value", selectList, "props.foreignKeyObjects", props.foreignKeyObjects);

            return props.resolvedJzodSchema.extra?.targetEntity ? (
              <>
                <label htmlFor={props.listKey}>{displayedLabel}: </label>
                <select
                  id={props.rootLesslistKey}
                  name={props.name}
                  {...props.formik.getFieldProps(props.rootLesslistKey)}
                  onChange={props.formik.handleChange}
                  value={currentValue}
                >
                  {/* <option id={props.rootLesslistKey+".undefined"} value=""></option> */}
                  {selectList.map((e: [string, EntityInstance], index: number) => (
                    <option id={props.rootLesslistKey + "." + index} value={e[1].uuid}>
                      {(e[1] as EntityInstanceWithName).name}
                    </option>
                  ))}
                  {/* <option value="red">Red</option>
                 <option value="green">Green</option>
                 <option value="blue">Blue</option> */}
                </select>
              </>
            ) : (
              <>
                <label htmlFor={props.listKey}>{displayedLabel}: </label>
                <input
                  type="text"
                  id={props.rootLesslistKey}
                  name={props.name}
                  {...props.formik.getFieldProps(props.rootLesslistKey)}
                  onChange={props.formik.handleChange}
                  value={currentValue}
                />
              </>
            );
            break;
          }
          case "boolean":{
            // log.info("JzodElementEditor boolean!",props.listKey,"formState",props.formState)
            return (
              <>
              <table>
                <tbody>
                  <tr>
                    <td>
                    {displayedLabel}:{" "} 
                    </td>
                    <td>
                      <Checkbox 
                        // {...register(props.listKey)}
                        name={props.listKey}
                        id={props.listKey}
                        defaultChecked={props.formik.values[props.rootLesslistKey]}
                        // defaultChecked={props.initialValuesObject}
                        {...props.formik.getFieldProps(props.listKey)}
                        // onChange={props.formik.handleChange}
                        // value={props.formik.values[props.rootLesslistKey]}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
              </>
            );
            break;
          }
          case "number": {
            // const defaultValue:number | undefined=props.initialValuesObject?(props.initialValuesObject as any as number):undefined;
            // log.info("JzodElementEditor number!",props.listKey,"props.initialValuesObject",props.initialValuesObject)
            return (
              <>
                {/* {props.listKey} - {label}:{" "} */}
                {displayedLabel}:{" "}
                <input
                  form={"form." + props.name}
                  name={props.name}
                  {...props.formik.getFieldProps(props.rootLesslistKey)}
                  // onChange={props.formik.handleChange}
                  // value={props.formik.values[props.rootLesslistKey]}
                  // onChange={(e) => {
                  //   log.info("JzodElementEditor number onChange!", props.name, e.target.value);
                  // }}
                  // defaultValue={defaultValue}
                />
              </>
            );
            break;
          }
          case "any":
          case "uuid":
          default: {
            // const defaultValue=formState.defaultValues?formState.defaultValues[props.name]:'no value found!'
            // const defaultValue:number | undefined=props.initialValuesObject?(props.initialValuesObject as any as number):undefined;
            return (
              <>
                <label htmlFor={props.listKey}>{displayedLabel}: </label>
                <input
                  id={props.listKey}
                  form={"form." + props.name}
                  name={props.name}
                  {...props.formik.getFieldProps(props.rootLesslistKey)}
                  // value={props.formik.values[props.rootLesslistKey]}
                  // onChange={(e) => {
                  //   log.info("JzodElementEditor number onChange!", props.name, e.target.value);
                  //   // setValue(props.listKey, e.target.value);
                  // }}
                  // defaultValue={defaultValue}
                />
              </>
            );
          // throw new Error("JzodElementEditor could not handle jzodSchema type:",elementJzodSchema?.type,elementJzodSchema.definition);
            break;
          }
        }
        break;
      }
      case "literal": {
        return (
          <>
            <label htmlFor={props.listKey}>{displayedLabel}: </label>
            <input
              // {...register(props.listKey)}
              id={props.listKey}
              form={"form." + props.name}
              name={props.name}
              {...props.formik.getFieldProps(props.rootLesslistKey)}
              // value={props.formik.values[props.rootLesslistKey]}
              // onChange={(e) => {
              //   log.info("JzodElementEditor number onChange!", props.name, e.target.value);
              //   // setValue(props.listKey, e.target.value);
              // }}
              // defaultValue={defaultValue}
            />
          </>
        );
      }
      case "enum":
      case "function":
      case "lazy":
      case "intersection":
      case "map":
      case "promise":
      case "record":
      case "schemaReference":
      case "set":
      case "tuple":
      case "union": {
        return (
          <div>
            default case: {props.resolvedJzodSchema.type} {props.listKey} value {props.formik.values[props.rootLesslistKey]}
            {/* <div>
              found schema: {JSON.stringify(props.resolvedJzodSchema, null, 2)}
            </div>
            <div>
              for object: {JSON.stringify(props.initialValuesObject, null, 2)}
            </div> */}
          </div>
        )
        break;
      }
    }
  } else {
    return (
      <div>
        Could not find schema for item: {props.listKey} value {props.formik.values[props.rootLesslistKey]}
      </div>
    )
  }
}
