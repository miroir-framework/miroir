import _ from "lodash";

import { Dialog, DialogTitle, Paper } from "@mui/material";
import { styled } from "@mui/material/styles"; // For MUI v5
import { useCallback, useMemo } from "react";

import { Formik, FormikProps } from "formik";

import {
  ApplicationSection,
  EntityAttribute,
  EntityInstancesUuidIndex,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Uuid,
  jzodTypeCheck
} from "miroir-core";

import { packageName } from "../../../constants.js";
import { cleanLevel } from "../constants.js";
import {
  useMiroirContextInnerFormOutput,
  useMiroirContextService
} from "../MiroirContextReactProvider.js";
import { JzodElementEditor } from "./JzodElementEditor.js";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JsonObjectEditFormDialog")
).then((logger: LoggerInterface) => {log = logger});


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
    "JsonObjectEditFormDialog reorderObjectField",
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
    log.info("JsonObjectEditFormDialog reorderObjectField final",newFieldValue,"result",result);
    return result;
  } else {
    if (orderUpdatePathParam.length == 0) {
      return undefined
    } else {
      const recursiveReorder = reorderObjectField(dataParam[orderUpdatePathParam[0]],orderUpdatePathParam.slice(1),newOrder)
      const result:any = {...dataParam, [orderUpdatePathParam[0]]:recursiveReorder};
      log.info(
        "JsonObjectEditFormDialog reorderObjectField",
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
    "JsonObjectEditFormDialog reorderArrayField",
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
    log.info("JsonObjectEditFormDialog reorderArrayField final", newFieldValue, "result", result);
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
        "JsonObjectEditFormDialog reorderField",
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

interface JsonElementEditorDialogProps {
  label?: string;
  count: number;
  formState: any;
  currentDeploymentUuid?: Uuid;
  currentApplicationSection?: ApplicationSection;
  entityDefinitionJzodSchema: JzodObject;
  resolvedJzodSchema: any;
  foreignKeyObjects: Record<string, EntityInstancesUuidIndex>;
  // dialog
  setdialogOuterFormObject: (obj: any) => void;
  handleAddObjectDialogFormSubmit: (data: any, source?: string) => Promise<any>;
  handleAddObjectDialogFormClose: (value: string) => void;
  formIsOpen: boolean;
  onCreateFormObject?: (a: any) => void;
  // 
  onSubmit: (data: JsonObjectEditFormDialogInputs) => void;
}

// ################################################################################################
const JsonElementEditorDialog: React.FC<JsonElementEditorDialogProps> = ({
  label,
  count,
  formState: formState,
  // setformHelperState,
  // dialog: open and close dialog, collect result
  currentDeploymentUuid,
  currentApplicationSection,
  entityDefinitionJzodSchema,
  resolvedJzodSchema,
  foreignKeyObjects,
  setdialogOuterFormObject,
  handleAddObjectDialogFormSubmit,
  handleAddObjectDialogFormClose,
  onCreateFormObject,
  formIsOpen,
  // 
  onSubmit,
}) => {
  const onCodeEditorChange = useCallback((values: any, viewUpdate: any) => {
    log.info('edit code received value:', values);
    setdialogOuterFormObject(JSON.parse(values));
    log.info('edit code done');
  }, [setdialogOuterFormObject]);

  const labelElement = useMemo(() => {
    return label ? <span id={"label." + label}>{label}</span> : undefined;
  }, [label]);
  return (
    <Formik
      enableReinitialize={true}
      initialValues={formState}
      onSubmit={async (values, { setSubmitting, setErrors }) => {
        try {
          if (onCreateFormObject) {
            log.info("onSubmit formik onCreateFormObject", values);
            await onCreateFormObject(values);
            await onSubmit(values);
          } else {
            log.info("onSubmit formik handleAddObjectDialogFormSubmit", values);
            // setformHelperState(values);
            await handleAddObjectDialogFormSubmit(values, "param");
          }
        } catch (e) {
          log.error(e);
        } finally {
          setSubmitting(false);
        }
      }}
      // handleChange={async (e: ChangeEvent<any>) => {
      //   log.info("onChange formik DOES NOTHING", e);
      // }}
    >
      {(formik: FormikProps<any>) => (
        <Dialog onClose={handleAddObjectDialogFormClose} open={formIsOpen} fullScreen>
          <DialogTitle>{label} add / edit Element</DialogTitle>
          <span>
            form: {"form." + label}, JsonObjectEditFormDialog count {count}
          </span>
          <form
            id={"form." + label}
            onSubmit={formik.handleSubmit}
          >
            <span style={{paddingTop: 0, paddingBottom: 0}}>
              <JzodElementEditor
                name={"ROOT"}
                listKey={"ROOT"}
                rootLesslistKey=""
                rootLesslistKeyArray={[]}
                label={labelElement}
                currentDeploymentUuid={currentDeploymentUuid}
                currentApplicationSection={currentApplicationSection}
                rawJzodSchema={entityDefinitionJzodSchema}
                resolvedElementJzodSchema={resolvedJzodSchema?.status == "ok" ? resolvedJzodSchema.element : undefined}
                foreignKeyObjects={foreignKeyObjects}
                indentLevel={0}
              />
              <button type="submit" name={label} form={"form." + label}>
                submit form.{label}
              </button>
            </span>
          </form>
        </Dialog>
      )}
    </Formik>
  );
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export function JsonObjectEditFormDialog(props: JsonObjectEditFormDialogProps) {
  count++;
  const {
    label,
    isAttributes,
    entityDefinitionJzodSchema,
    defaultFormValuesObject,
    currentDeploymentUuid,
    currentApplicationSection,
    currentAppModel,
    currentMiroirModel,
    addObjectdialogFormIsOpen,
    foreignKeyObjects,
    setAddObjectdialogFormIsOpen,
    onCreateFormObject,
    onSubmit,
    showButton,
  } = props;
  log.info(
    "##################################### rendering",
    "label",
    label,
    "count",
    count,
    "defaultFormValuesObject",
    defaultFormValuesObject,
    "entityDefinitionJzodSchema",
    entityDefinitionJzodSchema
  );
  const context = useMiroirContextService();

  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
  // const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

  const formIsOpen = addObjectdialogFormIsOpen || (!showButton && props.isOpen);

  const resolvedJzodSchema = useMemo(
    () => context.miroirFundamentalJzodSchema &&
    entityDefinitionJzodSchema &&
    defaultFormValuesObject &&
    dialogOuterFormObject &&
    currentAppModel ?
    jzodTypeCheck(
      entityDefinitionJzodSchema,
      dialogOuterFormObject,
      [],
      [],
      context.miroirFundamentalJzodSchema,
      currentAppModel,
      currentMiroirModel,
      {}
    ): undefined,
    [props, dialogOuterFormObject, context.miroirFundamentalJzodSchema]
  )
  log.info(
    "called jzodTypeCheck for valueObject",
    defaultFormValuesObject,
    "jzodSchema",
    entityDefinitionJzodSchema,
    " resolvedJzodSchema",
    resolvedJzodSchema
  );

  const handleAddObjectDialogFormClose = useCallback((value: string) => {
    log.info("handleAddObjectDialogFormClose", value);

    setAddObjectdialogFormIsOpen(false);
    if (!showButton) {
      props.onClose();
    }
  },[props]);

  const handleAddObjectDialogFormSubmit = useCallback(
    async (data:any, source?: string) => {
      log.info(
        "@@@@@@@@@@@@@@@@@@@@@@ handleAddObjectDialogFormSubmit called for data",
        data,
        "props",
        props,
        "dialogOuterFormObject",
        dialogOuterFormObject,
      );

      const effectiveData = source == "param" && data?data:dialogOuterFormObject;
      log.info("handleAddObjectDialogFormSubmit called with dialogOuterFormObject", dialogOuterFormObject);

      let result: any;
      const newVersion = _.merge(effectiveData, effectiveData["ROOT"]);
      delete newVersion["ROOT"];
      log.info(
        "handleAddObjectDialogFormSubmit producing",
        "newVersion",
        newVersion,
        "data",
        data,
        "props",
        props,
        "passed value",
      );
      result = onSubmit(newVersion);
      handleAddObjectDialogFormClose("");
      return result;
    },
    [props,JSON.stringify(dialogOuterFormObject, null, 2)]
  );

  return (
    <div className="JsonObjectEditFormDialog">
      {showButton ? (
        <h3>Show Button! (Button is no more supported by JzonsObjectFormEditorDialog, this is a bug)</h3>
      ) : (
        <div></div>
      )}
      {currentDeploymentUuid &&
      currentApplicationSection &&
      !showButton &&
      props?.isOpen &&
      dialogOuterFormObject ? (
        <JsonElementEditorDialog
          label={label}
          formState={dialogOuterFormObject}
          setdialogOuterFormObject={setdialogOuterFormObject}
          // setformHelperState={setformHelperState}
          handleAddObjectDialogFormSubmit={handleAddObjectDialogFormSubmit}
          handleAddObjectDialogFormClose={handleAddObjectDialogFormClose}
          formIsOpen={formIsOpen}
          onCreateFormObject={onCreateFormObject}
          onSubmit={onSubmit}
          currentDeploymentUuid={currentDeploymentUuid}
          currentApplicationSection={currentApplicationSection}
          entityDefinitionJzodSchema={entityDefinitionJzodSchema}
          resolvedJzodSchema={resolvedJzodSchema}
          foreignKeyObjects={foreignKeyObjects}
          count={count}
        />
      ) : (
        <></>
      )}
    </div>
  );
}
