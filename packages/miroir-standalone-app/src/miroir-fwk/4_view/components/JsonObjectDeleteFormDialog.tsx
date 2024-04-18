import _ from "lodash";

import { javascript } from '@codemirror/lang-javascript';
import { Dialog, DialogTitle, Paper, styled } from "@mui/material";
import CodeMirror from '@uiw/react-codemirror';
import { ChangeEvent, useCallback, useMemo } from "react";

import { Formik } from "formik";

import {
  ApplicationSection,
  EntityAttribute,
  EntityInstancesUuidIndex,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Uuid,
  getLoggerName,
  resolveReferencesForJzodSchemaAndValueObject
} from "miroir-core";

import { packageName } from "../../../constants";
import { JzodElementEditor } from "./JzodElementEditor";
import { useMiroirContextInnerFormOutput, useMiroirContextService, useMiroirContextformHelperState } from "../MiroirContextReactProvider";
import { cleanLevel } from "../constants";


const loggerName: string = getLoggerName(packageName, cleanLevel,"JsonObjectDeleteFormDialog");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// #################################################################################################
export type JsonObjectEditFormDialogInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

export interface JsonObjectDeleteFormCoreDialogProps {
  label?: string,
  defaultFormValuesObject: any,
  deleteObjectdialogFormIsOpen: boolean,
  entityDefinitionJzodSchema: JzodObject,
  isAttributes?: boolean,
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection,
  currentAppModel: MetaModel,
  currentMiroirModel: MetaModel,
  foreignKeyObjects: Record<string,EntityInstancesUuidIndex>,
  setDeleteObjectdialogFormIsOpen: (a:boolean) => void,
  onDeleteFormObject?: (a: any) => void,
  // onDelete: (data:JsonObjectEditFormDialogInputs)=>void,
}

export interface JsonObjectFormEditorWithButtonDialogProps extends JsonObjectDeleteFormCoreDialogProps {
  showButton: true;
}

export interface JsonObjectEditFormDialogWithoutButtonProps extends JsonObjectDeleteFormCoreDialogProps {
  showButton: false;
  isOpen: boolean;
  onClose: (a?: any,event?:any) => void;
}

export type JsonObjectEditFormDialogProps =
  | JsonObjectFormEditorWithButtonDialogProps
  | JsonObjectEditFormDialogWithoutButtonProps;

// const Item = styled(Paper)(({ theme }) => ({
//   backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
//   ...theme.typography.body2,
//   padding: theme.spacing(1),
//   textAlign: "left",
//   display: "flex",
//   // maxHeight: "20%",
//   height: '20%',
//   color: theme.palette.text.secondary,
// }));


let count = 0;
// #####################################################################################################
export function JsonObjectDeleteFormDialog(props: JsonObjectEditFormDialogProps) {
  count++;
  log.info(
    "##################################### rendering",
    "label",
    props.label,
    "count",
    count,
    "defaultFormValuesObject",
    props.defaultFormValuesObject,
    "entityDefinitionJzodSchema",
    props.entityDefinitionJzodSchema
  );
  const context = useMiroirContextService();

  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
  // const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

  const formIsOpen = props.deleteObjectdialogFormIsOpen || (!props.showButton && props.isOpen);

  const resolvedJzodSchema = useMemo(
    () => context.miroirFundamentalJzodSchema &&
    props.entityDefinitionJzodSchema &&
    props.defaultFormValuesObject &&
    props.currentAppModel ?
    resolveReferencesForJzodSchemaAndValueObject(
      context.miroirFundamentalJzodSchema,
      props.entityDefinitionJzodSchema,
      props.defaultFormValuesObject,
      props.currentAppModel,
      props.currentMiroirModel,
    ): undefined,
    [props, context.miroirFundamentalJzodSchema]
  )
  log.info(
    "called resolveReferencesForJzodSchemaAndValueObject for valueObject",
    props.defaultFormValuesObject,
    "jzodSchema",
    props.entityDefinitionJzodSchema,
    " resolvedJzodSchema",
    resolvedJzodSchema
  );

  // ##############################################################################################
  const handleDeleteObjectDialogFormClose = useCallback(async (value: any) => {
    log.info("handleDeleteObjectDialogFormClose", value);

    props.setDeleteObjectdialogFormIsOpen(false);
    if (!props.showButton) {
      props.onClose();
    }
  },[props]);

  // ##############################################################################################
  // const handleDeleteObjectDialogFormSubmit: SubmitHandler<JsonObjectEditFormDialogInputs> = useCallback(
  const handleDeleteObjectDialogFormSubmit = useCallback(
    async (data:any, source?: string) => {
      // const buttonType: string = (event?.nativeEvent as any)["submitter"]["name"];
      log.info(
        "@@@@@@@@@@@@@@@@@@@@@@ handleDeleteObjectDialogFormSubmit called for data",
        data,
        "props",
        props,
        "dialogOuterFormObject",
        dialogOuterFormObject,
      );
      // event?.stopPropagation();
      // let newVersion = {...data,...data['ROOT']};

      // const effectiveData = codeEditorChangedValue? JSON.parse(codeEditorValue): data
      // const effectiveData = source == "param" && data?data:dialogOuterFormObject;
      // log.info("handleDeleteObjectDialogFormSubmit called with dialogOuterFormObject", dialogOuterFormObject);

      // let result: any;
      // const newVersion = _.merge(effectiveData, effectiveData["ROOT"]);
      // delete newVersion["ROOT"];
      // log.info(
      //   // "handleDeleteObjectDialogFormSubmit called for buttonType",
      //   // buttonType,
      //   "handleDeleteObjectDialogFormSubmit producing",
      //   "newVersion",
      //   newVersion,
      //   "data",
      //   data,
      //   "props",
      //   props,
      //   "passed value",
      // );
      // result = props.onSubmit(newVersion);
      if (props?.onDeleteFormObject) {
        await props.onDeleteFormObject(dialogOuterFormObject);
      } else {
        log.error('handleDeleteObjectDialogFormSubmit called for not EntityInstance');
      }
  
      handleDeleteObjectDialogFormClose("");
      // return result;
    },
    [props,JSON.stringify(dialogOuterFormObject, null, 2)]
  );

  // const dialogStyle = useMemo(()=>({
  //   height: "90vh",
  //   width: "200vw",
  //   display: "flex",
  // }),[])

  return (
    <div className="JsonObjectDeleteFormDialog">
      {/* <span> */}
        {props.showButton ? (
          <h3>
            Show Button! (Button is no more supported by JzonsObjectFormEditorDialog, this is a bug)
          </h3>
        ) : (
          <div></div>
        )}
      {/* </span> */}
      {/* {props.currentDeploymentUuid && props.currentApplicationSection && !props.showButton && props?.isOpen && props.defaultFormValuesObject ? ( */}
      {props.currentDeploymentUuid && props.currentApplicationSection && !props.showButton && props?.isOpen && dialogOuterFormObject ? (
        <Dialog onClose={handleDeleteObjectDialogFormClose} open={formIsOpen} fullScreen>
          <DialogTitle>{props.label} Delete Element</DialogTitle>
          <span>form: {"form." + props.label}, JsonObjectDeleteFormDialog count {count}</span>
          <button type="button" name={props.label+".OK"} onClick={handleDeleteObjectDialogFormSubmit}>OK</button>
          <button type="button" name={props.label+".CANCEL"} onClick={handleDeleteObjectDialogFormClose}>CANCEL</button>
        </Dialog>
      // </FormProvider>
      ) : (
        <></>
        // <span>No form to display!</span>
      )}
    </div>
  );
}
