import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { FieldErrors, FormState, SubmitHandler, UseFormRegister, UseFormSetValue, useForm } from "react-hook-form";
import Select from 'react-select';
import { z } from "zod";

import AddBoxIcon from "@mui/icons-material/AddBox";
import { Button, List, ListItem, Paper, styled } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";

import { JzodArray, JzodElement, JzodObject, jzodElementSchemaToZodSchemaAndDescription } from "@miroir-framework/jzod";
import { ApplicationSection, EntityAttribute, EntityInstanceWithName, EntityInstancesUuidIndex, Uuid } from "miroir-core";
import { useMiroirContextInnerFormOutput, useMiroirContextService } from "./MiroirContextReactProvider";
import { ReportSectionDisplay } from "./ReportSectionDisplay";
import { getColumnDefinitionsFromEntityDefinitionJzodSchema } from "./getColumnDefinitionsFromEntityAttributes";
import { useEntityInstanceUuidIndexFromLocalCache } from "./ReduxHooks";


// #####################################################################################################
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "left",
  display: "flex",
  maxHeight: "50vh",
  // height: '80vh',
  color: theme.palette.text.secondary,
}));


// #####################################################################################################
export type JzodObjectFormEditorInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

export interface JzodElementFormEditorCoreProps {
  label: string;
  jzodSchema: JzodElement;
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
  innerProps: JzodElementFormEditorProps,
  register: UseFormRegister<any>,
  errors: FieldErrors<any>,
  formState: FormState<any>,
  setValue: UseFormSetValue<any>,
}

// #####################################################################################################
export const JzodElementEditor = (
  props: JzodElementEditorProps
): JSX.Element => {
  const {label, jzodSchema, initialValuesObject} = props.innerProps;
  // const [selectedOption, setSelectedOption] = useState({label:props.name,value:props.innerProps.initialValuesObject});

  // console.log("JzodElementEditor",props);
  
  const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache({
    deploymentUuid: props.innerProps.currentDeploymentUuid,
    applicationSection: props.innerProps.currentApplicationSection,
    entityUuid:
      jzodSchema.type == "simpleType" && jzodSchema.definition == "string" && jzodSchema.extra?.targetEntity
        ? jzodSchema.extra?.targetEntity
        : "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  });

  const selectList: EntityInstanceWithName[] = useMemo(
    () => (instancesToDisplayUuidIndex ? Object.values(instancesToDisplayUuidIndex) : []) as EntityInstanceWithName[],
    [instancesToDisplayUuidIndex]
  );

  // console.log("JzodElementEditor selectList",selectList);
  

  switch (jzodSchema?.type) {
    case "array":{
      const columnDefs: any[] = getColumnDefinitionsFromEntityDefinitionJzodSchema(
        ((jzodSchema as JzodArray).definition
          ? (jzodSchema as JzodArray).definition
          : {}) as JzodObject
      );

      return (
        // <ListItem disableGutters key={props.name}>
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
        // </ListItem>
      );
      break;
    }
    case "object": {
      // no break
      return (
        <Grid sx={{ display: "inline-flex", flexDirection: "column" }}>
        <Item>JzodElementFormEditor</Item>
        <Item>formObject: {JSON.stringify(props.innerProps.initialValuesObject)}</Item>
        <Item>json object form jzod schema: {JSON.stringify(props.innerProps.jzodSchema)}</Item>
        <Item>
          <List sx={{ pt: 0 }}>
            {
              // Object.entries(props?.jzodSchema.definition).length > 0? 
              Object.entries(jzodSchema.definition).map((schemaAttribute:[string,JzodElement]) => {
                const currentAttributeDefinition = schemaAttribute[1];
                return (
                  <ListItem disableGutters key={schemaAttribute[0]}>
                    <JzodElementEditor
                      name={schemaAttribute[0]}
                      innerProps={{
                        label:currentAttributeDefinition.extra?.defaultLabel,
                        initialValuesObject:props.innerProps.initialValuesObject[schemaAttribute[0]],
                        showButton:true,
                        currentDeploymentUuid:props.innerProps.currentDeploymentUuid,
                        currentApplicationSection:props.innerProps.currentApplicationSection,
                        jzodSchema:currentAttributeDefinition,
                        onSubmit:(data:any,event:any)=>{console.log("onSubmit called", data, event)},
                      }}
                      register={props.register}
                      errors={props.errors}
                      formState={props.formState}
                      setValue={props.setValue}
                    />
                  </ListItem>
                );
              })
            }
          </List>
        </Item>
      </Grid>
      )
    }
    default:{
      if (jzodSchema.type=="simpleType" && jzodSchema.definition == "string" && jzodSchema.extra?.targetEntity) {
        return (
          // <ListItem disableGutters key={label}>
          <>
            {props.name}-{label}:{" "}
            {/* <p>defaultValue:{JSON.stringify({label:props.name,value:props.innerProps.initialValuesObject})}</p> */}
            {/* <p>{JSON.stringify(props.errors[label]?.message?`received error: ${props.errors[label]?.message}`:"no error")}</p> */}
            <Select 
              {...props.register(props.name, {required:true})}
              options={selectList.map(e=>({label:e.name,value:e.uuid}))} 
              name={props.name}
              value={props.formState.defaultValues?{label:props.name,value:props.formState.defaultValues[props.name]}:{label:props.name,value:'no value found!'}}
              defaultValue={props.formState.defaultValues?{label:props.name,value:props.formState.defaultValues[props.name]}:{label:props.name,value:'no value found!'}}
              // onChange={(e)=>{console.log("onChange!",e);props.setValue(label,e?.value)}}
              onChange={(e)=>{console.log("JzodElementEditor onChange!",e);props.setValue(props.name,e?.value);}}
            />
          </>
          // </ListItem>
        );
      } else {
        const defaultValue=props.formState.defaultValues?props.formState.defaultValues[props.name]:'no value found!'
        return (
          <>
            {/* <ListItem>
              name: {props.name}, default value:{defaultValue}
            </ListItem> */}
            {/* <ListItem disableGutters key={label}> */}
              {props.name}-{label}:{" "}
              {/* {errors.name?.message && <p>{JSON.stringify(errors)}</p>} */}
              <p>
                {/* isValid:{JSON.stringify(props.formState.isValid)} */}
                {/* val:{props.innerProps.initialValuesObject} */}
                {/* schema:{JSON.stringify(jzodSchema)} */}
                {/* name: {props.name} */}
              </p>
              {/* <p>{JSON.stringify(props.errors[label]?.message?`received error: ${props.errors[label]?.message}`:"no error")}</p> */}
              <input
                {...props.register(props.name, {required:true})}
                form={"form." + props.name}
                name={props.name}
                onChange={(e)=>{console.log("JzodElementEditor onChange!",props.name,e.target.value);props.setValue(props.name,e.target.value)}}
                defaultValue={defaultValue}
                // defaultValue={props.innerProps.initialValuesObject[label]}
                // onClick={(e)=>{console.log("onClick!");}}
              />
            {/* </ListItem> */}
          </>
        );
      }
    }
    break;
  }
}


// #####################################################################################################
/**
 * react hook form generator, takes jzodSchema as input, and produces react component as output
 * @param props 
 * @returns 
 */
// export const JzodElementFormEditor:FC<JzodElementFormEditorProps> = (props: JzodElementFormEditorProps) =>{
export function JzodElementFormEditor(props: JzodElementFormEditorProps): JSX.Element {
  const logHeader = "JsonElementEditorDialog " + (props.label ? props.label + " " : "");
  const context = useMiroirContextService();

  // const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
  //   {
  //     deploymentUuid: props.currentDeploymentUuid,
  //     applicationSection: props.currentApplicationSection,
  //     entityUuid: "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  //   }
  // );

  // const selectList: EntityInstanceWithName[] = useMemo(
  //   () => (instancesToDisplayUuidIndex ? Object.values(instancesToDisplayUuidIndex) : []) as EntityInstanceWithName[],
  //   [instancesToDisplayUuidIndex]
  // );

  // console.log("selectList",selectList);
  

  // const [addObjectdialogFormIsOpen, setAddObjectdialogFormIsOpen] = useState(false);
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
  const [result, setResult] = useState(undefined);

  console.log("zodSchemaResolver props.jzodSchema", props.jzodSchema);
  const zodSchemaResolver = useMemo(()=>jzodElementSchemaToZodSchemaAndDescription(props.label,props.jzodSchema,()=>({})),[props.jzodSchema])
  console.log("zodSchemaResolver zodSchemaResolver.description",zodSchemaResolver.description);

  
  const { register, handleSubmit, reset, trigger, watch, setValue, getValues, formState } =
    useForm<JzodObjectFormEditorInputs>({
      defaultValues: props.initialValuesObject,
      resolver: zodResolver(z.object({[props.label]:zodSchemaResolver.zodSchema}))
    });
  const { errors } = formState;

  console.log(
    logHeader,
    "called with props",
    props,
    "formState",
    formState.isDirty,
    formState.isLoading,
    formState.isSubmitSuccessful,
    formState.isSubmitted,
    formState.isSubmitting,
    formState.isValid,
    formState.isValidating,
    "getValues()",
    getValues(),
    "result", result,
    "error", errors[props.label]?.message,
  );

  // const formIsOpen = addObjectdialogFormIsOpen || (!props.showButton && props.isOpen);

  const handleAddObjectDialogFormButtonClick = (label: string, a: any) => {
    console.log(
      logHeader,
      "handleAddObjectDialogFormOpen",
      label,
      "called, props.formObject",
      props.initialValuesObject,
      "passed value",
      a
    );

    // setAddObjectdialogFormIsOpen(true);
    reset(props.initialValuesObject);
    setdialogOuterFormObject(a);
  };

  const handleAddObjectDialogFormSubmit: SubmitHandler<JzodObjectFormEditorInputs> = async (data, event) => {
    const result = props.onSubmit(data, event,errors[props.label]?.message);
    // const buttonType: string = (event?.nativeEvent as any)["submitter"]["name"];
    console.log(
      logHeader,
      "handleAddObjectDialogFormSubmit",
      "props",
      props,
      "passed value",
      data,
      "error",
      errors[props.label]?.message
    );

    setResult(data as any);
    // return result;
    return Promise.resolve();
  };

  // if (dialogFormIsOpen && getValues()['uuid'] != props.formObject['uuid']) {
  if (getValues()["uuid"] != props.initialValuesObject["uuid"]) {
    console.log(logHeader, "reset form!");
    reset(props.initialValuesObject);
  }


  return (
    <div className="JzodObjectFormEditor">
      <span>
        {props.showButton ? (
          <h3>
            {props.label}
            <Button
              variant="outlined"
              onClick={() => handleAddObjectDialogFormButtonClick(props?.label, props?.initialValuesObject)}
            >
              <AddBoxIcon />
            </Button>
          </h3>
        ) : (
          <div></div>
        )}
      </span>
      <form
        id={"form." + props.label}
        onSubmit={handleSubmit(handleAddObjectDialogFormSubmit)}
        style={{ display: "inline-flex" }}
      >
        <Grid sx={{ display: "inline-flex", flexDirection: "column" }}>
          <Item>formObject: {JSON.stringify(props.initialValuesObject)}</Item>
          <Item>
            <List sx={{ pt: 0 }}>
              <JzodElementEditor
                name={props.label}
                innerProps={props}
                register={register}
                errors={errors}
                formState={formState}
                setValue={setValue}
              />
            </List>
          </Item>
        </Grid>
        {/* errors will return when field validation fails  */}
        {errors.exampleRequired && <span>This field is required</span>}
        <input type="submit" id={props.label} name={props.label} form={"form." + props.label} />
      </form>
    </div>
  );
}
