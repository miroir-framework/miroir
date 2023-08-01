import AddBoxIcon from "@mui/icons-material/AddBox";
import { Button, Dialog, DialogTitle, Paper, styled } from "@mui/material";

import { JzodObject } from "@miroir-framework/jzod";
import { ApplicationSection, EntityAttribute, Uuid } from "miroir-core";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { JzodElementEditor } from "./JzodElementFormEditor";
import { useMiroirContextInnerFormOutput } from "./MiroirContextReactProvider";

export type JsonObjectFormEditorDialogInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

export interface JsonObjectFormEditorCoreDialogProps {
  label: string;
  isAttributes?: boolean;
  jzodSchema: JzodObject;
  initialValuesObject: any;
  currentDeploymentUuid?: Uuid;
  currentApplicationSection?: ApplicationSection;
  onSubmit: SubmitHandler<JsonObjectFormEditorDialogInputs>;
}

export interface JsonObjectFormEditorWithButtonDialogProps extends JsonObjectFormEditorCoreDialogProps {
  showButton: true;
}

export interface JsonObjectFormEditorDialogWithoutButtonProps extends JsonObjectFormEditorCoreDialogProps {
  showButton: false;
  isOpen: boolean;
  onClose: (a?: any,event?:any) => void;
  // onClose: z.function().args(z.any()).returns(z.void()),
}

export type JsonObjectFormEditorDialogProps =
  | JsonObjectFormEditorWithButtonDialogProps
  | JsonObjectFormEditorDialogWithoutButtonProps;

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
export function JsonObjectFormEditorDialog(props: JsonObjectFormEditorDialogProps) {
  const logHeader = "JsonObjectFormEditorDialog " + (props.label ? props.label + " " : "");
  const [addObjectdialogFormIsOpen, setAddObjectdialogFormIsOpen] = useState(false);
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();

  const { register, handleSubmit, reset, trigger, watch, setValue, getValues, formState } =
    useForm<JsonObjectFormEditorDialogInputs>({ defaultValues: props.initialValuesObject });
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
    getValues()
  );

  const formIsOpen = addObjectdialogFormIsOpen || (!props.showButton && props.isOpen);

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

    setAddObjectdialogFormIsOpen(true);
    reset(props.initialValuesObject);
    setdialogOuterFormObject(a);
  };

  const handleAddObjectDialogFormClose = (value: string) => {
    console.log(logHeader, "handleAddObjectDialogFormClose", value);

    setAddObjectdialogFormIsOpen(false);
    if (!props.showButton) {
      props.onClose();
    }
  };

  const handleAddObjectDialogFormSubmit: SubmitHandler<JsonObjectFormEditorDialogInputs> = async (data, event) => {
    event?.stopPropagation();
    const result = props.onSubmit(data, event);
    const buttonType: string = (event?.nativeEvent as any)["submitter"]["name"];
    console.log(
      logHeader,
      "handleAddObjectDialogFormSubmit buttonType",
      buttonType,
      "props",
      props,
      "passed value",
      data
    );

    if (buttonType == props.label) {
      handleAddObjectDialogFormClose("");
    } else {
      console.warn(
        logHeader,
        "handleAddObjectDialogFormSubmit nog closing dialog form",
        props.label,
        "buttonType",
        buttonType
      );
    }
    return result;
  };

  // const selectList:EntityInstanceWithName[] = useLocalCacheInstancesForJzodAttribute(
  //   props.currentDeploymentUuid,
  //   props.currentApplicationSection,
  //   props.jzodSchema as JzodAttribute
  // ) as EntityInstanceWithName[];
  // console.log("selectList",selectList);

  // if (dialogFormIsOpen && getValues()['uuid'] != props.formObject['uuid']) {
  if (formIsOpen && getValues()["uuid"] != props.initialValuesObject["uuid"]) {
    console.log(logHeader, "reset form!");
    reset(props.initialValuesObject);
  }

  return (
    <div className="JsonObjectFormEditorDialog">
      <span>
        {props.showButton ? (
          <h3>
            {props.label}
            <Button
              variant="outlined"
              onClick={(event) => {
                event?.stopPropagation();
                handleAddObjectDialogFormButtonClick(props?.label, props?.initialValuesObject);
              }}
            >
              <AddBoxIcon />
            </Button>
          </h3>
        ) : (
          <div></div>
        )}
      </span>
      {props.currentDeploymentUuid && props.currentApplicationSection ? (
        <Dialog onClose={handleAddObjectDialogFormClose} open={formIsOpen}>
          {/* <DialogTitle>add Entity</DialogTitle> */}
          <DialogTitle>{props.label} add / edit Element</DialogTitle>
          {/* <form id={'form.'+props.label} onSubmit={handleSubmit(props.onSubmit)} style={{display:"inline-flex"}}> */}
          <form
            id={"form." + props.label}
            onSubmit={handleSubmit(handleAddObjectDialogFormSubmit)}
            style={{ display: "inline-flex" }}
          >
            <JzodElementEditor
              name={'ROOT'}
              innerProps={{
                label: props.label,
                initialValuesObject: props.initialValuesObject,
                showButton: true,
                currentDeploymentUuid: props.currentDeploymentUuid,
                currentApplicationSection: props.currentApplicationSection,
                jzodSchema:props.jzodSchema,
                onSubmit: (data: any, event: any) => {
                  console.log("onSubmit called", data, event);
                },
              }}
              register={register}
              errors={errors}
              formState={formState}
              setValue={setValue}
            />
            {/* errors will return when field validation fails  */}
            {errors.exampleRequired && <span>This field is required</span>}
            <input type="submit" id={props.label} name={props.label} form={"form." + props.label} />
          </form>
        </Dialog>
      ) : (
        <span>No form to display!</span>
      )}
      {/* <span>
      JsonObjectFormEditorDialog end {props.label}
      </span> */}
    </div>
  );
}
