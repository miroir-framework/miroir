import { z } from "zod";
import { ElementRef, FC, useMemo, useState } from "react";
import Select from 'react-select'
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button, Dialog, DialogTitle, List, ListItem, Paper, styled } from "@mui/material";
import AddBoxIcon from "@mui/icons-material/AddBox";
import Grid from "@mui/material/Unstable_Grid2";

import { EntityAttribute, EntityDefinitionEntityDefinitionAttributeNew } from "miroir-core";
import { ReportSectionDisplay } from "./ReportSectionDisplay";
import { useMiroirContextInnerFormOutput } from "./MiroirContextReactProvider";
import { JzodArray, JzodElement, JzodObject, jzodElementSchemaToZodSchemaAndDescription } from "@miroir-framework/jzod";
import { getColumnDefinitionsFromEntityDefinitionJzodSchema } from "./getColumnDefinitionsFromEntityAttributes";

export type JzodObjectFormEditorInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

export interface JzodElementFormEditorCoreProps {
  label: string;
  jzodSchema: JzodElement;
  getData:(jzodSchema:JzodElement) => any;
  initialValuesObject: any;
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
/**
 * react hook form generator, takes jzodSchema as input, and produces react component as output
 * @param props 
 * @returns 
 */
// export const JzodElementFormEditor:FC<JzodElementFormEditorProps> = (props: JzodElementFormEditorProps) =>{
export function JzodElementFormEditor(props: JzodElementFormEditorProps) {
  const logHeader = "JsonElementEditorDialog " + (props.label ? props.label + " " : "");
  // const [addObjectdialogFormIsOpen, setAddObjectdialogFormIsOpen] = useState(false);
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
  const [result, setResult] = useState(undefined);

  console.log("zodSchemaResolver props.jzodSchema", props.jzodSchema);
  const zodSchemaResolver = useMemo(()=>jzodElementSchemaToZodSchemaAndDescription(props.label,props.jzodSchema,()=>({})),[props.jzodSchema])
  console.log("zodSchemaResolver zodSchemaResolver.description",zodSchemaResolver.description);

  
  const { register, handleSubmit, reset, trigger, watch, setValue, getValues, formState } =
    // useForm<JzodObjectFormEditorInputs>({ 
    useForm<any>({ 
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

  const getCurrentElementEditor = (): JSX.Element => {
    switch (props?.jzodSchema.type) {
      case "array":{
        const columnDefs: any[] = getColumnDefinitionsFromEntityDefinitionJzodSchema(
          ((props?.jzodSchema as JzodArray).definition
            ? (props?.jzodSchema as JzodArray).definition
            : {}) as JzodObject
        );

        return (
          <ListItem disableGutters key={props.label}>
            <span>
              <ReportSectionDisplay
                tableComponentReportType="JSON_ARRAY"
                label={"JSON_ARRAY-" + props.label}
                columnDefs={columnDefs}
                rowData={props?.initialValuesObject[props.label]}
                styles={{
                  width: "50vw",
                  height: "22vw",
                }}
              ></ReportSectionDisplay>
            </span>
          </ListItem>
        );
        break;
      }
      case "object": {
        // no break
      }
      default:{
        if (props.jzodSchema.type=="simpleType" && props.jzodSchema.definition == "uuid" && props.jzodSchema.extra?.targetEntity) {
          return (
            <ListItem disableGutters key={props.label}>
              {props.label}:{" "}
              <p>{JSON.stringify(errors[props.label]?.message?`received error: ${errors[props.label]?.message}`:"no error")}</p>
              <Select options={props.getData(props.jzodSchema)} />
            </ListItem>
          );
        } else {
          return (
            <ListItem disableGutters key={props.label}>
              {props.label}:{" "}
              {/* {errors.name?.message && <p>{JSON.stringify(errors)}</p>} */}
              <p>
                isValid:{JSON.stringify(formState.isValid)}
              </p>
              <p>{JSON.stringify(errors[props.label]?.message?`received error: ${errors[props.label]?.message}`:"no error")}</p>
              <input
                form={"form." + props.label}
                {...register(props.label, {required:true})}
                defaultValue={props.initialValuesObject[props.label]}
                name={props.label}
                // onClick={(e)=>{console.log("onClick!");}}
                onChange={(e)=>{console.log("onChange!");setValue(props.label,e.target.value)}}
              />
            </ListItem>
          );
        }
      }
      break;
    }
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
              {
                getCurrentElementEditor()
                // Object.entries(props?.jzodSchema.definition).length > 0? 
                // Object.entries(props?.jzodSchema.definition).map((schemaAttribute:[string,JzodElement]) => {
                  // const currentAttributeDefinition = schemaAttribute[1];
                // })
              }
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
