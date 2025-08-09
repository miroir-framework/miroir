import _ from "lodash";

import { Dialog, DialogTitle, Paper } from "@mui/material";
import { styled } from "@mui/material/styles"; // For MUI v5
import { useCallback, useMemo, useState } from "react";

import { Formik, FormikProps } from "formik";
import { ErrorBoundary } from "react-error-boundary";

import {
  ApplicationSection,
  DomainControllerInterface,
  EntityAttribute,
  EntityInstancesUuidIndex,
  InstanceAction,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ResolvedJzodSchemaReturnType,
  Uuid,
  jzodTypeCheck,
  selfApplicationDeploymentMiroir
} from "miroir-core";

import { packageName } from "../../../constants.js";
import { cleanLevel } from "../constants.js";
import {
  useMiroirContextInnerFormOutput,
  useMiroirContextService
} from "../MiroirContextReactProvider.js";
import { useDomainControllerService } from "../MiroirContextReactProvider.js";
import { JzodElementEditor } from "./ValueObjectEditor/JzodElementEditor.js";
import { ErrorFallbackComponent } from "./ErrorFallbackComponent.js";
import {
  measuredJzodTypeCheck,
} from "../tools/hookPerformanceMeasure.js";


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

// ⚠️ DEPRECATED: Use ThemedComponents instead of hard-coded MUI styled components
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
  currentAppModel: MetaModel;
  currentMiroirModel: MetaModel;
  miroirFundamentalJzodSchema: any;
  // dialog
  setdialogOuterFormObject: (obj: any) => void;
  handleAddObjectDialogFormSubmit: (data: any, source?: string) => Promise<any>;
  handleAddObjectDialogFormClose: (value: string) => void;
  formIsOpen: boolean;
  onCreateFormObject?: (a: any) => void;
  onEditFormObject: (data: any) => Promise<void>;
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
  currentAppModel,
  currentMiroirModel,
  miroirFundamentalJzodSchema,
  setdialogOuterFormObject,
  handleAddObjectDialogFormSubmit,
  handleAddObjectDialogFormClose,
  onCreateFormObject,
  onEditFormObject,
  formIsOpen,
  // 
  onSubmit,
}) => {
  // Add state for folded object attributes/array items
  const [foldedObjectAttributeOrArrayItems, setFoldedObjectAttributeOrArrayItems] = useState<{ [k: string]: boolean }>({});

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
          log.info("onSubmit formik values", values);
          
          // Call the actual domain controller action (equivalent to ReportSectionEntityInstance)
          await onEditFormObject(values);
          
          // Also handle the legacy form submission logic if needed
          if (onCreateFormObject) {
            log.info("onSubmit formik onCreateFormObject", values);
            await onCreateFormObject(values);
            await onSubmit(values);
          } else {
            log.info("onSubmit formik handleAddObjectDialogFormSubmit", values);
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
      {(formik: FormikProps<any>) => {
        // Resolve the jzod schema inside Formik using formik.values
        const resolvedJzodSchemaForFormik: ResolvedJzodSchemaReturnType | undefined = useMemo(() => {
          let result: ResolvedJzodSchemaReturnType | undefined = undefined;
          try {
            result =
              miroirFundamentalJzodSchema &&
              entityDefinitionJzodSchema &&
              formik.values &&
              currentAppModel
                ? jzodTypeCheck(
                    entityDefinitionJzodSchema,
                    formik.values,
                    [], // currentValuePath
                    [], // currentTypePath
                    miroirFundamentalJzodSchema,
                    currentAppModel,
                    currentMiroirModel,
                    {}
                  )
                : undefined;
          } catch (e) {
            log.error(
              "JsonElementEditorDialog useMemo error",
              e
            );
            result = {
              status: "error",
              valuePath: [],
              typePath: [],
              error: JSON.stringify(e, Object.getOwnPropertyNames(e)),
            };
          }
          return result;
        }, [formik.values, entityDefinitionJzodSchema, miroirFundamentalJzodSchema, currentAppModel, currentMiroirModel]);

        return (
          <Dialog onClose={handleAddObjectDialogFormClose} open={formIsOpen} fullScreen>
            <DialogTitle>{label} add / edit Element</DialogTitle>
            <span>
              form: {"form." + label}, JsonObjectEditFormDialog count {count}
            </span>
            <form id={"form." + label} onSubmit={formik.handleSubmit}>
              <span style={{ paddingTop: 0, paddingBottom: 0 }}>
                <ErrorBoundary
                  FallbackComponent={({ error, resetErrorBoundary }) => (
                    <ErrorFallbackComponent
                      error={error}
                      resetErrorBoundary={resetErrorBoundary}
                      context={{
                        origin: "JsonObjectEditFormDialog",
                        objectType: "root_editor",
                        rootLessListKey: "ROOT",
                        currentValue: formState,
                        formikValues: formik.values,
                        rawJzodSchema: entityDefinitionJzodSchema,
                        localResolvedElementJzodSchemaBasedOnValue:
                          resolvedJzodSchemaForFormik?.status == "ok"
                            ? (resolvedJzodSchemaForFormik as any).resolvedSchema
                            : undefined,
                      }}
                    />
                  )}
                >
                  {resolvedJzodSchemaForFormik?.status == "ok" ? (
                    <JzodElementEditor
                      name={"ROOT"}
                      listKey={"ROOT"}
                      rootLessListKey=""
                      rootLessListKeyArray={[]}
                      labelElement={labelElement}
                      currentDeploymentUuid={currentDeploymentUuid}
                      currentApplicationSection={currentApplicationSection}
                      // rawJzodSchema={entityDefinitionJzodSchema}
                      // localRootLessListKeyMap={{}}
                      resolvedElementJzodSchema={
                        resolvedJzodSchemaForFormik?.status == "ok"
                          ? (resolvedJzodSchemaForFormik as any).resolvedSchema
                          : undefined
                      }
                      hasTypeError={resolvedJzodSchemaForFormik?.status !== "ok"}
                      typeCheckKeyMap={
                        resolvedJzodSchemaForFormik?.status == "ok"
                          ? (resolvedJzodSchemaForFormik as any).keyMap
                          : {}
                      }
                      foreignKeyObjects={foreignKeyObjects}
                      foldedObjectAttributeOrArrayItems={foldedObjectAttributeOrArrayItems}
                      setFoldedObjectAttributeOrArrayItems={setFoldedObjectAttributeOrArrayItems}
                      indentLevel={0}
                      submitButton={
                        <button type="submit" name={label} form={"form." + label}>
                          submit form.{label}
                        </button>
                      }
                    />
                  ) : (
                    <div>
                      <span style={{ color: "red" }}>
                        Error in Jzod schema resolution:{" "}
                        {/* {resolvedJzodSchemaForFormik?.error || "Unknown error"} */}
                        <pre>{JSON.stringify(resolvedJzodSchemaForFormik, null, 2)}</pre>
                      </span>
                    </div>
                  )}
                </ErrorBoundary>
              </span>
            </form>
          </Dialog>
        );
      }}
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
  const domainController: DomainControllerInterface = useDomainControllerService();

  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
  // const [dialogOuterFormObject, setdialogOuterFormObject] = useState({});
  // const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

  const formIsOpen = addObjectdialogFormIsOpen || (!showButton && props.isOpen);

  // We'll pass a simple validation that the dialog is ready, actual resolution happens in Formik
  const resolvedJzodSchema = useMemo(() => {
    if (
      context.miroirFundamentalJzodSchema &&
      entityDefinitionJzodSchema &&
      defaultFormValuesObject &&
      dialogOuterFormObject &&
      currentAppModel
    ) {
      return { status: "ok", keyMap: {} }; // Simplified - actual resolution in Formik
    }
    return undefined;
  }, [
    context.miroirFundamentalJzodSchema,
    entityDefinitionJzodSchema,
    defaultFormValuesObject,
    dialogOuterFormObject,
    currentAppModel,
  ]);

  if (!resolvedJzodSchema) {
    log.error(
      "JsonObjectEditFormDialog prerequisites not met",
      // "defaultFormValuesObject", defaultFormValuesObject,
      "entityDefinitionJzodSchema", entityDefinitionJzodSchema,
      "dialogOuterFormObject", dialogOuterFormObject
    );
    return (
      <div>
        Prerequisites not met for JsonObjectEditFormDialog:
        <ul>
          <li>miroirFundamentalJzodSchema: {context.miroirFundamentalJzodSchema ? "✓" : "✗"}</li>
          <li>entityDefinitionJzodSchema: {entityDefinitionJzodSchema ? "✓" : "✗"}</li>
          <li>defaultFormValuesObject: {defaultFormValuesObject ? "✓" : "✗"}</li>
          <li>dialogOuterFormObject: {dialogOuterFormObject ? "✓" : "✗"}</li>
          <li>currentAppModel: {currentAppModel ? "✓" : "✗"}</li>
        </ul>
      </div>
    );
  }

  // ##############################################################################################
  // Equivalent to onEditFormObject from ReportSectionEntityInstance
  const onEditFormObject = useCallback(
    async (data: any) => {
      log.info(
        "JsonObjectEditFormDialog onEditFormObject called with new object value",
        data,
        "currentDeploymentUuid",
        currentDeploymentUuid,
        "currentApplicationSection",
        currentApplicationSection
      );

      if (!currentDeploymentUuid) { // TODO: do not throw, use snackbar mechanism
        throw new Error(
          "JsonObjectEditFormDialog onEditFormObject currentDeploymentUuid is undefined."
        );
      }
      if (!currentApplicationSection) { // TODO: do not throw, use snackbar mechanism
        throw new Error(
          "JsonObjectEditFormDialog onEditFormObject currentApplicationSection is undefined."
        );
      }
      if (currentDeploymentUuid == selfApplicationDeploymentMiroir.uuid || currentApplicationSection == "model") {
        await domainController.handleAction(
          {
            actionType: "transactionalInstanceAction",
            instanceAction: {
              actionType: "updateInstance",
              deploymentUuid: currentDeploymentUuid,
              endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
              payload: {
                applicationSection: "model",
                includeInTransaction: true, // not used
                objects: [
                  {
                    parentName: data.name,
                    parentUuid: data.parentUuid,
                    applicationSection: currentApplicationSection,
                    instances: [data],
                  },
                ],
              },
            },
          },
          currentAppModel
        );
      } else {
        const updateAction: InstanceAction = {
          actionType: "updateInstance",
          deploymentUuid: currentDeploymentUuid,
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            applicationSection: currentApplicationSection ? currentApplicationSection : "data",
            objects: [
              {
                parentName: data.name,
                parentUuid: data.parentUuid,
                applicationSection: currentApplicationSection ? currentApplicationSection : "data",
                instances: [data],
              },
            ],
          },
        };
        await domainController.handleAction(updateAction);
      }
    },
    [domainController, currentDeploymentUuid, currentApplicationSection, currentAppModel]
  );

  // ##############################################################################################
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

      const effectiveData = source == "param" && data ? data : dialogOuterFormObject;
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
      
      try {
        // Call the actual domain controller action to save the data
        await onEditFormObject(newVersion);
        
        // Also call the original onSubmit callback for any additional handling
        result = onSubmit(newVersion);
        
        handleAddObjectDialogFormClose("");
      } catch (error) {
        log.error("Error in handleAddObjectDialogFormSubmit:", error);
        throw error;
      }
      
      return result;
    },
    [onEditFormObject, onSubmit, dialogOuterFormObject, handleAddObjectDialogFormClose]
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
          handleAddObjectDialogFormSubmit={handleAddObjectDialogFormSubmit}
          handleAddObjectDialogFormClose={handleAddObjectDialogFormClose}
          formIsOpen={formIsOpen}
          onCreateFormObject={onCreateFormObject}
          onEditFormObject={onEditFormObject}
          onSubmit={onSubmit}
          currentDeploymentUuid={currentDeploymentUuid}
          currentApplicationSection={currentApplicationSection}
          entityDefinitionJzodSchema={entityDefinitionJzodSchema}
          resolvedJzodSchema={resolvedJzodSchema}
          foreignKeyObjects={foreignKeyObjects}
          currentAppModel={currentAppModel}
          currentMiroirModel={currentMiroirModel}
          miroirFundamentalJzodSchema={context.miroirFundamentalJzodSchema}
          count={count}
        />
      ) : (
        <></>
      )}
    </div>
  );
}
