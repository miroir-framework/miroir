import _ from "lodash";

import AddBoxIcon from "@mui/icons-material/AddBox";
import { Button, Dialog, DialogTitle, Paper, styled } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { FormProvider, SubmitHandler, useForm } from "react-hook-form";

import { JzodObject } from "@miroir-framework/jzod-ts";
import {
  ApplicationSection,
  EntityAttribute,
  LoggerInterface,
  MiroirLoggerFactory,
  Uuid,
  applicationDeploymentMiroir,
  getLoggerName
} from "miroir-core";

import { JzodEnumSchemaToJzodElementResolver, getCurrentEnumJzodSchemaResolver } from "../JzodTools";
import { JzodElementEditor } from "./JzodElementEditor";
import { useMiroirContextInnerFormOutput, useMiroirContextformHelperState } from "./MiroirContextReactProvider";
import { useCurrentModel } from "./ReduxHooks";
import { cleanLevel } from "./constants";
import { packageName } from "../../constants";

const loggerName: string = getLoggerName(packageName, cleanLevel,"JsonObjectFormEditorDialog");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export type JsonObjectFormEditorDialogInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

export interface JsonObjectFormEditorCoreDialogProps {
  label?: string;
  // name: string;
  isAttributes?: boolean;
  entityDefinitionJzodSchema: JzodObject;
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

// not used
const reorderObjectField = (logHeader:string,dataParam:any, orderUpdatePathParam:string[], newOrder:string[]):any=>{
  log.info(
    logHeader,
    "handleAddObjectDialogFormSubmit reorderField",
    orderUpdatePathParam.length,
    "path",
    orderUpdatePathParam,
    "orderUpdatePathParam[0]",
    orderUpdatePathParam[0],
    "dataParam",
    dataParam
  );

  // return dataParam;
  if (orderUpdatePathParam.length == 1) {
    const newFieldValue = newOrder.reduce((acc,curr)=>({...acc,[curr]:dataParam[orderUpdatePathParam[0]][curr]}),{})
    const result = {[orderUpdatePathParam[0]]:newFieldValue}
    log.info(logHeader,"handleAddObjectDialogFormSubmit reorderField final",newFieldValue,"result",result);
    return result;
  } else {
    if (orderUpdatePathParam.length == 0) {
      return undefined
    } else {
      const recursiveReorder = reorderObjectField(logHeader,dataParam[orderUpdatePathParam[0]],orderUpdatePathParam.slice(1),newOrder)
      const result:any = {...dataParam, [orderUpdatePathParam[0]]:recursiveReorder};
      log.info(
        logHeader,
        "handleAddObjectDialogFormSubmit reorderField",
        orderUpdatePathParam.length,
        "path",
        orderUpdatePathParam,
        "orderUpdatePathParam[0]",
        orderUpdatePathParam[0],
        "recursiveReorder",
        recursiveReorder,
        "dataParam",
        dataParam,
        "result",
        result
      );
      return result;
    }
  }
}

const reorderArrayField = (logHeader:string, dataParam:any, orderUpdatePathParam:string[], newOrder:number[]):any=>{
  log.info(
    logHeader,
    "handleAddObjectDialogFormSubmit reorderField",
    orderUpdatePathParam.length,
    "path",
    orderUpdatePathParam,
    "orderUpdatePathParam[0]",
    orderUpdatePathParam[0],
    "dataParam",
    dataParam
  );

  // return dataParam;
  if (orderUpdatePathParam.length == 1) {
    const newFieldValue = newOrder.reduce((acc,curr)=>([...acc,dataParam[orderUpdatePathParam[0]][curr]]),[])
    const result = {...dataParam,[orderUpdatePathParam[0]]:newFieldValue}
    log.info(logHeader,"handleAddObjectDialogFormSubmit reorderArrayField final",newFieldValue,"result",result);
    return result;
  } else {
    if (orderUpdatePathParam.length == 0) {
      return undefined
    } else {
      const recursiveReorder = reorderArrayField(logHeader,dataParam[orderUpdatePathParam[0]],orderUpdatePathParam.slice(1),newOrder)
      const result:any = {...dataParam, [orderUpdatePathParam[0]]:recursiveReorder};
      log.info(
        logHeader,
        "handleAddObjectDialogFormSubmit reorderField",
        orderUpdatePathParam.length,
        "path",
        orderUpdatePathParam,
        "orderUpdatePathParam[0]",
        orderUpdatePathParam[0],
        "recursiveReorder",
        recursiveReorder,
        "dataParam",
        dataParam,
        "result",
        result
      );
      return result;
    }
  }
}

// #####################################################################################################
export function JsonObjectFormEditorDialog(props: JsonObjectFormEditorDialogProps) {
  const logHeader = "JsonObjectFormEditorDialog " + (props.label ? props.label + " " : "");
  const [addObjectdialogFormIsOpen, setAddObjectdialogFormIsOpen] = useState(false);
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
  const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

  const currentMiroirModel = useCurrentModel(applicationDeploymentMiroir.uuid);

  const currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver = useMemo(
    () => getCurrentEnumJzodSchemaResolver(currentMiroirModel),
    [currentMiroirModel]
  );
  // const currentEnumJzodSchemaResolver: JzodElementRecord = useMemo(
  //   () => getCurrentEnumJzodSchemaResolver(currentMiroirModel),
  //   [currentMiroirModel]
  // );

  const formMethods = useForm<JsonObjectFormEditorDialogInputs>({ defaultValues: props.initialValuesObject });
  const { register, handleSubmit, reset, trigger, watch, setValue, getValues, formState } = formMethods;

  const { errors } = formState;
  log.info(
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

  const handleAddObjectDialogFormButtonClick = useCallback((label: string  | undefined, a: any) => {
    log.info(
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
  },[props]);

  const handleAddObjectDialogFormClose = useCallback((value: string) => {
    log.info(logHeader, "handleAddObjectDialogFormClose", value);

    setAddObjectdialogFormIsOpen(false);
    if (!props.showButton) {
      props.onClose();
    }
  },[props]);

  const handleAddObjectDialogFormSubmit: SubmitHandler<JsonObjectFormEditorDialogInputs> = useCallback(async (data, event) => {
    const buttonType: string = (event?.nativeEvent as any)["submitter"]["name"];
    log.info(
      logHeader,
      "handleAddObjectDialogFormSubmit called for buttonType",
      buttonType,
      "props",
      props,
      "passed value",
      data,
      "formHelperState",
      formHelperState
    );
    // event?.stopPropagation();
    // let newVersion = {...data,...data['ROOT']};
    let reorderedDataValue: any;
    let result:any;
    if (formHelperState && Object.keys(formHelperState).length > 0) {
      const orderUpdate:string = Object.keys(formHelperState)[0];
      // const orderUpdateFields = orderUpdate.split(".").splice(0,1);
      const orderUpdatePath = orderUpdate.split(".").slice(1);
      const newOrder:number[] = Object.values(formHelperState)[0] as number[];

      log.info(logHeader,"handleAddObjectDialogFormSubmit calling reorderField",data);
      
      const reorderedDataValue = reorderArrayField(logHeader, data, orderUpdatePath, newOrder);
      // const targetField = orderUpdateFields.slice(1).reduce((acc,curr)=>acc[curr],data);
      // reorderedDataValue = {...data,reorderedField}
      delete reorderedDataValue["ROOT"]; // WHY HAS ROOT BEEN ADDED???? BUG?
      const newVersion = structuredClone(reorderedDataValue)
      log.info(
        logHeader,
        "handleAddObjectDialogFormSubmit after reorderArrayField",
        "newOrder",
        newOrder,
        "reorderedDataValue",
        reorderedDataValue,
        "newVersion",
        newVersion
        // "data",data
      );
      // const newDataValue = orderUpdateFields.slice(1).r
      result = props.onSubmit(newVersion, event);
    } else {
      const newVersion = _.merge(data,data["ROOT"]);
      delete newVersion["ROOT"];
      result = props.onSubmit(newVersion, event);
    }
    // const newVersion = _.merge(reorderedDataValue,data["ROOT"]);
    // const newVersion = Object.assign({},reorderedDataValue);
    // // delete newVersion["ROOT"];
    // log.info(logHeader,"handleAddObjectDialogFormSubmit","newVersion",newVersion);
    

    if (buttonType == props.label) {
      handleAddObjectDialogFormClose("");
    } else {
      log.warn(
        logHeader,
        "handleAddObjectDialogFormSubmit now closing dialog form",
        props.label,
        "buttonType",
        buttonType
      );
    }
    return result;
  },[props]);

  // const selectList:EntityInstanceWithName[] = useLocalCacheInstancesForJzodAttribute(
  //   props.currentDeploymentUuid,
  //   props.currentApplicationSection,
  //   props.jzodSchema as JzodAttribute
  // ) as EntityInstanceWithName[];
  // log.info("selectList",selectList);

  // if (dialogFormIsOpen && getValues()['uuid'] != props.formObject['uuid']) {
  if (formIsOpen && getValues()["uuid"] != props.initialValuesObject["uuid"]) {
    log.info(logHeader, "reset form!");
    reset(props.initialValuesObject);
  }

  const dialogStyle = useMemo(()=>({
    height: "90vh",
    width: "200vw",
    display: "flex",
  }),[])

  return (
    <div className="JsonObjectFormEditorDialog">
      {/* <span> */}
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
      {/* </span> */}
      {props.currentDeploymentUuid && props.currentApplicationSection ? (
        <FormProvider {...formMethods}>
          <Dialog onClose={handleAddObjectDialogFormClose} open={formIsOpen} fullScreen>
            <DialogTitle>{props.label} add / edit Element</DialogTitle>
            <span>form: {"form." + props.label}</span>
            <form
              id={"form." + props.label}
              onSubmit={handleSubmit(handleAddObjectDialogFormSubmit)}
            >
              <JzodElementEditor
                name={'ROOT'}
                listKey={'ROOT'}
                currentEnumJzodSchemaResolver={currentEnumJzodSchemaResolver}
                innerProps={{
                  label: props.label,
                  initialValuesObject: props.initialValuesObject,
                  showButton: true,
                  currentDeploymentUuid: props.currentDeploymentUuid,
                  currentApplicationSection: props.currentApplicationSection,
                  elementJzodSchema:props.entityDefinitionJzodSchema,
                  rootJzodSchema:props.entityDefinitionJzodSchema,
                }}
              />
              {errors.exampleRequired && <span>This field is required</span>}
              <button type="submit" name={props.label} form={"form." + props.label}>submit form.{props.label}</button>
            </form>
          </Dialog>
        </FormProvider>
      ) : (
        <span>No form to display!</span>
      )}
    </div>
  );
}
