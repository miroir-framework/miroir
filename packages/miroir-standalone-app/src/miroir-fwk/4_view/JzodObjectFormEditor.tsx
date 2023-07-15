import AddBoxIcon from "@mui/icons-material/AddBox";
import { Button, Dialog, DialogTitle, List, ListItem, Paper, styled } from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";

import { EntityAttribute, EntityDefinitionEntityDefinitionAttributeNew } from "miroir-core";
import { SubmitHandler, useForm } from "react-hook-form";
import { ReportSectionDisplay } from "./ReportSectionDisplay";
import { useState } from "react";
import { useMiroirContextInnerFormOutput } from "./MiroirContextReactProvider";
import { JzodArray, JzodElement, JzodObject } from "@miroir-framework/jzod";
import { getColumnDefinitionsFromEntityDefinitionJzodSchema } from "./getColumnDefinitionsFromEntityAttributes";

export type JzodObjectFormEditorInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

export interface JzodObjectFormEditorCoreProps {
  label: string;
  // isAttributes?: boolean;
  jzodSchema: JzodObject;
  initialValuesObject: any;
  onSubmit: SubmitHandler<JzodObjectFormEditorInputs>;
}

export interface JzodObjectFormEditorWithButtonProps extends JzodObjectFormEditorCoreProps {
  showButton: true;
}

export interface JzodObjectFormEditorWithoutButtonProps extends JzodObjectFormEditorCoreProps {
  showButton: false;
  // isOpen: boolean;
  // onClose: (a?: any) => void;
}

export type JzodObjectFormEditorProps =
  | JzodObjectFormEditorWithButtonProps
  | JzodObjectFormEditorWithoutButtonProps;

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
export function JzodObjectFormEditor(props: JzodObjectFormEditorProps) {
  const logHeader = "JsonObjectEditorDialog " + (props.label ? props.label + " " : "");
  // const [addObjectdialogFormIsOpen, setAddObjectdialogFormIsOpen] = useState(false);
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
  const [result, setResult] = useState(undefined);

  const { register, handleSubmit, reset, trigger, watch, setValue, getValues, formState } =
    useForm<JzodObjectFormEditorInputs>({ defaultValues: props.initialValuesObject });
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
    "result", result
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

  // const handleAddObjectDialogFormClose = (value: string) => {
  //   console.log(logHeader, "handleAddObjectDialogFormClose", value);

  //   // setAddObjectdialogFormIsOpen(false);
  //   // if (!props.showButton) {
  //   //   props.onClose();
  //   // }
  // };

  const handleAddObjectDialogFormSubmit: SubmitHandler<JzodObjectFormEditorInputs> = async (data, event) => {
    const result = props.onSubmit(data, event);
    // const buttonType: string = (event?.nativeEvent as any)["submitter"]["name"];
    console.log(
      logHeader,
      "handleAddObjectDialogFormSubmit",
      "props",
      props,
      "passed value",
      data
    );

    setResult(data as any);
    // if (buttonType == props.label) {
    //   handleAddObjectDialogFormClose("");
    // } else {
    //   console.warn(
    //     logHeader,
    //     "handleAddObjectDialogFormSubmit nog closing dialog form",
    //     props.label,
    //     "buttonType",
    //     buttonType
    //   );
    // }
    return result;
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
        {/* register your input into the hook by invoking the "register" function */}
        {/* <input defaultValue="test" {...register("example")} /> */}
        {/* include validation with required or other standard HTML validation rules */}
        {/* <input {...register("exampleRequired", { required: true })} /> */}
        <Grid sx={{ display: "inline-flex", flexDirection: "column" }}>
          <Item>formObject: {JSON.stringify(props.initialValuesObject)}</Item>
          <Item>
            <List sx={{ pt: 0 }}>
              {
                // Object.entries(props?.jzodSchema.definition).length > 0? 
                Object.entries(props?.jzodSchema.definition).map((schemaAttribute:[string,JzodElement]) => {
                  const currentAttributeDefinition = schemaAttribute[1];
                  switch (currentAttributeDefinition.type) {
                    case "array":{
                      const columnDefs: any[] = getColumnDefinitionsFromEntityDefinitionJzodSchema(
                        ((currentAttributeDefinition as JzodArray).definition
                          ? (currentAttributeDefinition as JzodArray).definition
                          : {}) as JzodObject
                      );

                      return (
                        <ListItem disableGutters key={schemaAttribute[0]}>
                          <span>
                            <ReportSectionDisplay
                              tableComponentReportType="JSON_ARRAY"
                              label={"JSON_ARRAY-" + currentAttributeDefinition.extra?.defaultLabel}
                              columnDefs={columnDefs}
                              rowData={props?.initialValuesObject[schemaAttribute[0]]}
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
                      return (
                        <ListItem disableGutters key={schemaAttribute[0]}>
                          {currentAttributeDefinition?.extra?.defaultLabel}:{" "}
                          <input
                            form={"form." + props.label}
                            {...register(schemaAttribute[0])}
                            defaultValue={props.initialValuesObject[schemaAttribute[0]]}
                            name={props.label}
                            onClick={(e)=>{console.log("onClick!",e);}}
                            // onFocus={()=>{console.log("onFocus!");}}
                            onChange={(e)=>{console.log("onChange!",e);setValue(schemaAttribute[0],e.target.value)}}
                          />
                        </ListItem>
                      );
                    }
                    break;
                  }
                })
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
