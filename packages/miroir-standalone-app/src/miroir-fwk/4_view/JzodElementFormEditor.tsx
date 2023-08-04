import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { FieldErrors, FormState, SubmitHandler, UseFormRegister, UseFormSetValue, useForm } from "react-hook-form";
import Select from 'react-select';
import { z } from "zod";

import AddBoxIcon from "@mui/icons-material/AddBox";
import { Autocomplete, Box, Button, List, ListItem, Paper, TextField, styled } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";

import { JzodArray, JzodElement, JzodObject, JzodReference, JzodUnion, jzodElementSchemaToZodSchemaAndDescription } from "@miroir-framework/jzod";
import { ApplicationSection, EntityAttribute, EntityInstanceWithName, EntityInstancesUuidIndex, MiroirMetaModel, Uuid, applicationDeploymentMiroir } from "miroir-core";
import { useMiroirContextInnerFormOutput, useMiroirContextService } from "./MiroirContextReactProvider";
import { ReportSectionDisplay } from "./ReportSectionDisplay";
import { getColumnDefinitionsFromEntityDefinitionJzodSchema } from "./getColumnDefinitionsFromEntityAttributes";
import { useCurrentModel, useEntityInstanceUuidIndexFromLocalCache } from "./ReduxHooks";


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

const indentShift =  "1em + 4px";

// #####################################################################################################
export type JzodObjectFormEditorInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

export interface JzodElementFormEditorCoreProps {
  label: string;
  // rootJzodSchema: JzodElement;
  rootJzodSchema: JzodObject;
  elementJzodSchema: JzodElement;
  // getData:(jzodSchema:JzodElement) => any;
  initialValuesObject: any;
  currentDeploymentUuid?: Uuid;
  currentApplicationSection?: ApplicationSection;
  // onSubmit: SubmitHandler<JzodObjectFormEditorInputs>;
  onSubmit: (data:any,event:any,error:any)=>void;
  // selectValue?: { value: string, label: string }[];
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
  currentEnumJzodSchemaResolver:{[k:string]:JzodObject},
  discriminants?:{[k:string]:string[]},
  indentLevel?:number,
  innerProps: JzodElementFormEditorProps,
  register: UseFormRegister<any>,
  errors: FieldErrors<any>,
  formState: FormState<any>,
  setValue: UseFormSetValue<any>,
}

export function resolveJzodSchemaReference(jzodSchema:JzodReference, rootJzodSchema:JzodObject, currentModel:MiroirMetaModel) {
  const absoluteReferenceTargetJzodSchema: JzodElement | undefined = jzodSchema.definition.absolutePath
  ? currentModel.jzodSchemas.find((s) => s.uuid == jzodSchema.definition.absolutePath)?.definition
  : rootJzodSchema;
const targetJzodSchema = jzodSchema.definition.relativePath
  ? absoluteReferenceTargetJzodSchema?.definition
    ? (absoluteReferenceTargetJzodSchema?.definition as any)[jzodSchema.definition.relativePath]
    : undefined
  : absoluteReferenceTargetJzodSchema;
  console.log("JzodElementEditor resolveJzodSchemaReference jzodSchema",jzodSchema, "rootJzodSchema",rootJzodSchema,absoluteReferenceTargetJzodSchema);
  
  return targetJzodSchema;
}

export function getUnionDiscriminantValues(jzodUnionSchema:JzodUnion, rootJzodSchema:JzodObject, currentModel:MiroirMetaModel) {
  return jzodUnionSchema.discriminant
    ? {
        [jzodUnionSchema.discriminant]:jzodUnionSchema.definition.map(
          (e) => {
            const resolvedSchema =
              e.type == "schemaReference" ? resolveJzodSchemaReference(e, rootJzodSchema, currentModel) : e;
            return e.type;
          }
        )
      }
    : {};
}

// #####################################################################################################
export const JzodElementEditor = (
  props: JzodElementEditorProps
): JSX.Element => {
  const {label, elementJzodSchema: elementJzodSchema, initialValuesObject} = props.innerProps;
  // const [selectedOption, setSelectedOption] = useState({label:props.name,value:props.innerProps.initialValuesObject});

  
  const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache({
    deploymentUuid: props.innerProps.currentDeploymentUuid,
    applicationSection: props.innerProps.currentApplicationSection,
    entityUuid:
      elementJzodSchema?.type == "simpleType" && elementJzodSchema?.definition == "string" && elementJzodSchema.extra?.targetEntity
        ? elementJzodSchema.extra?.targetEntity
        : "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  });

  const selectList: EntityInstanceWithName[] = useMemo(
    () => (instancesToDisplayUuidIndex ? Object.values(instancesToDisplayUuidIndex) : []) as EntityInstanceWithName[],
    [instancesToDisplayUuidIndex]
  );

  const currentModel = useCurrentModel(applicationDeploymentMiroir.uuid);

  const displayedLabel: string = label?label:props.name;

  const usedIndentLevel: number = props.indentLevel?props.indentLevel:0;

  // console.log("JzodElementEditor selectList",selectList);
  console.log(
    "JzodElementEditor rendering",
    props.listKey,
    "type",
    elementJzodSchema?.type,
    "jzodSchema",
    elementJzodSchema,
    "initialValue",
    props.innerProps.initialValuesObject,
    "props",
    props
  );
  

  switch (elementJzodSchema?.type) {
    case "array":{
      const columnDefs: any[] = getColumnDefinitionsFromEntityDefinitionJzodSchema(
        ((elementJzodSchema as JzodArray).definition
          ? (elementJzodSchema as JzodArray).definition
          : {}) as JzodObject
      );

      return (
        // <ListItem disableGutters key={props.name}>
        <>
          {displayedLabel}
          <span>
            <ReportSectionDisplay
              tableComponentReportType="JSON_ARRAY"
              label={"JSON_ARRAY-" + props.name}
              columnDefs={columnDefs}
              rowData={initialValuesObject[props.name]}
              styles={{
                width: "50vw",
                height: "22vw",
              }}
            ></ReportSectionDisplay>
          </span>
        </>
        // </ListItem>
      );
      break;
    }
    case "schemaReference": {
      const targetJzodSchema = resolveJzodSchemaReference(elementJzodSchema,props.innerProps.rootJzodSchema,currentModel)
      console.log(
        "JzodElementEditor schemaReference",
        props.listKey,
        "from elementJzodSchema",
        elementJzodSchema,
        "pointing to",
        targetJzodSchema,
        "targetJsonSchema",
        targetJzodSchema
      );
      //   const absoluteReferenceTargetJzodSchema: JzodElement | undefined = jzodSchema.absolutePath
      //   ? currentModel.jzodSchemas.find((s) => s.uuid == jzodSchema.absolutePath)?.definition
      //   : props.innerProps.rootJzodSchema;
      // const targetJzodSchema = jzodSchema.relativePath
      //   ? absoluteReferenceTargetJzodSchema?.definition
      //     ? (absoluteReferenceTargetJzodSchema?.definition as any)[jzodSchema.relativePath]
      //     : undefined
      //   : absoluteReferenceTargetJzodSchema;
      
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
              onSubmit:(data:any,event:any)=>{console.log("onSubmit called", data, event)},
            }}
            register={props.register}
            errors={props.errors}
            formState={props.formState}
            setValue={props.setValue}
          />
        :
          <span>Schema reference:{elementJzodSchema.definition.absolutePath}.{elementJzodSchema.definition.relativePath} not found!</span>
      )
      break;
    }
    case "record": {
      // console.log("JzodElementEditor record","jzodSchema",jzodSchema);
      const targetJzodSchema =
        elementJzodSchema.definition.type == "schemaReference"
          ? resolveJzodSchemaReference(elementJzodSchema.definition, props.innerProps.rootJzodSchema, currentModel)
          : elementJzodSchema;
      console.log("JzodElementEditor record targetJzodSchema", targetJzodSchema);
      // const discriminants=getUnionDiscriminantValues(targetJzodSchema, props.innerProps.rootJzodSchema, currentModel)
      return (
        // <span>record: {props.listKey} - {label}</span>
        // const currentAttributeDefinition = (jzodSchema as any)[attribute[0]];
        // <List sx={{ pt: 0, bgcolor: 'background.paper', borderWidth: "4px", borderColor:"beige" }}>
        <div style={{ display: "inline-flex", flexDirection: "column", marginLeft:`calc(${usedIndentLevel}*(${indentShift}))`}}>
          {
            // Object.entries(props?.jzodSchema.definition).length > 0? 
            Object.entries(props.innerProps.initialValuesObject).map(
              (attribute:[string,JzodElement]) => {
                // Object.entries(jzodSchema.definition).map((schemaAttribute:[string,JzodElement]) => {
                // const currentAttributeDefinition = (targetJzodSchema as any)[attribute[0]];
                const currentAttributeJzodSchema = props.currentEnumJzodSchemaResolver[attribute[1].type];
                console.log("JzodElementEditor record",attribute[0],"type",attribute[1].type,"discriminants",props.discriminants,"found schema",currentAttributeJzodSchema);
                // {/* <ListItem disableGutters key={props.name+'_'+schemaAttribute[0]+'jzod'}>
                //   schema: {JSON.stringify(currentAttributeDefinition)}
                // </ListItem> */}
                return (
                  // <ListItem disableGutters key={props.listKey+'.'+attribute[0]}>
                  //   {attribute[0]}: {JSON.stringify(attribute[1])} {JSON.stringify(currentAttributeJzodSchema)}
                  // </ListItem>
                  <div key={props.listKey+'.'+attribute[0]}>
                    {/* <div>{attribute[0]}</div> */}
                    <div>
                      {/* <ListItem key={1}>
                        record {attribute[0]}: {JSON.stringify(attribute[1])} ######{JSON.stringify(currentAttributeJzodSchema)}
                      </ListItem> */}
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
                            onSubmit:(data:any,event:any)=>{console.log("onSubmit called", data, event)},
                          }}
                          register={props.register}
                          errors={props.errors}
                          formState={props.formState}
                          setValue={props.setValue}
                        />
                      </div>
                    </div>
                  </div>
                  );
              }
            )
          }
        </div>
        // </List>
      );
      break;
    }
    case "object": {
      // no break
      
      return (
        <div style={{ marginLeft:`calc(${usedIndentLevel}*(${indentShift}))`}}>
        {/* {props.listKey}:{'\{'} */}
          {displayedLabel}:{" \{"}
          <div>
            {
              // Object.entries(props?.jzodSchema.definition).length > 0? 
              Object.entries(props.innerProps.initialValuesObject).map(
                (attribute:[string,JzodElement]) => {
                  // Object.entries(jzodSchema.definition).map((schemaAttribute:[string,JzodElement]) => {
                  const currentAttributeDefinition = elementJzodSchema.definition[attribute[0]];
                  // {/* <ListItem disableGutters key={props.name+'_'+schemaAttribute[0]+'jzod'}>
                  //   schema: {JSON.stringify(currentAttributeDefinition)}
                  // </ListItem> */}
                  return (
                    <div key={props.listKey+'.'+attribute[0]} style={{ marginLeft:`calc((${usedIndentLevel} + 1)*(${indentShift}))`}}>
                      {/* <span>{props.listKey+'.'+attribute[0]}</span> */}
                      <JzodElementEditor
                        name={attribute[0]}
                        listKey={props.listKey+'.'+attribute[0]}
                        currentEnumJzodSchemaResolver={props.currentEnumJzodSchemaResolver}
                        indentLevel={usedIndentLevel}
                        innerProps={{
                          label:currentAttributeDefinition?.extra?.defaultLabel,
                          initialValuesObject:props.innerProps.initialValuesObject?props.innerProps.initialValuesObject[attribute[0]]:undefined,
                          showButton:true,
                          currentDeploymentUuid:props.innerProps.currentDeploymentUuid,
                          currentApplicationSection:props.innerProps.currentApplicationSection,
                          elementJzodSchema:currentAttributeDefinition,
                          rootJzodSchema:props.innerProps.rootJzodSchema,
                          onSubmit:(data:any,event:any)=>{console.log("onSubmit called", data, event)},
                        }}
                        register={props.register}
                        errors={props.errors}
                        formState={props.formState}
                        setValue={props.setValue}
                      />
                    </div>
                  );
                }
              )
            }
          </div>
          {'\}'}
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
              {...props.register(props.listKey, {required:true})}
              options={props.discriminants[props.name].map(v=>({label:v,value:v}))} 
              name={props.name}
              // value={props.formState.defaultValues?props.formState.defaultValues[props.listKey]:{label:props.name,value:'no value found!'}}
              value={props.innerProps.initialValuesObject?{label:props.innerProps.initialValuesObject,value:props.innerProps.initialValuesObject}:{label:props.name,value:'no value found!'}}
              defaultValue={props.innerProps.initialValuesObject?{label:props.innerProps.initialValuesObject,value:props.innerProps.initialValuesObject}:{label:props.name,value:'no value found!'}}
              // onChange={(e)=>{console.log("onChange!",e);props.setValue(label,e?.value)}}
              onChange={(e)=>{console.log("JzodElementEditor boolean onChange! defaultValues",props.formState.defaultValues,e);props.setValue(props.listKey,e?.value);}}
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
                onChange={(e)=>{console.log("JzodElementEditor onChange!",props.name,e.target.value);props.setValue(props.name,e.target.value)}}
                defaultValue={props.innerProps.initialValuesObject}
              /> */}
          </>
        );
      }
    break;
    }
    case "enum": {
      console.log("JzodElementEditor enum! value",props.innerProps.initialValuesObject,"schema",elementJzodSchema);
      return (
        <span>
          {displayedLabel}:{" "}<Select 
            {...props.register(props.listKey, {required:true})}
            options={elementJzodSchema.definition.map(v=>({label:v,value:v}))}
            name={props.name}
            value={{label:props.innerProps.initialValuesObject,value:props.innerProps.initialValuesObject}}
            defaultValue={{label:props.innerProps.initialValuesObject,value:props.innerProps.initialValuesObject}}
            // onChange={(e)=>{console.log("JzodElementEditor boolean onChange! defaultValues",props.formState.defaultValues,e);props.setValue(props.listKey,e?.value);}}
            onChange={(event,value) => {console.log("JzodElementEditor onChange",event,value);props.setValue(props.listKey,value)}}
          />
        </span>
      );
    break;
    }
    case "simpleType": {
      switch (elementJzodSchema.definition) {
        case "string":{
          // if (elementJzodSchema.extra?.targetEntity) {
          //   return (
          //     // <ListItem disableGutters key={label}>
          //     <>
          //       {/* {props.listKey} - {label}:{" "} */}
          //       {displayedLabel}:{" "}
          //       {/* <p>defaultValue:{JSON.stringify({label:props.name,value:props.innerProps.initialValuesObject})}</p> */}
          //       {/* <p>{JSON.stringify(props.errors[label]?.message?`received error: ${props.errors[label]?.message}`:"no error")}</p> */}
          //       <Select 
          //         {...props.register(props.listKey, {required:true})}
          //         options={selectList.map(e=>({label:e.name,value:e.uuid}))} 
          //         name={props.name}
          //         value={props.formState.defaultValues?{label:props.name,value:props.formState.defaultValues[props.listKey]}:{label:props.name,value:'no value found!'}}
          //         defaultValue={props.formState.defaultValues?{label:props.name,value:props.formState.defaultValues[props.listKey]}:{label:props.name,value:'no value found!'}}
          //         // onChange={(e)=>{console.log("onChange!",e);props.setValue(label,e?.value)}}
          //         onChange={(e)=>{console.log("JzodElementEditor onChange!",e);props.setValue(props.listKey,e?.value);}}
          //       />
          //     </>
          //     // </ListItem>
          //   );
          // } else {
            // const defaultValue=props.formState.defaultValues?props.formState.defaultValues[props.name]:'no value found!'
            const defaultValue=props.formState.defaultValues
            return (
              <>
                  {/* {props.listKey} - {label}:{" "} */}
                  {displayedLabel}:{" "}
                  <input
                    {...props.register(props.listKey, {required:true})}
                    form={"form." + props.name}
                    name={props.name}
                    onChange={(e)=>{console.log("JzodElementEditor onChange!",props.name,e.target.value);props.setValue(props.listKey,e.target.value)}}
                    defaultValue={props.innerProps.initialValuesObject}
                  />
              </>
            );
          // }
          break;
        }
        case "boolean":{
          // const defaultValue=props.formState.defaultValues?props.formState.defaultValues[props.name]:'no value found!'
          console.log("JzodElementEditor boolean!",props.listKey,"formState",props.formState)
          return (
                // TODO: replace by checkbox!
            <>
                {displayedLabel}:{" "} 
                <Select 
                  {...props.register(props.listKey, {required:true})}
                  options={[{label:'true', value:true},{label:'false', value:false}]} 
                  name={props.name}
                  // value={props.formState.defaultValues?props.formState.defaultValues[props.listKey]:{label:props.name,value:'no value found!'}}
                  value={props.innerProps.initialValuesObject?{label:props.innerProps.initialValuesObject?"true":"false",value:props.innerProps.initialValuesObject}:{label:props.name,value:'no value found!'}}
                  defaultValue={props.innerProps.initialValuesObject?{label:props.innerProps.initialValuesObject?"true":"false",value:props.innerProps.initialValuesObject}:{label:props.name,value:'no value found!'}}
                  // onChange={(e)=>{console.log("onChange!",e);props.setValue(label,e?.value)}}
                  onChange={(e)=>{console.log("JzodElementEditor boolean onChange! defaultValues",props.formState.defaultValues,e);props.setValue(props.listKey,e?.value);}}
                />
            </>
          );
          break;
        }
        case "number": {
          const defaultValue:number | undefined=props.innerProps.initialValuesObject?(props.innerProps.initialValuesObject as any as number):undefined;
          console.log("JzodElementEditor number!",props.listKey,"props.innerProps.initialValuesObject",props.innerProps.initialValuesObject)
          return (
            <>
                {/* {props.listKey} - {label}:{" "} */}
              {displayedLabel}:{" "}
              <input
                {...props.register(props.listKey, {required:true})}
                form={"form." + props.name}
                name={props.name}
                onChange={(e)=>{console.log("JzodElementEditor onChange!",props.name,e.target.value);props.setValue(props.listKey,e.target.value)}}
                defaultValue={defaultValue}
              />
            </>
          );
          break;
        }
        case "any":
        case "uuid":
        default: {
          const defaultValue=props.formState.defaultValues?props.formState.defaultValues[props.name]:'no value found!'
          return (
            <>
                {/* {props.listKey} - {label}:{" "} */}
                {displayedLabel}:{" "}
                <input
                  {...props.register(props.listKey, {required:true})}
                  form={"form." + props.name}
                  name={props.name}
                  onChange={(e)=>{console.log("JzodElementEditor onChange!",props.name,e.target.value);props.setValue(props.listKey,e.target.value)}}
                  defaultValue={defaultValue}
                />
            </>
          );
        // throw new Error("JzodElementEditor could not handle jzodSchema type:",elementJzodSchema?.type,elementJzodSchema.definition);
          break;
        }
      }
    }
    default:{
      // if (elementJzodSchema.type=="simpleType" && elementJzodSchema.definition == "string" && elementJzodSchema.extra?.targetEntity) {
      //   return (
      //     // <ListItem disableGutters key={label}>
      //     <>
      //       {/* {props.listKey} - {label}:{" "} */}
      //       {label}:{" "}
      //       {/* <p>defaultValue:{JSON.stringify({label:props.name,value:props.innerProps.initialValuesObject})}</p> */}
      //       {/* <p>{JSON.stringify(props.errors[label]?.message?`received error: ${props.errors[label]?.message}`:"no error")}</p> */}
      //       <Select 
      //         {...props.register(props.listKey, {required:true})}
      //         options={selectList.map(e=>({label:e.name,value:e.uuid}))} 
      //         name={props.name}
      //         value={props.formState.defaultValues?{label:props.name,value:props.formState.defaultValues[props.listKey]}:{label:props.name,value:'no value found!'}}
      //         defaultValue={props.formState.defaultValues?{label:props.name,value:props.formState.defaultValues[props.listKey]}:{label:props.name,value:'no value found!'}}
      //         // onChange={(e)=>{console.log("onChange!",e);props.setValue(label,e?.value)}}
      //         onChange={(e)=>{console.log("JzodElementEditor onChange!",e);props.setValue(props.listKey,e?.value);}}
      //       />
      //     </>
      //     // </ListItem>
      //   );
      // } else {
        const defaultValue=props.formState.defaultValues?props.formState.defaultValues[props.name]:'no value found!'
        return (
          <>
              {/* {props.listKey} - {label}:{" "} */}
              {displayedLabel}:{" "}
              <input
                {...props.register(props.listKey, {required:true})}
                form={"form." + props.name}
                name={props.name}
                onChange={(e)=>{console.log("JzodElementEditor onChange!",props.name,e.target.value);props.setValue(props.listKey,e.target.value)}}
                defaultValue={defaultValue}
              />
          </>
        );
      // }
    }
    break;
  }
}


// // #####################################################################################################
// /**
//  * react hook form generator, takes jzodSchema as input, and produces react component as output
//  * @param props 
//  * @returns 
//  */
// // export const JzodElementFormEditor:FC<JzodElementFormEditorProps> = (props: JzodElementFormEditorProps) =>{
// export function JzodElementFormEditor(props: JzodElementFormEditorProps): JSX.Element {
//   const logHeader = "JsonElementEditorDialog " + (props.label ? props.label + " " : "");
//   const context = useMiroirContextService();

//   const currentMiroirModel = useCurrentModel(applicationDeploymentMiroir.uuid);


//   // const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
//   //   {
//   //     deploymentUuid: props.currentDeploymentUuid,
//   //     applicationSection: props.currentApplicationSection,
//   //     entityUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
//   //   }
//   // );

//   // const selectList: EntityInstanceWithName[] = useMemo(
//   //   () => (instancesToDisplayUuidIndex ? Object.values(instancesToDisplayUuidIndex) : []) as EntityInstanceWithName[],
//   //   [instancesToDisplayUuidIndex]
//   // );

//   // console.log("selectList",selectList);
  

//   // const [addObjectdialogFormIsOpen, setAddObjectdialogFormIsOpen] = useState(false);
//   const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
//   const [result, setResult] = useState(undefined);

//   console.log("zodSchemaResolver props.jzodSchema", props.elementJzodSchema);
//   const zodSchemaResolver = useMemo(()=>jzodElementSchemaToZodSchemaAndDescription(props.label,props.elementJzodSchema,()=>({})),[props.elementJzodSchema])
//   console.log("zodSchemaResolver zodSchemaResolver.description",zodSchemaResolver.description);

  
//   const { register, handleSubmit, reset, trigger, watch, setValue, getValues, formState } =
//     useForm<JzodObjectFormEditorInputs>({
//       defaultValues: props.initialValuesObject,
//       resolver: zodResolver(z.object({[props.label]:zodSchemaResolver.zodSchema}))
//     });
//   const { errors } = formState;

//   console.log(
//     logHeader,
//     "called with props",
//     props,
//     "formState",
//     formState.isDirty,
//     formState.isLoading,
//     formState.isSubmitSuccessful,
//     formState.isSubmitted,
//     formState.isSubmitting,
//     formState.isValid,
//     formState.isValidating,
//     "getValues()",
//     getValues(),
//     "result", result,
//     "error", errors[props.label]?.message,
//   );

//   // const formIsOpen = addObjectdialogFormIsOpen || (!props.showButton && props.isOpen);

//   const handleAddObjectDialogFormButtonClick = (label: string, a: any) => {
//     console.log(
//       logHeader,
//       "handleAddObjectDialogFormOpen",
//       label,
//       "called, props.formObject",
//       props.initialValuesObject,
//       "passed value",
//       a
//     );

//     // setAddObjectdialogFormIsOpen(true);
//     reset(props.initialValuesObject);
//     setdialogOuterFormObject(a);
//   };

//   const handleAddObjectDialogFormSubmit: SubmitHandler<JzodObjectFormEditorInputs> = async (data, event) => {
//     const result = props.onSubmit(data, event,errors[props.label]?.message);
//     // const buttonType: string = (event?.nativeEvent as any)["submitter"]["name"];
//     console.log(
//       logHeader,
//       "handleAddObjectDialogFormSubmit",
//       "props",
//       props,
//       "passed value",
//       data,
//       "error",
//       errors[props.label]?.message
//     );

//     setResult(data as any);
//     // return result;
//     return Promise.resolve();
//   };

//   // if (dialogFormIsOpen && getValues()['uuid'] != props.formObject['uuid']) {
//   if (getValues()["uuid"] != props.initialValuesObject["uuid"]) {
//     console.log(logHeader, "reset form!");
//     reset(props.initialValuesObject);
//   }


//   return (
//     <div className="JzodObjectFormEditor">
//       <span>
//         {props.showButton ? (
//           <h3>
//             {props.label}
//             <Button
//               variant="outlined"
//               onClick={() => handleAddObjectDialogFormButtonClick(props?.label, props?.initialValuesObject)}
//             >
//               <AddBoxIcon />
//             </Button>
//           </h3>
//         ) : (
//           <div></div>
//         )}
//       </span>
//       <form
//         id={"form." + props.label}
//         onSubmit={handleSubmit(handleAddObjectDialogFormSubmit)}
//         style={{ display: "inline-flex" }}
//       >
//         <Grid sx={{ display: "inline-flex", flexDirection: "column" }}>
//           <Item>formObject: {JSON.stringify(props.initialValuesObject)}</Item>
//           <Item>
//             {/* <List sx={{ pt: 0 }}> */}
//               <JzodElementEditor
//                 name={props.label}
//                 listKey={props.label}
//                 currentEnumJzodSchemaResolver={currentEnumJzodSchemaResolver}
//                 innerProps={props}
//                 register={register}
//                 errors={errors}
//                 formState={formState}
//                 setValue={setValue}
//               />
//             {/* </List> */}
//           </Item>
//         </Grid>
//         {/* errors will return when field validation fails  */}
//         {errors.exampleRequired && <span>This field is required</span>}
//         <input type="submit" id={props.label} name={props.label} form={"form." + props.label} />
//       </form>
//     </div>
//   );
// }
