
import { useMemo, useState } from "react";
import Select from 'react-select';

import { useFormContext } from "react-hook-form";

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


const loggerName: string = getLoggerName(packageName, cleanLevel,"JzodElementEditor");
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

export interface JzodElementFormEditorCoreProps {
  label?: string;
  // rootJzodSchema: JzodObject;
  rootJzodSchema: JzodElement;
  elementJzodSchema: JzodElement;
  initialValuesObject: any;
  currentDeploymentUuid?: Uuid;
  currentApplicationSection?: ApplicationSection;
}

export interface JzodObjectFormEditorWithButtonProps extends JzodElementFormEditorCoreProps {
  showButton: true;
}

export interface JzodElementFormEditorWithoutButtonProps extends JzodElementFormEditorCoreProps {
  showButton: false;
}

export type JzodElementFormEditorProps =
  | JzodObjectFormEditorWithButtonProps
  | JzodElementFormEditorWithoutButtonProps;

export interface JzodElementEditorProps {
  name: string,
  listKey: string,
  editReference?: boolean,
  currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver,
  discriminants?:{[k:string]:string[]},
  indentLevel?:number,
  innerProps: JzodElementFormEditorProps,
}


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




// ################################################################################################
export function getUnionDiscriminantValues(jzodUnion:JzodUnion, rootJzodSchema:JzodObject, currentModel:MetaModel) {
  return jzodUnion.discriminator
    ? {
        [jzodUnion.discriminator]:jzodUnion.definition.map(
          (e: JzodElement) => {
            const resolvedSchema =
              e.type == "schemaReference" ? resolveJzodSchemaReference(miroirFundamentalJzodSchema, e, currentModel, rootJzodSchema) : e;
            return e.type;
          }
        )
      }
    : {};
}

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

// #####################################################################################################
export const JzodElementEditor = (
  props: JzodElementEditorProps
): JSX.Element => {
  const {label, elementJzodSchema: elementJzodSchema, initialValuesObject} = props.innerProps;
  // const [selectedOption, setSelectedOption] = useState({label:props.name,value:props.innerProps.initialValuesObject});
  const formMethods = useFormContext();
  const { register, handleSubmit, reset, trigger, watch, setValue, getValues, formState } = formMethods;
  const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

  const [hiddenFormItems,setHiddenFormItems] = useState<{[k:string]:boolean}>({})
  const [itemsOrder, setItemsOrder] = useState<any[]>(
    Array.isArray(props.innerProps.initialValuesObject)
      ? props.innerProps.initialValuesObject.map((e, k) => k)
      : (
        typeof(props.innerProps.initialValuesObject) == "object" && props.innerProps.initialValuesObject !== null
        ? Object.keys(props.innerProps.initialValuesObject)
        : []
      )
  );
  
  const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache({
    queryType: "LocalCacheEntityInstancesSelectorParams",
    definition: {
      deploymentUuid: props.innerProps.currentDeploymentUuid,
      applicationSection: props.innerProps.currentApplicationSection,
      entityUuid:
        elementJzodSchema?.type == "simpleType" && elementJzodSchema?.definition == "string" && elementJzodSchema.extra?.targetEntity
          ? elementJzodSchema.extra?.targetEntity
          : "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
    }
  });

  const selectList: EntityInstanceWithName[] = useMemo(
    () => (instancesToDisplayUuidIndex ? Object.values(instancesToDisplayUuidIndex) : []) as EntityInstanceWithName[],
    [instancesToDisplayUuidIndex]
  );

  const currentModel = useCurrentModel(applicationDeploymentMiroir.uuid);

  const displayedLabel: string = label?label:props.name;

  const usedIndentLevel: number = props.indentLevel?props.indentLevel:0;

  log.info(
    "JzodElementEditor rendering",
    props.listKey,
    "type=",
    elementJzodSchema?.type,
    "typeof initialValue=",
    typeof props.innerProps.initialValuesObject,
    "initialValue=",
    props.innerProps.initialValuesObject,
    "jzodSchema=",
    elementJzodSchema,
    "itemsOrder",
    itemsOrder,
    "props=",
    props
  );
  

  switch (elementJzodSchema?.type) {
    case "array":{
      log.info("############################################### JzodElementEditor array");
      
      // const columnDefs: any[] = getColumnDefinitionsFromEntityDefinitionJzodObjectSchema(
      //   ((elementJzodSchema as JzodArray).definition
      //     ? (elementJzodSchema as JzodArray).definition
      //     : {}) as JzodObject
      // );
      const resolvedJzodSchema =
        elementJzodSchema.definition.type == "schemaReference"
          ? // ? resolveJzodSchemaReference(elementJzodSchema.definition, currentModel, props.innerProps.rootJzodSchema)
            resolveJzodSchemaReference(
              miroirFundamentalJzodSchema,
              elementJzodSchema.definition,
              currentModel,
              {} as JzodObject
            )
          : elementJzodSchema.definition;

      // const targetJzodSchema = resolvedJzodSchema.type == 'union'?props.currentEnumJzodSchemaResolver[elementJzodSchema?.type]:resolvedJzodSchema;
      const targetJzodSchema =
        resolvedJzodSchema.type == "union"
          ? props.currentEnumJzodSchemaResolver(elementJzodSchema?.type, elementJzodSchema?.definition)
          : resolvedJzodSchema;

      log.info("array",props.innerProps.initialValuesObject, "resolvedJzodSchema",resolvedJzodSchema,"targetJzodSchema",targetJzodSchema);

      
      return (
        <div style={{ marginLeft: `calc(${usedIndentLevel}*(${indentShift}))` }}>
          {displayedLabel}:{" {"}{" "}
          <ExpandOrFold
            hiddenFormItems={hiddenFormItems}
            setHiddenFormItems={setHiddenFormItems}
            listKey={props.listKey}
          ></ExpandOrFold>
          {/* <div>itemsOrder {JSON.stringify(itemsOrder)}</div> */}
          <div id={props.listKey + ".inner"} style={{ display: hiddenFormItems[props.listKey] ? "none" : "block" }}>
            {/* {props.innerProps.initialValuesObject.map((attribute: JzodElement, index: number) => { */}
            {(itemsOrder as number[])
              .map((i: number):[number, JzodElement] => [i, props.innerProps.initialValuesObject[i]])
              .map((attributeParam: [number, JzodElement]) => {
                const index: number = attributeParam[0];
                const attribute = attributeParam[1];
                // HACK HACK HACK
                // in the case of a union type, the concrete type of each member has to be resolved, as in the case of the jzodElement definition.
                // A proper solution should be devised, such as detecting that a type is displayed (here this could be problematic in general when a
                // "type" attribute is defined in a value, "type" becomes a reserved word by Jzod, this is not good.)
                const currentAttributeJzodSchema =
                  resolvedJzodSchema.type == "union" && attribute.type
                    ? // ? props.currentEnumJzodSchemaResolver[attribute.type]
                      props.currentEnumJzodSchemaResolver(attribute.type, attribute.definition)
                    : targetJzodSchema; // Union of jzodElements
                log.info(
                  "array [",
                  index,
                  "]",
                  attribute,
                  "type",
                  attribute.type,
                  "found schema",
                  currentAttributeJzodSchema
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
                      currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
                      indentLevel={usedIndentLevel}
                      innerProps={{
                        // label:targetJzodSchema?.extra?.defaultLabel,
                        label: currentAttributeJzodSchema?.extra?.defaultLabel,
                        initialValuesObject: props.innerProps.initialValuesObject
                          ? props.innerProps.initialValuesObject[index]
                          : undefined,
                        showButton: true,
                        currentDeploymentUuid: props.innerProps.currentDeploymentUuid,
                        currentApplicationSection: props.innerProps.currentApplicationSection,
                        elementJzodSchema: currentAttributeJzodSchema,
                        rootJzodSchema: props.innerProps.rootJzodSchema,
                      }}
                    />
                  </div>
                );
              })}
          </div>
          {"}"}
        </div>
      );
      break;
    }
    case "schemaReference": {
      const resolvedJzodSchema = resolveJzodSchemaReference(miroirFundamentalJzodSchema, elementJzodSchema, currentModel)
      log.info("schemaReference","resolvedJzodSchema",resolvedJzodSchema);

      const targetJzodSchema = resolvedJzodSchema.type == 'union'?props.currentEnumJzodSchemaResolver(elementJzodSchema?.type, elementJzodSchema?.definition):resolvedJzodSchema;
      log.info("schemaReference","resolvedJzodSchema",resolvedJzodSchema,"targetJzodSchema",targetJzodSchema);

      return (
        targetJzodSchema?
          <JzodElementEditor
            name={props.name}
            listKey={props.listKey}
            currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
            innerProps={{
              label:targetJzodSchema.extra?.defaultLabel,
              initialValuesObject:props.innerProps.initialValuesObject, // initial value does not change, only the type reference is resolved at this step
              showButton:true,
              currentDeploymentUuid:props.innerProps.currentDeploymentUuid,
              currentApplicationSection:props.innerProps.currentApplicationSection,
              elementJzodSchema:targetJzodSchema,
              rootJzodSchema:props.innerProps.rootJzodSchema,
            }}
          />
        :
          <span>Schema reference:{elementJzodSchema.definition.absolutePath}.{elementJzodSchema.definition.relativePath} not found!</span>
      )
      break;
    }
    case "record": {
      // log.info("JzodElementEditor record","jzodSchema",jzodSchema);
      const targetJzodSchema =
        elementJzodSchema.definition.type == "schemaReference"
          ? // ? resolveJzodSchemaReference(elementJzodSchema.definition, currentModel, props.innerProps.rootJzodSchema)
            resolveJzodSchemaReference(
              miroirFundamentalJzodSchema,
              elementJzodSchema.definition,
              currentModel,
              {} as JzodObject
            )
          : elementJzodSchema.definition;
      log.info("record",props.listKey,"targetJzodSchema", targetJzodSchema);
      // const discriminants=getUnionDiscriminantValues(targetJzodSchema, props.innerProps.rootJzodSchema, currentModel)
      return (
        <div style={{ display: "inline-flex", flexDirection: "column", marginLeft:`calc(${usedIndentLevel}*(${indentShift}))`}}>
          {
            Object.entries(props.innerProps.initialValuesObject).map(
              (attribute:[string,any],index: number): JSX.Element  => {
                // const currentAttributeJzodSchema:JzodElement = props.currentEnumJzodSchemaResolver[attribute[1].type]; // Union of jzodElements 
                let currentAttributeJzodSchema:JzodElement
                if (attribute[1].type) {
                  currentAttributeJzodSchema = props.currentEnumJzodSchemaResolver(attribute[1].type, attribute[1].definition); // Union of jzodElements. Only to edit jzod schemas only?
                } else {
                  currentAttributeJzodSchema = targetJzodSchema.type == "union"?targetJzodSchema.definition[index]:{ type: "simpleType", "definition": "string"}; 
                }
                log.info(
                  "record",
                  attribute[0],
                  "type",
                  attribute[1].type,
                  "found schema",
                  // (currentAttributeJzodSchema.definition as any)?.type?.definition,
                  currentAttributeJzodSchema,
                  "targetJzodSchema",
                  targetJzodSchema
                );
                return (
                  <div key={props.listKey+'.'+attribute[0]}>
                    {/* <div>{attribute[0]}</div> */}
                    <div>
                      <div key={2}>
                        <JzodElementEditor
                          name={attribute[0]}
                          listKey={props.listKey+'.'+attribute[0]}
                          currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
                          indentLevel={usedIndentLevel}
                          // discriminants={discriminants[attribute[0]]?discriminants:undefined}
                          innerProps={{
                            label:currentAttributeJzodSchema?.extra?.defaultLabel,
                            initialValuesObject:attribute[1],
                            showButton:true,
                            currentDeploymentUuid:props.innerProps.currentDeploymentUuid,
                            currentApplicationSection:props.innerProps.currentApplicationSection,
                            elementJzodSchema:currentAttributeJzodSchema,
                            rootJzodSchema:props.innerProps.rootJzodSchema,
                            // onSubmit:(data:any,event:any)=>{log.info("onSubmit called", data, event)},
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }
            )
          }
        </div>
      );
      break;
    }
    case "object": {
      let resolvedJzodSchema: JzodObject;
      if (elementJzodSchema.extend) {
        if (elementJzodSchema.extend.type == "schemaReference") {
          const resolvedExtend = resolveJzodSchemaReference(
            miroirFundamentalJzodSchema,
            elementJzodSchema.extend,
            currentModel,
            {} as JzodObject
          );
          if (resolvedExtend.type == "object") {
            resolvedJzodSchema = { ...elementJzodSchema, definition: { ...elementJzodSchema.definition, ...resolvedExtend.definition } }
          } else {
            throw new Error(
              "JzodElementEditor extend clause for object schema is not an object. Schema: " +
                JSON.stringify(elementJzodSchema)
            );
          }
        } else {
          if (elementJzodSchema.extend.type == "object") {
            resolvedJzodSchema = { ...elementJzodSchema, definition: { ...elementJzodSchema.definition, ...elementJzodSchema.extend.definition } as Record<string, JzodElement> }
          } else {
            throw new Error(
              "JzodElementEditor extend clause for object schema is not an object. Schema: " +
                JSON.stringify(elementJzodSchema)
            );
          }
          // resolvedJzodSchema = {
          //   ...elementJzodSchema,
          //   definition: { ...elementJzodSchema.definition, ...elementJzodSchema.extend.definition },
          // };
        }
      } else {
        resolvedJzodSchema = elementJzodSchema;
      }
      log.info("object", props.listKey, "found resolvedJzodSchema after resolving 'extend' clause:",resolvedJzodSchema);
      log.info("object", props.listKey, "found value:",props.innerProps.initialValuesObject, "itemsOrder", itemsOrder);
      
      return (
        <div style={{ marginLeft: `calc(${usedIndentLevel}*(${indentShift}))` }}>
          {/* {props.listKey}:{'\{'} */}
          {displayedLabel}:{" {"}{" "}
          <ExpandOrFold
            hiddenFormItems={hiddenFormItems}
            setHiddenFormItems={setHiddenFormItems}
            listKey={props.listKey}
          ></ExpandOrFold>
          <div id={props.listKey + ".inner"} style={{ display: hiddenFormItems[props.listKey] ? "none" : "block" }}>
            {/* {Object.entries(props.innerProps.initialValuesObject).map((attribute: [string, JzodElement]) => { */}
            {
              itemsOrder
                .map((i): [string, JzodElement] => [i, props.innerProps.initialValuesObject[i]])
                .map((attribute: [string, JzodElement]) => {
                  // const currentAttributeDefinition = elementJzodSchema.definition[attribute[0]];
                  const currentAttributeDefinition = resolvedJzodSchema.definition[attribute[0]];
                  return (
                    <div
                      key={props.listKey + "." + attribute[0]}
                      style={{ marginLeft: `calc((${usedIndentLevel} + 1)*(${indentShift}))` }}
                    >
                      <JzodElementEditor
                        name={attribute[0]}
                        listKey={props.listKey + "." + attribute[0]}
                        currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
                        indentLevel={usedIndentLevel}
                        innerProps={{
                          label: currentAttributeDefinition?.extra?.defaultLabel,
                          initialValuesObject: props.innerProps.initialValuesObject
                            ? props.innerProps.initialValuesObject[attribute[0]]
                            : undefined,
                          showButton: true,
                          currentDeploymentUuid: props.innerProps.currentDeploymentUuid,
                          currentApplicationSection: props.innerProps.currentApplicationSection,
                          elementJzodSchema: currentAttributeDefinition,
                          rootJzodSchema: props.innerProps.rootJzodSchema,
                        }}
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
    case "literal": {
      // const defaultValue=props.formState.defaultValues?props.formState.defaultValues:'no value found!'
      if (props.discriminants) {
        return (
          <>
            {displayedLabel}:{" "} 
            <Select 
              // {...register(props.listKey, {required:true})}
              {...register(props.listKey)}
              options={props.discriminants[props.name].map(v=>({label:v,value:v}))} 
              name={props.name}
              // value={props.formState.defaultValues?props.formState.defaultValues[props.listKey]:{label:props.name,value:'no value found!'}}
              value={props.innerProps.initialValuesObject?{label:props.innerProps.initialValuesObject,value:props.innerProps.initialValuesObject}:{label:props.name,value:'no value found!'}}
              defaultValue={props.innerProps.initialValuesObject?{label:props.innerProps.initialValuesObject,value:props.innerProps.initialValuesObject}:{label:props.name,value:'no value found!'}}
              // onChange={(e)=>{log.info("onChange!",e);props.setValue(label,e?.value)}}
              onChange={(e)=>{log.info("literal boolean onChange! defaultValues",formState.defaultValues,e);setValue(props.listKey,e?.value);}}
            />
          </>
        )
      } else {
        return (
          <>
              {/* {props.listKey} - {label}:{" "} */}
              {displayedLabel}:{" "}{props.innerProps.initialValuesObject}
              {/* <input
                {...props.register(props.listKey, {required:true})}
                form={"form." + props.name}
                name={props.name}
                onChange={(e)=>{log.info("JzodElementEditor onChange!",props.name,e.target.value);props.setValue(props.name,e.target.value)}}
                defaultValue={props.innerProps.initialValuesObject}
              /> */}
          </>
        );
      }
    break;
    }
    case "enum": {
      // log.info("JzodElementEditor enum! value",props.innerProps.initialValuesObject,"schema",elementJzodSchema);
      return (
        <span>
          {/* {displayedLabel}:{" "} */}
          <table>
            <tbody>
              <tr>
                <td>
                  <StyledLabel htmlFor={props.listKey}>{displayedLabel}: </StyledLabel>
                </td>
                <td>
                  <Select 
                    // {...register(props.listKey, {required:true})}
                    {...register(props.listKey)}
                    options={elementJzodSchema.definition.map(v=>({label:v,value:v}))}
                    id={props.listKey}
                    name={props.name}
                    value={{label:props.innerProps.initialValuesObject,value:props.innerProps.initialValuesObject}}
                    defaultValue={{label:props.innerProps.initialValuesObject,value:props.innerProps.initialValuesObject}}
                    // onChange={(e)=>{log.info("JzodElementEditor boolean onChange! defaultValues",props.formState.defaultValues,e);props.setValue(props.listKey,e?.value);}}
                    onChange={(event,value) => {log.info("JzodElementEditor enum onChange",event,value);setValue(props.listKey,value)}}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </span>
      );
    break;
    }
    case "simpleType": {
      switch (elementJzodSchema.definition) {
        case "string":{
          const defaultValue=formState.defaultValues
          return (
            <>
                {/* {props.listKey} - {label}:{" "} */}
                {/* {displayedLabel}:{" "} */}
                <StyledLabel htmlFor={props.listKey}>{displayedLabel}</StyledLabel>
                <input
                  // {...register(props.listKey, {required:true})}
                  {...register(props.listKey)}
                  key={props.listKey}
                  form={"form." + props.name}
                  id={props.listKey}
                  name={props.name}
                  onChange={(e)=>{log.info("JzodElementEditor string onChange!",props.name,e.target.value);setValue(props.listKey,e.target.value)}}
                  // value={props.innerProps.initialValuesObject}
                  defaultValue={props.innerProps.initialValuesObject}
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
                      {...register(props.listKey)}
                      name={props.listKey}
                      defaultChecked={props.innerProps.initialValuesObject}
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
          const defaultValue:number | undefined=props.innerProps.initialValuesObject?(props.innerProps.initialValuesObject as any as number):undefined;
          // log.info("JzodElementEditor number!",props.listKey,"props.innerProps.initialValuesObject",props.innerProps.initialValuesObject)
          return (
            <>
                {/* {props.listKey} - {label}:{" "} */}
              {displayedLabel}:{" "}
              <input
                // {...register(props.listKey, {required:true})}
                {...register(props.listKey)}
                form={"form." + props.name}
                name={props.name}
                onChange={(e)=>{log.info("JzodElementEditor number onChange!",props.name,e.target.value);setValue(props.listKey,e.target.value)}}
                defaultValue={defaultValue}
              />
            </>
          );
          break;
        }
        case "any":
        case "uuid":
        default: {
          const defaultValue=formState.defaultValues?formState.defaultValues[props.name]:'no value found!'
          return (
            <>
                {/* {props.listKey} - {label}:{" "} */}
                {/* {displayedLabel}:{" "} */}
                <StyledLabel htmlFor={props.listKey}>{displayedLabel}: </StyledLabel>
                <input
                  // {...register(props.listKey, {required:true})}
                  {...register(props.listKey)}
                  id={props.listKey}
                  form={"form." + props.name}
                  name={props.name}
                  onChange={(e)=>{log.info("JzodElementEditor number onChange!",props.name,e.target.value);setValue(props.listKey,e.target.value)}}
                  defaultValue={defaultValue}
                />
            </>
          );
        // throw new Error("JzodElementEditor could not handle jzodSchema type:",elementJzodSchema?.type,elementJzodSchema.definition);
          break;
        }
      }
      break;
    }
    case "union": {
      // const defaultValue=JSON.stringify(formState.defaultValues)
      const defaultValue =
        typeof props.innerProps.initialValuesObject == "string"
          ? props.innerProps.initialValuesObject
          : JSON.stringify(props.innerProps.initialValuesObject);
      return (
        <>
          <StyledLabel style={labelStyle} htmlFor={props.listKey}>
            {/* {props.listKey} union: {displayedLabel} */}
            {/* {props.listKey} union: {defaultValue} */}
          </StyledLabel>
          {/* <div>a</div> */}
          <input
            {...register(props.listKey)}
            form={"form." + props.name}
            id={props.listKey}
            name={props.name}
            onChange={(e) => {
              log.info("JzodElementEditor union onChange!", props.name, e.target.value);
              setValue(props.listKey, JSON.parse(e.target.value));
            }}
            defaultValue={defaultValue}
          />
          {/* <div>b</div> */}
        </>
      );

      break;
    }
    default:{
        const defaultValue=formState.defaultValues?formState.defaultValues[props.name]:'no value found!'
        return (
          <>
              {/* {props.listKey} - {label}:{" "} */}
              {displayedLabel}:{" "}
              <input
                // {...register(props.listKey, {required:true})}
                {...register(props.listKey)}
                form={"form." + props.name}
                name={props.name}
                onChange={(e)=>{log.info("JzodElementEditor default onChange!",props.name,e.target.value);setValue(props.listKey,e.target.value)}}
                defaultValue={defaultValue}
              />
          </>
        );
      // }
    }
    break;
  }
}
