import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { FieldErrors, FormState, SubmitHandler, UseFormRegister, UseFormSetValue, useForm } from "react-hook-form";
import Select from 'react-select';
import { z } from "zod";

import AddBoxIcon from "@mui/icons-material/AddBox";
import { Button, List, ListItem, Paper, styled } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";

import { JzodArray, JzodElement, JzodObject, jzodElementSchemaToZodSchemaAndDescription } from "@miroir-framework/jzod";
import { EntityAttribute, EntityInstanceWithName } from "miroir-core";
import { useMiroirContextInnerFormOutput, useMiroirContextService } from "./MiroirContextReactProvider";
import { ReportSectionDisplay } from "./ReportSectionDisplay";
import { getColumnDefinitionsFromEntityDefinitionJzodSchema } from "./getColumnDefinitionsFromEntityAttributes";


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
  // currentDeploymentUuid: Uuid | undefined;
  // currentApplicationSection: ApplicationSection;
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


// #####################################################################################################
export const InnerElementEditor = (
  props: JzodElementFormEditorProps,
  selectList:EntityInstanceWithName[],
  register: UseFormRegister<any>,
  errors: FieldErrors<any>,
  formState: FormState<any>,
  setValue: UseFormSetValue<any>,
): JSX.Element => {
  const {label, jzodSchema, initialValuesObject} = props;
  switch (jzodSchema?.type) {
    case "array":{
      const columnDefs: any[] = getColumnDefinitionsFromEntityDefinitionJzodSchema(
        ((jzodSchema as JzodArray).definition
          ? (jzodSchema as JzodArray).definition
          : {}) as JzodObject
      );

      return (
        <ListItem disableGutters key={props.label}>
          <span>
            <ReportSectionDisplay
              tableComponentReportType="JSON_ARRAY"
              label={"JSON_ARRAY-" + label}
              columnDefs={columnDefs}
              rowData={initialValuesObject[label]}
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
      if (jzodSchema.type=="simpleType" && jzodSchema.definition == "uuid" && jzodSchema.extra?.targetEntity) {
        return (
          <ListItem disableGutters key={label}>
            {label}:{" "}
            <p>{JSON.stringify(errors[label]?.message?`received error: ${errors[label]?.message}`:"no error")}</p>
            <Select options={selectList.map(e=>({value:e.uuid, label:e.name}))} />
          </ListItem>
        );
      } else {
        return (
          <ListItem disableGutters key={label}>
            {label}:{" "}
            {/* {errors.name?.message && <p>{JSON.stringify(errors)}</p>} */}
            <p>
              isValid:{JSON.stringify(formState.isValid)}
            </p>
            <p>{JSON.stringify(errors[label]?.message?`received error: ${errors[label]?.message}`:"no error")}</p>
            <input
              form={"form." + label}
              {...register(label, {required:true})}
              defaultValue={props.initialValuesObject[label]}
              name={label}
              // onClick={(e)=>{console.log("onClick!");}}
              onChange={(e)=>{console.log("onChange!");setValue(label,e.target.value)}}
            />
          </ListItem>
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

  // const selectList:EntityInstanceWithName[] = useLocalCacheInstancesForEntityTOREFACTOR(
  //   props.currentDeploymentUuid,
  //   props.currentApplicationSection,
  //   "d7a144ff-d1b9-4135-800c-a7cfc1f38733",
  // ) as EntityInstanceWithName[];

  const selectList:EntityInstanceWithName[] = []
  // useLocalCacheInstancesForJzodAttribute(
  //   props.currentDeploymentUuid,
  //   props.currentApplicationSection,
  //   props.jzodSchema as JzodAttribute
  // ) as EntityInstanceWithName[];

  console.log("selectList",selectList);
  

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
              {
                InnerElementEditor(props, selectList, register, errors, formState, setValue)
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
