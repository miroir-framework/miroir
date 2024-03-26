
import { useEffect, useMemo, useState } from "react";
import Select from 'react-select';

// import { FieldValues, UseFormRegister, UseFormSetValue, useFormContext } from "react-hook-form";

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Checkbox } from "@mui/material";

import {
  ApplicationSection,
  EntityAttribute,
  EntityDefinition,
  EntityInstanceWithName,
  EntityInstancesUuidIndex,
  JzodElement,
  JzodObject,
  JzodSchema,
  JzodUnion,
  LocalCacheQueryParams,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Uuid,
  applicationDeploymentMiroir,
  domainEndpointVersionV1,
  entityDefinitionApplication,
  entityDefinitionApplicationVersion,
  entityDefinitionBundleV1,
  entityDefinitionCommit,
  entityDefinitionEntity,
  entityDefinitionEntityDefinition,
  entityDefinitionJzodSchema,
  entityDefinitionMenu,
  entityDefinitionQueryVersionV1,
  entityDefinitionReport,
  getLoggerName,
  getMiroirFundamentalJzodSchema,
  instanceEndpointVersionV1,
  jzodSchemajzodMiroirBootstrapSchema,
  localCacheEndpointVersionV1,
  modelEndpointV1,
  persistenceEndpointVersionV1,
  queryEndpointVersionV1,
  resolveJzodSchemaReference,
  storeManagementEndpoint,
  undoRedoEndpointVersionV1,
} from "miroir-core";

import { JzodEnumSchemaToJzodElementResolver } from "../JzodTools";
import { useMiroirContextformHelperState } from "./MiroirContextReactProvider";
import { useCurrentModel, useEntityInstanceUuidIndexFromLocalCache } from "./ReduxHooks";
import { cleanLevel } from "./constants";
import { packageName } from "../../constants";
import { ReactJSXElement } from "@emotion/react/types/jsx-namespace";
import styled from "@emotion/styled";
import { Label } from "@mui/icons-material";
import { ExpandOrFold } from "./JzodElementEditor";
import { Field } from "formik";


const loggerName: string = getLoggerName(packageName, cleanLevel,"JzodElementEditorFormik");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// #####################################################################################################
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

// #####################################################################################################
export type JzodObjectFormEditorInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

export interface JzodElementFormEditorCorePropsFormik {
  label?: string;
  name: string,
  listKey: string,
  indentLevel?:number,
  resolvedJzodSchema: JzodElement | undefined,
  initialValuesObject: any,
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection,
  formik: any,
}

export interface JzodElementEditorWithButtonPropsFormik extends JzodElementFormEditorCorePropsFormik {
  showButton: true;
}

export interface JzodElementEditorWithoutButtonPropsFormik extends JzodElementFormEditorCorePropsFormik {
  showButton: false;
}

export type JzodElementEditorPropsFormik = JzodElementEditorWithButtonPropsFormik | JzodElementEditorWithoutButtonPropsFormik


// ################################################################################################
const miroirFundamentalJzodSchema: JzodSchema = getMiroirFundamentalJzodSchema(
  entityDefinitionBundleV1 as EntityDefinition,
  entityDefinitionCommit as EntityDefinition,
  modelEndpointV1,
  storeManagementEndpoint,
  instanceEndpointVersionV1,
  undoRedoEndpointVersionV1,
  localCacheEndpointVersionV1,
  domainEndpointVersionV1,
  queryEndpointVersionV1,
  persistenceEndpointVersionV1,
  jzodSchemajzodMiroirBootstrapSchema as JzodSchema,
  entityDefinitionApplication as EntityDefinition,
  entityDefinitionApplicationVersion as EntityDefinition,
  entityDefinitionEntity as EntityDefinition,
  entityDefinitionEntityDefinition as EntityDefinition,
  entityDefinitionJzodSchema as EntityDefinition,
  entityDefinitionMenu  as EntityDefinition,
  entityDefinitionQueryVersionV1 as EntityDefinition,
  entityDefinitionReport as EntityDefinition,
  // jzodSchemajzodMiroirBootstrapSchema as any,
);




// // ################################################################################################
// export function getUnionDiscriminantValues(jzodUnion:JzodUnion, rootJzodSchema:JzodObject, currentModel:MetaModel) {
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

// // ################################################################################################
// export const ExpandOrFold = (
//   props: {
//     hiddenFormItems: {[k: string]: boolean},
//     // setHiddenFormItems: any,
//     setHiddenFormItems: React.Dispatch<
//       React.SetStateAction<{
//         [k: string]: boolean;
//       }>
//     >,
//     listKey: string,
//   }
// ): JSX.Element => {
//   return (
//     <button
//       // style={{maxHeight:"20px",maxWidth:"20px"}}
//       // style={{display:"inline-flex"}}
//       style={{ border: 0, backgroundColor: "transparent" }}
//       onClick={(e) => {
//         e.stopPropagation();
//         e.preventDefault();
//         props.setHiddenFormItems({
//           ...props.hiddenFormItems,
//           [props.listKey]: props.hiddenFormItems[props.listKey] ? false : true,
//         });
//       }}
//     >
//       {props.hiddenFormItems[props.listKey] ? (
//         <ExpandMore sx={{ maxWidth: "15px", maxHeight: "15px" }} />
//       ) : (
//         <ExpandLess sx={{ maxWidth: "15px", maxHeight: "15px" }} />
//       )}
//     </button>
//   );
// }

let count = 0;
// #####################################################################################################
export const JzodElementEditorFormik = (
  props: JzodElementEditorPropsFormik
): JSX.Element => {
  count++;
  log.info("JzodElementEditorFormik count", count, props)
  // const formMethods = useFormContext();
  // const { register, handleSubmit, reset, trigger, watch, setValue, getValues, formState } = formMethods;
  // const { register, setValue } = formMethods;

  // const [selectedOption, setSelectedOption] = useState({label:props.name,value:props.initialValuesObject});
  // const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

  // const props: JzodElementEditorProps = useMemo(
  //   () => (
  //     {
  //       ...props
  //     }
  //   ),
  //   [props]
  // )
  const [hiddenFormItems,setHiddenFormItems] = useState<{[k:string]:boolean}>({})
  const [itemsOrder, setItemsOrder] = useState<any[]>(
    Array.isArray(props.initialValuesObject)
      ? props.initialValuesObject.map((e, k) => k)
      : (
        typeof(props.initialValuesObject) == "object" && props.initialValuesObject !== null
        ? Object.keys(props.initialValuesObject)
        : []
      )
  );

  // const localCacheQuery: LocalCacheQueryParams = useMemo(
  //   () => ({
  //     queryType: "LocalCacheEntityInstancesSelectorParams",
  //     definition: {
  //       deploymentUuid: props.currentDeploymentUuid,
  //       applicationSection: props.currentApplicationSection,
  //       entityUuid:
  //         props.elementJzodSchema?.type == "simpleType" && props.elementJzodSchema?.definition == "string" && props.elementJzodSchema.extra?.targetEntity
  //           ? props.elementJzodSchema.extra?.targetEntity
  //           : "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  //     }
  //   }),
  //   [props.elementJzodSchema]
  // )
  // const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(localCacheQuery);

  // const selectList: EntityInstanceWithName[] = useMemo(
  //   () => (instancesToDisplayUuidIndex ? Object.values(instancesToDisplayUuidIndex) : []) as EntityInstanceWithName[],
  //   [instancesToDisplayUuidIndex]
  // );

  // const currentModel = useCurrentModel(applicationDeploymentMiroir.uuid);

  const displayedLabel: string = props.label??props.name;

  const usedIndentLevel: number = props.indentLevel?props.indentLevel:0;

  log.info(
    "JzodElementEditorFormik rendering",
    props.listKey,
    "type=",
    props.resolvedJzodSchema?.type,
    "typeof initialValue=",
    typeof props.initialValuesObject,
    "initialValue=",
    props.initialValuesObject,
    "jzodSchema=",
    props.resolvedJzodSchema,
    "itemsOrder",
    itemsOrder,
    "props=",
    props
  );
  
  // return (
  //   <div>
  //     JzodElementEditorFormik rendered! {count}
  //     <div>
  //       {JSON.stringify(initialValuesObject, null, 2)}
  //     </div>
  //     <div>
  //       {JSON.stringify(props.resolvedJzodSchema, null, 2)}
  //     </div>
  //     <div>
  //       {

  //       }

  //     </div>
  //   </div>
  // )
  // const recursiveCallInnerProps = {
  //   label: currentAttributeDefinition?.extra?.defaultLabel,
  //   initialValuesObject: props.initialValuesObject
  //     ? props.initialValuesObject[attribute[0]]
  //     : undefined,
  //   showButton: true,
  //   currentDeploymentUuid: props.currentDeploymentUuid,
  //   currentApplicationSection: props.currentApplicationSection,
  //   elementJzodSchema: currentAttributeDefinition,
  //   rootJzodSchema: props.rootJzodSchema,
  // };

  if (props.resolvedJzodSchema) {
    switch (props.resolvedJzodSchema.type) {
      case "object": {
        let resolvedJzodSchema: JzodObject = props.resolvedJzodSchema;
        // if (elementJzodSchema.extend) {
        //   if (elementJzodSchema.extend.type == "schemaReference") {
        //     const resolvedExtend = resolveJzodSchemaReference(
        //       miroirFundamentalJzodSchema,
        //       elementJzodSchema.extend,
        //       currentModel,
        //       {} as JzodObject
        //     );
        //     if (resolvedExtend.type == "object") {
        //       resolvedJzodSchema = { ...elementJzodSchema, definition: { ...elementJzodSchema.definition, ...resolvedExtend.definition } }
        //     } else {
        //       throw new Error(
        //         "JzodElementEditorFormik extend clause for object schema is not an object. Schema: " +
        //           JSON.stringify(elementJzodSchema)
        //       );
        //     }
        //   } else {
        //     if (elementJzodSchema.extend.type == "object") {
        //       resolvedJzodSchema = { ...elementJzodSchema, definition: { ...elementJzodSchema.definition, ...elementJzodSchema.extend.definition } as Record<string, JzodElement> }
        //     } else {
        //       throw new Error(
        //         "JzodElementEditorFormik extend clause for object schema is not an object. Schema: " +
        //           JSON.stringify(elementJzodSchema)
        //       );
        //     }
        //     // resolvedJzodSchema = {
        //     //   ...elementJzodSchema,
        //     //   definition: { ...elementJzodSchema.definition, ...elementJzodSchema.extend.definition },
        //     // };
        //   }
        // } else {
        //   resolvedJzodSchema = elementJzodSchema;
        // }
        log.info("object", props.listKey, "found resolvedJzodSchema after resolving 'extend' clause:",resolvedJzodSchema);
        log.info("object", props.listKey, "found value:",props.initialValuesObject, "itemsOrder", itemsOrder);
        
        return (
          <div style={{ marginLeft: `calc(${usedIndentLevel}*(${indentShift}))` }}>
            {/* <div>
            JzodElementEditorFormik rendered! {count}
            </div> */}
            {/* {props.listKey}:{'\{'} */}
            {displayedLabel}:{" {"}{" "}
            <ExpandOrFold
              hiddenFormItems={hiddenFormItems}
              setHiddenFormItems={setHiddenFormItems}
              listKey={props.listKey}
            ></ExpandOrFold>
            <div id={props.listKey + ".inner"} style={{ display: hiddenFormItems[props.listKey] ? "none" : "block" }}>
              {/* {Object.entries(props.initialValuesObject).map((attribute: [string, JzodElement]) => { */}
              {
                itemsOrder
                  .map((i): [string, JzodElement] => [i, props.initialValuesObject[i]])
                  .map((attribute: [string, JzodElement]) => {
                    // const currentAttributeDefinition = elementJzodSchema.definition[attribute[0]];
                    const currentAttributeDefinition = resolvedJzodSchema.definition[attribute[0]];
                    return (
                      <div
                        key={props.listKey + "." + attribute[0]}
                        style={{ marginLeft: `calc((${usedIndentLevel} + 1)*(${indentShift}))` }}
                      >
                        <JzodElementEditorFormik
                          name={attribute[0]}
                          listKey={props.listKey + "." + attribute[0]}
                          indentLevel={usedIndentLevel}
                          label={currentAttributeDefinition?.extra?.defaultLabel}
                          initialValuesObject={props.initialValuesObject
                            ? props.initialValuesObject[attribute[0]]
                            : undefined}
                          showButton={true}
                          currentDeploymentUuid={props.currentDeploymentUuid}
                          currentApplicationSection={props.currentApplicationSection}
                          resolvedJzodSchema={currentAttributeDefinition}
                          formik={props.formik}
                          // elementJzodSchema={currentAttributeDefinition}
                          // rootJzodSchema={props.rootJzodSchema}
                          // register={props.register}
                          // setValue={props.setValue}
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
      case "function":
      case "array":
      case "simpleType": {
        switch (props.resolvedJzodSchema.definition) {
          case "string":{
            return (
              <>
                <label htmlFor={props.listKey}>{displayedLabel}: </label>
                <input
                  key={props.listKey}
                  form={"form." + props.name}
                  type="text"
                  id={props.listKey}
                  name={props.name}
                  {...props.formik.getFieldProps(props.listKey)}
                  defaultValue={props.initialValuesObject}
                />
              </>
            );
            break;
          }
          case "boolean":{
            // log.info("JzodElementEditorFormik boolean!",props.listKey,"formState",props.formState)
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
                        defaultChecked={props.initialValuesObject}
                        {...props.formik.getFieldProps(props.listKey)}
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
            const defaultValue:number | undefined=props.initialValuesObject?(props.initialValuesObject as any as number):undefined;
            // log.info("JzodElementEditorFormik number!",props.listKey,"props.initialValuesObject",props.initialValuesObject)
            return (
              <>
                {/* {props.listKey} - {label}:{" "} */}
                {displayedLabel}:{" "}
                <input
                  form={"form." + props.name}
                  name={props.name}
                  {...props.formik.getFieldProps(props.listKey)}
                  // onChange={(e) => {
                  //   log.info("JzodElementEditorFormik number onChange!", props.name, e.target.value);
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
            const defaultValue:number | undefined=props.initialValuesObject?(props.initialValuesObject as any as number):undefined;
            return (
              <>
                <label htmlFor={props.listKey}>{displayedLabel}: </label>
                <input
                  // {...register(props.listKey)}
                  id={props.listKey}
                  form={"form." + props.name}
                  name={props.name}
                  {...props.formik.getFieldProps(props.listKey)}
                  // onChange={(e) => {
                  //   log.info("JzodElementEditorFormik number onChange!", props.name, e.target.value);
                  //   // setValue(props.listKey, e.target.value);
                  // }}
                  // defaultValue={defaultValue}
                />
              </>
            );
          // throw new Error("JzodElementEditorFormik could not handle jzodSchema type:",elementJzodSchema?.type,elementJzodSchema.definition);
            break;
          }
        }
        break;
      }
      case "enum":
      case "lazy":
      case "literal":
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
            default case!
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
        Could not find schema for value
      </div>
    )
  }
  // switch (elementJzodSchema?.type) {
  //   case "array":{
  //     log.info("############################################### JzodElementEditorFormik array");
      
  //     // const columnDefs: any[] = getColumnDefinitionsFromEntityDefinitionJzodObjectSchema(
  //     //   ((elementJzodSchema as JzodArray).definition
  //     //     ? (elementJzodSchema as JzodArray).definition
  //     //     : {}) as JzodObject
  //     // );
  //     const resolvedJzodSchema =
  //       elementJzodSchema.definition.type == "schemaReference"
  //         ? // ? resolveJzodSchemaReference(elementJzodSchema.definition, currentModel, props.rootJzodSchema)
  //           resolveJzodSchemaReference(
  //             miroirFundamentalJzodSchema,
  //             elementJzodSchema.definition,
  //             currentModel,
  //             {} as JzodObject
  //           )
  //         : elementJzodSchema.definition;

  //     // const targetJzodSchema = resolvedJzodSchema.type == 'union'?props.currentEnumJzodSchemaResolver[elementJzodSchema?.type]:resolvedJzodSchema;
  //     const targetJzodSchema =
  //       resolvedJzodSchema.type == "union"
  //         ? props.currentEnumJzodSchemaResolver(elementJzodSchema?.type, elementJzodSchema?.definition)
  //         : resolvedJzodSchema;

  //     log.info("array",props.initialValuesObject, "resolvedJzodSchema",resolvedJzodSchema,"targetJzodSchema",targetJzodSchema);

      
  //     return (
  //       <div style={{ marginLeft: `calc(${usedIndentLevel}*(${indentShift}))` }}>
  //         {displayedLabel}:{" {"}{" "}
  //         <ExpandOrFold
  //           hiddenFormItems={hiddenFormItems}
  //           setHiddenFormItems={setHiddenFormItems}
  //           listKey={props.listKey}
  //         ></ExpandOrFold>
  //         {/* <div>itemsOrder {JSON.stringify(itemsOrder)}</div> */}
  //         <div id={props.listKey + ".inner"} style={{ display: hiddenFormItems[props.listKey] ? "none" : "block" }}>
  //           {/* {props.initialValuesObject.map((attribute: JzodElement, index: number) => { */}
  //           {(itemsOrder as number[])
  //             .map((i: number):[number, JzodElement] => [i, props.initialValuesObject[i]])
  //             .map((attributeParam: [number, JzodElement]) => {
  //               const index: number = attributeParam[0];
  //               const attribute = attributeParam[1];
  //               // HACK HACK HACK
  //               // in the case of a union type, the concrete type of each member has to be resolved, as in the case of the jzodElement definition.
  //               // A proper solution should be devised, such as detecting that a type is displayed (here this could be problematic in general when a
  //               // "type" attribute is defined in a value, "type" becomes a reserved word by Jzod, this is not good.)
  //               const currentAttributeJzodSchema =
  //                 resolvedJzodSchema.type == "union" && attribute.type
  //                   ? // ? props.currentEnumJzodSchemaResolver[attribute.type]
  //                     props.currentEnumJzodSchemaResolver(attribute.type, attribute.definition)
  //                   : targetJzodSchema; // Union of jzodElements
  //               log.info(
  //                 "array [",
  //                 index,
  //                 "]",
  //                 attribute,
  //                 "type",
  //                 attribute.type,
  //                 "found schema",
  //                 currentAttributeJzodSchema
  //               );
  //               return (
  //                 <div
  //                   key={props.listKey + "." + index}
  //                   style={{ marginLeft: `calc((${usedIndentLevel} + 1)*(${indentShift}))` }}
  //                 >
  //                   <button
  //                     style={{ border: 0, backgroundColor: "transparent" }}
  //                     disabled={index == itemsOrder.length - 1}
  //                     onClick={(e) => {
  //                       e.stopPropagation();
  //                       e.preventDefault();

  //                       const currentItemIndex: number = index;
  //                       let newItemsOrder = itemsOrder.slice();
  //                       const cutOut = newItemsOrder.splice(currentItemIndex, 1)[0];
  //                       newItemsOrder.splice(currentItemIndex + 1, 0, cutOut);
  //                       setformHelperState(Object.assign(formHelperState, { [props.listKey]: newItemsOrder }));
  //                       log.info(
  //                         "JzodElementEditorFormik array moving item",
  //                         currentItemIndex,
  //                         "in object with items",
  //                         itemsOrder,
  //                         "cutOut",
  //                         cutOut,
  //                         "new order",
  //                         newItemsOrder
  //                       );
  //                       setItemsOrder(newItemsOrder);
  //                     }}
  //                   >
  //                     {"v"}
  //                   </button>
  //                   <button
  //                     style={{ border: 0, backgroundColor: "transparent" }}
  //                     disabled={index == 0}
  //                     onClick={(e) => {
  //                       e.stopPropagation();
  //                       e.preventDefault();

  //                       const currentItemIndex: number = index;
  //                       let newItemsOrder = itemsOrder.slice();
  //                       const cutOut = newItemsOrder.splice(currentItemIndex, 1)[0];
  //                       newItemsOrder.splice(currentItemIndex - 1, 0, cutOut);
  //                       setformHelperState(Object.assign(formHelperState, { [props.listKey]: newItemsOrder }));
  //                       log.info(
  //                         "JzodElementEditorFormik array moving item",
  //                         currentItemIndex,
  //                         "in object with items",
  //                         itemsOrder,
  //                         "cutOut",
  //                         cutOut,
  //                         "new order",
  //                         newItemsOrder
  //                       );
  //                       setItemsOrder(newItemsOrder);
  //                     }}
  //                   >
  //                     {"^"}
  //                   </button>
  //                   <JzodElementEditorFormik
  //                     name={"" + index}
  //                     listKey={props.listKey + "." + index}
  //                     currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
  //                     indentLevel={usedIndentLevel}
  //                     innerProps={{
  //                       // label:targetJzodSchema?.extra?.defaultLabel,
  //                       label: currentAttributeJzodSchema?.extra?.defaultLabel,
  //                       initialValuesObject: props.initialValuesObject
  //                         ? props.initialValuesObject[index]
  //                         : undefined,
  //                       showButton: true,
  //                       currentDeploymentUuid: props.currentDeploymentUuid,
  //                       currentApplicationSection: props.currentApplicationSection,
  //                       elementJzodSchema: currentAttributeJzodSchema,
  //                       rootJzodSchema: props.rootJzodSchema,
  //                     }}
  //                   />
  //                 </div>
  //               );
  //             })}
  //         </div>
  //         {"}"}
  //       </div>
  //     );
  //     break;
  //   }
  //   case "schemaReference": {
  //     const resolvedJzodSchema = resolveJzodSchemaReference(miroirFundamentalJzodSchema, elementJzodSchema, currentModel)
  //     log.info("schemaReference","resolvedJzodSchema",resolvedJzodSchema);

  //     const targetJzodSchema = resolvedJzodSchema.type == 'union'?props.currentEnumJzodSchemaResolver(elementJzodSchema?.type, elementJzodSchema?.definition):resolvedJzodSchema;
  //     log.info("schemaReference","resolvedJzodSchema",resolvedJzodSchema,"targetJzodSchema",targetJzodSchema);

  //     return (
  //       targetJzodSchema?
  //         <JzodElementEditorFormik
  //           name={props.name}
  //           listKey={props.listKey}
  //           currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
  //           innerProps={{
  //             label:targetJzodSchema.extra?.defaultLabel,
  //             initialValuesObject:props.initialValuesObject, // initial value does not change, only the type reference is resolved at this step
  //             showButton:true,
  //             currentDeploymentUuid:props.currentDeploymentUuid,
  //             currentApplicationSection:props.currentApplicationSection,
  //             elementJzodSchema:targetJzodSchema,
  //             rootJzodSchema:props.rootJzodSchema,
  //           }}
  //         />
  //       :
  //         <span>Schema reference:{elementJzodSchema.definition.absolutePath}.{elementJzodSchema.definition.relativePath} not found!</span>
  //     )
  //     break;
  //   }
  //   case "record": {
  //     // log.info("JzodElementEditorFormik record","jzodSchema",jzodSchema);
  //     const targetJzodSchema =
  //       elementJzodSchema.definition.type == "schemaReference"
  //         ? // ? resolveJzodSchemaReference(elementJzodSchema.definition, currentModel, props.rootJzodSchema)
  //           resolveJzodSchemaReference(
  //             miroirFundamentalJzodSchema,
  //             elementJzodSchema.definition,
  //             currentModel,
  //             {} as JzodObject
  //           )
  //         : elementJzodSchema.definition;
  //     log.info("record",props.listKey,"targetJzodSchema", targetJzodSchema);
  //     // const discriminants=getUnionDiscriminantValues(targetJzodSchema, props.rootJzodSchema, currentModel)
  //     return (
  //       <div style={{ display: "inline-flex", flexDirection: "column", marginLeft:`calc(${usedIndentLevel}*(${indentShift}))`}}>
  //         {
  //           Object.entries(props.initialValuesObject).map(
  //             (attribute:[string,any],index: number): JSX.Element  => {
  //               // const currentAttributeJzodSchema:JzodElement = props.currentEnumJzodSchemaResolver[attribute[1].type]; // Union of jzodElements 
  //               let currentAttributeJzodSchema:JzodElement
  //               if (attribute[1].type) {
  //                 currentAttributeJzodSchema = props.currentEnumJzodSchemaResolver(attribute[1].type, attribute[1].definition); // Union of jzodElements. Only to edit jzod schemas only?
  //               } else {
  //                 currentAttributeJzodSchema = targetJzodSchema.type == "union"?targetJzodSchema.definition[index]:{ type: "simpleType", "definition": "string"}; 
  //               }
  //               log.info(
  //                 "record",
  //                 attribute[0],
  //                 "type",
  //                 attribute[1].type,
  //                 "found schema",
  //                 // (currentAttributeJzodSchema.definition as any)?.type?.definition,
  //                 currentAttributeJzodSchema,
  //                 "targetJzodSchema",
  //                 targetJzodSchema
  //               );
  //               return (
  //                 <div key={props.listKey+'.'+attribute[0]}>
  //                   {/* <div>{attribute[0]}</div> */}
  //                   <div>
  //                     <div key={2}>
  //                       <JzodElementEditorFormik
  //                         name={attribute[0]}
  //                         listKey={props.listKey+'.'+attribute[0]}
  //                         currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
  //                         indentLevel={usedIndentLevel}
  //                         // discriminants={discriminants[attribute[0]]?discriminants:undefined}
  //                         innerProps={{
  //                           label:currentAttributeJzodSchema?.extra?.defaultLabel,
  //                           initialValuesObject:attribute[1],
  //                           showButton:true,
  //                           currentDeploymentUuid:props.currentDeploymentUuid,
  //                           currentApplicationSection:props.currentApplicationSection,
  //                           elementJzodSchema:currentAttributeJzodSchema,
  //                           rootJzodSchema:props.rootJzodSchema,
  //                           // onSubmit:(data:any,event:any)=>{log.info("onSubmit called", data, event)},
  //                         }}
  //                       />
  //                     </div>
  //                   </div>
  //                 </div>
  //               );
  //             }
  //           )
  //         }
  //       </div>
  //     );
  //     break;
  //   }
  //   case "object": {
  //     let resolvedJzodSchema: JzodObject;
  //     if (elementJzodSchema.extend) {
  //       if (elementJzodSchema.extend.type == "schemaReference") {
  //         const resolvedExtend = resolveJzodSchemaReference(
  //           miroirFundamentalJzodSchema,
  //           elementJzodSchema.extend,
  //           currentModel,
  //           {} as JzodObject
  //         );
  //         if (resolvedExtend.type == "object") {
  //           resolvedJzodSchema = { ...elementJzodSchema, definition: { ...elementJzodSchema.definition, ...resolvedExtend.definition } }
  //         } else {
  //           throw new Error(
  //             "JzodElementEditorFormik extend clause for object schema is not an object. Schema: " +
  //               JSON.stringify(elementJzodSchema)
  //           );
  //         }
  //       } else {
  //         if (elementJzodSchema.extend.type == "object") {
  //           resolvedJzodSchema = { ...elementJzodSchema, definition: { ...elementJzodSchema.definition, ...elementJzodSchema.extend.definition } as Record<string, JzodElement> }
  //         } else {
  //           throw new Error(
  //             "JzodElementEditorFormik extend clause for object schema is not an object. Schema: " +
  //               JSON.stringify(elementJzodSchema)
  //           );
  //         }
  //         // resolvedJzodSchema = {
  //         //   ...elementJzodSchema,
  //         //   definition: { ...elementJzodSchema.definition, ...elementJzodSchema.extend.definition },
  //         // };
  //       }
  //     } else {
  //       resolvedJzodSchema = elementJzodSchema;
  //     }
  //     log.info("object", props.listKey, "found resolvedJzodSchema after resolving 'extend' clause:",resolvedJzodSchema);
  //     log.info("object", props.listKey, "found value:",props.initialValuesObject, "itemsOrder", itemsOrder);
      
  //     return (
  //       <div style={{ marginLeft: `calc(${usedIndentLevel}*(${indentShift}))` }}>
  //         <div>
  //         JzodElementEditorFormik rendered! {count}
  //         </div>
  //         {/* {props.listKey}:{'\{'} */}
  //         {displayedLabel}:{" {"}{" "}
  //         <ExpandOrFold
  //           hiddenFormItems={hiddenFormItems}
  //           setHiddenFormItems={setHiddenFormItems}
  //           listKey={props.listKey}
  //         ></ExpandOrFold>
  //         <div id={props.listKey + ".inner"} style={{ display: hiddenFormItems[props.listKey] ? "none" : "block" }}>
  //           {/* {Object.entries(props.initialValuesObject).map((attribute: [string, JzodElement]) => { */}
  //           {
  //             itemsOrder
  //               .map((i): [string, JzodElement] => [i, props.initialValuesObject[i]])
  //               .map((attribute: [string, JzodElement]) => {
  //                 // const currentAttributeDefinition = elementJzodSchema.definition[attribute[0]];
  //                 const currentAttributeDefinition = resolvedJzodSchema.definition[attribute[0]];
  //                 return (
  //                   <div
  //                     key={props.listKey + "." + attribute[0]}
  //                     style={{ marginLeft: `calc((${usedIndentLevel} + 1)*(${indentShift}))` }}
  //                   >
  //                     <JzodElementEditorFormik
  //                       name={attribute[0]}
  //                       listKey={props.listKey + "." + attribute[0]}
  //                       currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
  //                       indentLevel={usedIndentLevel}
  //                       innerProps={{
  //                         label: currentAttributeDefinition?.extra?.defaultLabel,
  //                         initialValuesObject: props.initialValuesObject
  //                           ? props.initialValuesObject[attribute[0]]
  //                           : undefined,
  //                         showButton: true,
  //                         currentDeploymentUuid: props.currentDeploymentUuid,
  //                         currentApplicationSection: props.currentApplicationSection,
  //                         elementJzodSchema: currentAttributeDefinition,
  //                         rootJzodSchema: props.rootJzodSchema,
  //                       }}
  //                     />
  //                   </div>
  //                 );
  //               }
  //             )
  //           }
  //         </div>
  //         {"}"}
  //       </div>
  //     );
  //     break;
  //   }
  //   case "literal": {
  //     // const defaultValue=props.formState.defaultValues?props.formState.defaultValues:'no value found!'
  //     if (props.discriminants) {
  //       return (
  //         <>
  //           {displayedLabel}:{" "} 
  //           <Select 
  //             // {...register(props.listKey, {required:true})}
  //             {...register(props.listKey)}
  //             options={props.discriminants[props.name].map(v=>({label:v,value:v}))} 
  //             name={props.name}
  //             // value={props.formState.defaultValues?props.formState.defaultValues[props.listKey]:{label:props.name,value:'no value found!'}}
  //             value={props.initialValuesObject?{label:props.initialValuesObject,value:props.initialValuesObject}:{label:props.name,value:'no value found!'}}
  //             defaultValue={props.initialValuesObject?{label:props.initialValuesObject,value:props.initialValuesObject}:{label:props.name,value:'no value found!'}}
  //             // onChange={(e)=>{log.info("onChange!",e);props.setValue(label,e?.value)}}
  //             onChange={(e)=>{log.info("literal boolean onChange! defaultValues",formState.defaultValues,e);setValue(props.listKey,e?.value);}}
  //           />
  //         </>
  //       )
  //     } else {
  //       return (
  //         <>
  //             {/* {props.listKey} - {label}:{" "} */}
  //             {displayedLabel}:{" "}{props.initialValuesObject}
  //             {/* <input
  //               {...props.register(props.listKey, {required:true})}
  //               form={"form." + props.name}
  //               name={props.name}
  //               onChange={(e)=>{log.info("JzodElementEditorFormik onChange!",props.name,e.target.value);props.setValue(props.name,e.target.value)}}
  //               defaultValue={props.initialValuesObject}
  //             /> */}
  //         </>
  //       );
  //     }
  //   break;
  //   }
  //   case "enum": {
  //     // log.info("JzodElementEditorFormik enum! value",props.initialValuesObject,"schema",elementJzodSchema);
  //     return (
  //       <span>
  //         {/* {displayedLabel}:{" "} */}
  //         <table>
  //           <tbody>
  //             <tr>
  //               <td>
  //                 {/* <StyledLabel htmlFor={props.listKey}>{displayedLabel}: </StyledLabel> */}
  //                 <label htmlFor={props.listKey}>{displayedLabel}: </label>
  //               </td>
  //               <td>
  //                 <Select 
  //                   // {...register(props.listKey, {required:true})}
  //                   {...register(props.listKey)}
  //                   options={elementJzodSchema.definition.map(v=>({label:v,value:v}))}
  //                   id={props.listKey}
  //                   name={props.name}
  //                   value={{label:props.initialValuesObject,value:props.initialValuesObject}}
  //                   defaultValue={{label:props.initialValuesObject,value:props.initialValuesObject}}
  //                   // onChange={(e)=>{log.info("JzodElementEditorFormik boolean onChange! defaultValues",props.formState.defaultValues,e);props.setValue(props.listKey,e?.value);}}
  //                   onChange={(event,value) => {log.info("JzodElementEditorFormik enum onChange",event,value);setValue(props.listKey,value)}}
  //                 />
  //               </td>
  //             </tr>
  //           </tbody>
  //         </table>
  //       </span>
  //     );
  //   break;
  //   }
  //   case "simpleType": {
  //     switch (elementJzodSchema.definition) {
  //       case "string":{
  //         const defaultValue=formState.defaultValues
  //         return (
  //           <>
  //               {/* {props.listKey} - {label}:{" "} */}
  //               {/* {displayedLabel}:{" "} */}
  //               {/* <StyledLabel htmlFor={props.listKey}>{displayedLabel}</StyledLabel> */}
  //               <label htmlFor={props.listKey}>{displayedLabel}: </label>
  //               <input
  //                 // {...register(props.listKey, {required:true})}
  //                 {...register(props.listKey)}
  //                 key={props.listKey}
  //                 form={"form." + props.name}
  //                 id={props.listKey}
  //                 name={props.name}
  //                 onChange={(e)=>{log.info("JzodElementEditorFormik string onChange!",props.name,e.target.value);setValue(props.listKey,e.target.value)}}
  //                 // value={props.initialValuesObject}
  //                 defaultValue={props.initialValuesObject}
  //               />
  //           </>
  //         );
  //         break;
  //       }
  //       case "boolean":{
  //         // log.info("JzodElementEditorFormik boolean!",props.listKey,"formState",props.formState)
  //         return (
  //           <>
  //           <table>
  //             <tbody>
  //               <tr>
  //                 <td>
  //                 {displayedLabel}:{" "} 
  //                 </td>
  //                 <td>
  //                   <Checkbox 
  //                     {...register(props.listKey)}
  //                     name={props.listKey}
  //                     defaultChecked={props.initialValuesObject}
  //                   />
  //                 </td>
  //               </tr>
  //             </tbody>
  //           </table>
  //           </>
  //         );
  //         break;
  //       }
  //       case "number": {
  //         const defaultValue:number | undefined=props.initialValuesObject?(props.initialValuesObject as any as number):undefined;
  //         // log.info("JzodElementEditorFormik number!",props.listKey,"props.initialValuesObject",props.initialValuesObject)
  //         return (
  //           <>
  //               {/* {props.listKey} - {label}:{" "} */}
  //             {displayedLabel}:{" "}
  //             <input
  //               // {...register(props.listKey, {required:true})}
  //               {...register(props.listKey)}
  //               form={"form." + props.name}
  //               name={props.name}
  //               onChange={(e)=>{log.info("JzodElementEditorFormik number onChange!",props.name,e.target.value);setValue(props.listKey,e.target.value)}}
  //               defaultValue={defaultValue}
  //             />
  //           </>
  //         );
  //         break;
  //       }
  //       case "any":
  //       case "uuid":
  //       default: {
  //         const defaultValue=formState.defaultValues?formState.defaultValues[props.name]:'no value found!'
  //         return (
  //           <>
  //               {/* {props.listKey} - {label}:{" "} */}
  //               {/* {displayedLabel}:{" "} */}
  //               {/* <StyledLabel htmlFor={props.listKey}>{displayedLabel}: </StyledLabel> */}
  //               <label htmlFor={props.listKey}>{displayedLabel}: </label>
  //               <input
  //                 // {...register(props.listKey, {required:true})}
  //                 {...register(props.listKey)}
  //                 id={props.listKey}
  //                 form={"form." + props.name}
  //                 name={props.name}
  //                 onChange={(e)=>{log.info("JzodElementEditorFormik number onChange!",props.name,e.target.value);setValue(props.listKey,e.target.value)}}
  //                 defaultValue={defaultValue}
  //               />
  //           </>
  //         );
  //       // throw new Error("JzodElementEditorFormik could not handle jzodSchema type:",elementJzodSchema?.type,elementJzodSchema.definition);
  //         break;
  //       }
  //     }
  //     break;
  //   }
  //   case "union": {
  //     // const defaultValue=JSON.stringify(formState.defaultValues)
  //     const defaultValue =
  //       typeof props.initialValuesObject == "string"
  //         ? props.initialValuesObject
  //         : JSON.stringify(props.initialValuesObject);
  //     return (
  //       <>
  //         <label htmlFor={props.listKey}>{displayedLabel}: </label>
  //         <StyledLabel style={labelStyle} htmlFor={props.listKey}>
  //           {/* {props.listKey} union: {displayedLabel} */}
  //           {/* {props.listKey} union: {defaultValue} */}
  //         </StyledLabel>
  //         {/* <div>a</div> */}
  //         <input
  //           {...register(props.listKey)}
  //           form={"form." + props.name}
  //           id={props.listKey}
  //           name={props.name}
  //           onChange={(e) => {
  //             log.info("JzodElementEditorFormik union onChange!", props.name, e.target.value);
  //             setValue(props.listKey, JSON.parse(e.target.value));
  //           }}
  //           defaultValue={defaultValue}
  //         />
  //         {/* <div>b</div> */}
  //       </>
  //     );

  //     break;
  //   }
  //   default:{
  //       const defaultValue=formState.defaultValues?formState.defaultValues[props.name]:'no value found!'
  //       return (
  //         <>
  //             {/* {props.listKey} - {label}:{" "} */}
  //             {displayedLabel}:{" "}
  //             <input
  //               // {...register(props.listKey, {required:true})}
  //               {...register(props.listKey)}
  //               form={"form." + props.name}
  //               name={props.name}
  //               onChange={(e)=>{log.info("JzodElementEditorFormik default onChange!",props.name,e.target.value);setValue(props.listKey,e.target.value)}}
  //               defaultValue={defaultValue}
  //             />
  //         </>
  //       );
  //     // }
  //   }
  //   break;
  // }
}
