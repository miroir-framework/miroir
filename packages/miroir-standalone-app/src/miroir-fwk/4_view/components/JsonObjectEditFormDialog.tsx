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


const loggerName: string = getLoggerName(packageName, cleanLevel,"JsonObjectEditFormDialog");
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

export interface JsonObjectFormEditorCoreDialogProps {
  label?: string,
  isAttributes?: boolean,
  entityDefinitionJzodSchema: JzodObject,
  defaultFormValuesObject: any,
  currentDeploymentUuid?: Uuid,
  currentApplicationSection?: ApplicationSection,
  currentAppModel: MetaModel,
  currentMiroirModel: MetaModel,
  addObjectdialogFormIsOpen: boolean,
  foreignKeyObjects: Record<string,EntityInstancesUuidIndex>,
  setAddObjectdialogFormIsOpen: (a:boolean) => void,
  onCreateFormObject?: (a: any) => void,
  onSubmit: (data:JsonObjectEditFormDialogInputs)=>void,
}

export interface JsonObjectFormEditorWithButtonDialogProps extends JsonObjectFormEditorCoreDialogProps {
  showButton: true;
}

export interface JsonObjectEditFormDialogWithoutButtonProps extends JsonObjectFormEditorCoreDialogProps {
  showButton: false;
  isOpen: boolean;
  onClose: (a?: any,event?:any) => void;
}

export type JsonObjectEditFormDialogProps =
  | JsonObjectFormEditorWithButtonDialogProps
  | JsonObjectEditFormDialogWithoutButtonProps;

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

// ################################################################################################
// not used
const reorderObjectField = (dataParam:any, orderUpdatePathParam:string[], newOrder:string[]):any=>{
  log.info(
    "handleAddObjectDialogFormSubmit reorderObjectField",
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
    log.info("handleAddObjectDialogFormSubmit reorderObjectField final",newFieldValue,"result",result);
    return result;
  } else {
    if (orderUpdatePathParam.length == 0) {
      return undefined
    } else {
      const recursiveReorder = reorderObjectField(dataParam[orderUpdatePathParam[0]],orderUpdatePathParam.slice(1),newOrder)
      const result:any = {...dataParam, [orderUpdatePathParam[0]]:recursiveReorder};
      log.info(
        "handleAddObjectDialogFormSubmit reorderObjectField",
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

// ################################################################################################
const reorderArrayField = (
  // logHeader: string,
  dataParam: any,
  orderUpdatePathParam: string[],
  newOrder: number[]
): any => {
  log.info(
    "handleAddObjectDialogFormSubmit reorderArrayField",
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
    const newFieldValue = newOrder.reduce((acc:any, curr:number) => [...acc, dataParam[orderUpdatePathParam[0]][curr]], []);
    const result = { ...dataParam, [orderUpdatePathParam[0]]: newFieldValue };
    log.info("handleAddObjectDialogFormSubmit reorderArrayField final", newFieldValue, "result", result);
    return result;
  } else {
    if (orderUpdatePathParam.length == 0) {
      return undefined;
    } else {
      const recursiveReorder = reorderArrayField(
        dataParam[orderUpdatePathParam[0]],
        orderUpdatePathParam.slice(1),
        newOrder
      );
      const result: any = { ...dataParam, [orderUpdatePathParam[0]]: recursiveReorder };
      log.info(
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
};

// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
// #####################################################################################################
let count = 0;

export function JsonObjectEditFormDialog(props: JsonObjectEditFormDialogProps) {
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
  const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

  const onCodeEditorChange = useCallback((values:any, viewUpdate:any) => {
    log.info('edit code received value:', values);
    setdialogOuterFormObject(JSON.parse(values))
    log.info('edit code done');
  }, []);

  const formIsOpen = props.addObjectdialogFormIsOpen || (!props.showButton && props.isOpen);

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

  // // ##############################################################################################
  // const handleAddObjectDialogFormButtonClick = useCallback((label: string  | undefined, a: any) => {
  //   log.info(
  //     "handleAddObjectDialogFormOpen",
  //     label,
  //     "called, props.formObject",
  //     props.defaultFormValuesObject,
  //     "passed value",
  //     a
  //   );

  //   props.setAddObjectdialogFormIsOpen(true);
  //   // reset(props.defaultFormValuesObject);
  //   setdialogOuterFormObject(a);
  // },[props]);

  // ##############################################################################################
  const handleAddObjectDialogFormClose = useCallback((value: string) => {
    log.info("handleAddObjectDialogFormClose", value);

    props.setAddObjectdialogFormIsOpen(false);
    if (!props.showButton) {
      props.onClose();
    }
  },[props]);

  // ##############################################################################################
  // const handleAddObjectDialogFormSubmit: SubmitHandler<JsonObjectEditFormDialogInputs> = useCallback(
  const handleAddObjectDialogFormSubmit = useCallback(
    async (data:any, source?: string) => {
      // const buttonType: string = (event?.nativeEvent as any)["submitter"]["name"];
      log.info(
        "@@@@@@@@@@@@@@@@@@@@@@ handleAddObjectDialogFormSubmit called for data",
        data,
        "props",
        props,
        "dialogOuterFormObject",
        dialogOuterFormObject,
      );
      // event?.stopPropagation();
      // let newVersion = {...data,...data['ROOT']};

      // const effectiveData = codeEditorChangedValue? JSON.parse(codeEditorValue): data
      const effectiveData = source == "param" && data?data:dialogOuterFormObject;
      log.info("handleAddObjectDialogFormSubmit called with dialogOuterFormObject", dialogOuterFormObject);

      let reorderedDataValue: any;
      let result: any;
      // // if (formHelperState && Object.keys(formHelperState).length > 0) {
      // if (effectiveData && Object.keys(effectiveData).length > 0) {
      //   const orderUpdate: string = Object.keys(effectiveData)[0];
      //   // const orderUpdateFields = orderUpdate.split(".").splice(0,1);
      //   const orderUpdatePath = orderUpdate.split(".").slice(1);
      //   const newOrder: number[] = Object.values(effectiveData)[0] as number[];

        
      //   log.info("handleAddObjectDialogFormSubmit calling reorderField");

      //   const reorderedDataValue = reorderArrayField(effectiveData, orderUpdatePath, newOrder);
      //   // const targetField = orderUpdateFields.slice(1).reduce((acc,curr)=>acc[curr],data);
      //   // reorderedDataValue = {...data,reorderedField}
      //   if (reorderedDataValue["ROOT"]) {
      //     delete reorderedDataValue["ROOT"]; // TODO: WHY HAS ROOT BEEN ADDED???? BUG?
      //   }
      //   const newVersion = structuredClone(reorderedDataValue);
      //   log.info(
      //     "handleAddObjectDialogFormSubmit after reorderArrayField",
      //     "newOrder",
      //     newOrder,
      //     "reorderedDataValue",
      //     reorderedDataValue,
      //     "newVersion",
      //     newVersion
      //     // "data",data
      //   );
      //   result = props.onSubmit(newVersion);
      // } else {
        const newVersion = _.merge(effectiveData, effectiveData["ROOT"]);
        delete newVersion["ROOT"];
        log.info(
          // "handleAddObjectDialogFormSubmit called for buttonType",
          // buttonType,
          "handleAddObjectDialogFormSubmit producing",
          "newVersion",
          newVersion,
          "data",
          data,
          "props",
          props,
          "passed value",
        );
        result = props.onSubmit(newVersion);
      // }
      handleAddObjectDialogFormClose("");
      return result;
    },
    [props,JSON.stringify(dialogOuterFormObject, null, 2)]
  );

  // const dialogStyle = useMemo(()=>({
  //   height: "90vh",
  //   width: "200vw",
  //   display: "flex",
  // }),[])

  return (
    <div className="JsonObjectEditFormDialog">
      {/* <span> */}
      {props.showButton ? (
        <h3>Show Button! (Button is no more supported by JzonsObjectFormEditorDialog, this is a bug)</h3>
      ) : (
        <div></div>
      )}
      {/* </span> */}
      {/* {props.currentDeploymentUuid && props.currentApplicationSection && !props.showButton && props?.isOpen && props.defaultFormValuesObject ? ( */}
      {props.currentDeploymentUuid &&
      props.currentApplicationSection &&
      !props.showButton &&
      props?.isOpen &&
      dialogOuterFormObject ? (
        <Formik
          // initialValues={props.defaultFormValuesObject}
          enableReinitialize={true}
          initialValues={dialogOuterFormObject}
          onSubmit={async (values, { setSubmitting, setErrors }) => {
            try {
              //  Send values somehow
              if (props.onCreateFormObject) {
                log.info("onSubmit formik onCreateFormObject", values);
                await props.onCreateFormObject(values);
                await props.onSubmit(values);
              } else {
                log.info("onSubmit formik handleAddObjectDialogFormSubmit", values);
                setformHelperState(values);
                // setdialogOuterFormObject(values)
                await handleAddObjectDialogFormSubmit(values, "param");
              }
            } catch (e) {
              log.error(e);
              //  Map and show the errors in your form
              // const [formErrors, unknownErrors] = mapErrorsFromRequest(e)

              // setErrors(formErrors)
              // this.setState({
              //   unknownErrors,
              // })
            } finally {
              setSubmitting(false);
            }
          }}
          handleChange={async (e: ChangeEvent<any>) => {
            log.info("onChange formik", e);
            // try {
            //   //  Send values somehow
            //   if (props.onCreateFormObject) {
            //     await props.onCreateFormObject(values)
            //     await props.onSubmit(values);
            //   } else {
            //     await handleAddObjectDialogFormSubmit(values)
            //   }
            // } catch (e) {
            //   log.error(e)
            //   //  Map and show the errors in your form
            //   // const [formErrors, unknownErrors] = mapErrorsFromRequest(e)

            //   // setErrors(formErrors)
            //   // this.setState({
            //   //   unknownErrors,
            //   // })
            // } finally {
            //   setSubmitting(false)
            // }
          }}
        >
          {(formik) => (
            <Dialog onClose={handleAddObjectDialogFormClose} open={formIsOpen} fullScreen>
              <DialogTitle>{props.label} add / edit Element</DialogTitle>
              <span>
                form: {"form." + props.label}, JsonObjectEditFormDialog count {count}
              </span>
              <form
                id={"form." + props.label}
                // onSubmit={handleSubmit(handleAddObjectDialogFormSubmit)}
                onSubmit={formik.handleSubmit}
              >
                {
                  // props.defaultFormValuesObject?
                  dialogOuterFormObject ? (
                    <CodeMirror
                      value={JSON.stringify(dialogOuterFormObject, null, 2)}
                      height="200px"
                      extensions={[javascript({ jsx: true })]}
                      onChange={onCodeEditorChange}
                    />
                  ) : (
                    <></>
                  )
                }

                <JzodElementEditor
                  name={"ROOT"}
                  listKey={"ROOT"}
                  rootLesslistKey=""
                  rootLesslistKeyArray={[]}
                  label={props.label}
                  currentDeploymentUuid={props.currentDeploymentUuid}
                  currentApplicationSection={props.currentApplicationSection}
                  rawJzodSchema={props.entityDefinitionJzodSchema}
                  resolvedJzodSchema={resolvedJzodSchema?.status == "ok" ? resolvedJzodSchema.element : undefined}
                  foreignKeyObjects={props.foreignKeyObjects}
                  formState={dialogOuterFormObject}
                  setFormState={setdialogOuterFormObject}
                  formik={formik}
                />
                {/* {errors.exampleRequired && <span>This field is required</span>} */}
                <button type="submit" name={props.label} form={"form." + props.label}>
                  submit form.{props.label}
                </button>
              </form>
            </Dialog>
          )}
        </Formik>
      ) : (
        // </FormProvider>
        <></>
        // <span>No form to display!</span>
      )}
    </div>
  );
}
