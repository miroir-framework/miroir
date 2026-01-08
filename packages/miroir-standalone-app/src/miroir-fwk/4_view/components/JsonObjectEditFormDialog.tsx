import _ from "lodash";

import { Dialog, DialogTitle, Paper } from "@mui/material";
import { styled } from "@mui/material/styles"; // For MUI v5
import { useCallback, useEffect, useMemo, useState } from "react";

import { Formik, FormikProps, FormikHelpers, useFormikContext } from "formik";
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
  defaultMetaModelEnvironment,
  entityDefinitionReport,
  getDefaultValueForJzodSchemaWithResolutionNonHook,
  jzodTypeCheck,
  selfApplicationDeploymentMiroir,
  type ApplicationDeploymentMap,
  type DeploymentUuidToReportsEntitiesDefinitions,
  type EntityDefinition,
  type Report
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
import ReportSectionViewWithEditor from "./Reports/ReportSectionViewWithEditor.js";
import { reportSectionsFormSchema, reportSectionsFormValue } from "./Reports/ReportTools.js";
import { ThemedOnScreenDebug } from "./Themes/BasicComponents.js";
import type { ValueObjectEditMode } from "./Reports/ReportSectionEntityInstance.js";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JsonObjectEditFormDialog"), "UI"
).then((logger: LoggerInterface) => {log = logger});


// #################################################################################################
export type JsonObjectEditFormDialogInputs = { [a: string]: any };

export interface EditorAttribute {
  attribute: EntityAttribute;
  value: any;
}

export interface JsonObjectFormEditorCoreDialogProps {
  valueObjectEditMode: ValueObjectEditMode,
  label?: string,
  isAttributes?: boolean,
  entityDefinition: EntityDefinition,
  entityDefinitionJzodSchema: JzodObject,
  defaultFormValuesObject: any,
  currentApplication: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
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
  valueObjectEditMode: ValueObjectEditMode,
  label?: string;
  count: number;
  formState: any; // TODO: is it still used?
  defaultFormValuesObject: any,
  currentApplication: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap,
  currentDeploymentUuid?: Uuid;
  currentApplicationSection?: ApplicationSection;
  entityDefinition: EntityDefinition;
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
  setAddObjectdialogFormIsOpen: (a:boolean) => void,
  // onSubmit: (data: JsonObjectEditFormDialogInputs) => void;
}

// ################################################################################################
const JsonElementEditorDialog: React.FC<JsonElementEditorDialogProps> = ({
  label,
  count,
  formState,
  defaultFormValuesObject,
  // setformHelperState,
  // dialog: open and close dialog, collect result
  currentDeploymentUuid,
  currentApplicationSection,
  entityDefinition,
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
  // onSubmit,
  ...props
}) => {
  // Add state for folded object attributes/array items
  const context = useMiroirContextService();

  // const formikEditedInstancePath = "formikEditedInstancePath";
  const formikReportDefinitionPath = "formikReportDefinitionPath";
  const reportSectionPath: (string | number)[] = ["definition", "section", "definition", 0];
  const currentDeploymentReportsEntitiesDefinitionsMapping:DeploymentUuidToReportsEntitiesDefinitions | undefined  =
    // context.deploymentUuidToReportsEntitiesDefinitionsMapping[context.deploymentUuid] || {};
    context.deploymentUuidToReportsEntitiesDefinitionsMapping[currentDeploymentUuid??""] || {};

  const currentModel: MetaModel = currentAppModel;

  // const entityDefinitionLendingHistoryItem: EntityDefinition = {
  //   uuid: "ce054a0c-5c45-4e2b-a1a9-07e3e5dc8505",
  //   parentName: "EntityDefinition",
  //   parentUuid: "54b9c72f-d4f3-4db9-9e0e-0dc840b530bd",
  //   parentDefinitionVersionUuid: "c50240e7-c451-46c2-b60a-07b3172a5ef9",
  //   name: "LendingHistoryItem",
  //   entityUuid: "e81078f3-2de7-4301-bd79-d3a156aec149",
  //   defaultInstanceDetailsReportUuid: "7ccc9ac5-d29d-4b5b-a9ec-841bea152e2c",
  //   jzodSchema: {
  //     type: "object",
  //     definition: {
  //       uuid: {
  //         type: "uuid",
  //         tag: {
  //           value: {
  //             id: 1,
  //             defaultLabel: "Uuid",
  //             editable: false,
  //           },
  //         },
  //       },
  //       parentName: {
  //         type: "string",
  //         optional: true,
  //         tag: {
  //           value: {
  //             id: 2,
  //             defaultLabel: "Entity Name",
  //             editable: false,
  //           },
  //         },
  //       },
  //       parentUuid: {
  //         type: "uuid",
  //         tag: {
  //           value: {
  //             id: 3,
  //             defaultLabel: "Entity Uuid",
  //             editable: false,
  //             initializeTo: {
  //               initializeToType: "value",
  //               value: "e81078f3-2de7-4301-bd79-d3a156aec149",
  //             },
  //           },
  //         },
  //       },
  //       parentDefinitionVersionUuid: {
  //         type: "uuid",
  //         optional: true,
  //         tag: {
  //           value: {
  //             id: 4,
  //             defaultLabel: "Entity Definition Version Uuid",
  //             editable: false,
  //           },
  //         },
  //       },
  //       // name: {
  //       //   type: "string",
  //       //   optional: true,
  //       // },
  //       user: {
  //         type: "uuid",
  //         tag: {
  //           value: {
  //             editable: false,
  //             defaultLabel: "User",
  //             selectorParams: {
  //               targetEntity: "ca794e28-b2dc-45b3-8137-00151557eea8",
  //               targetEntityOrderInstancesBy: "name",
  //             },
  //           },
  //         },
  //         optional: true,
  //       },
  //       book: {
  //         type: "uuid",
  //         tag: {
  //           value: {
  //             editable: false,
  //             defaultLabel: "Book",
  //             selectorParams: {
  //               targetEntity: "e8ba151b-d68e-4cc3-9a83-3459d309ccf5",
  //               targetEntityOrderInstancesBy: "name",
  //             },
  //           },
  //         },
  //         optional: true,
  //       },
  //       startDate: {
  //         type: "date",
  //       },
  //       endDate: {
  //         type: "date",
  //         optional: true,
  //       },
  //     },
  //   },
  //   description: "The history of book lendings",
  //   viewAttributes: ["uuid", "user", "book", "startDate", "endDate"],
  // };
  const defaultDetailsReport: Report | undefined = useMemo(() => {
    return entityDefinition.defaultInstanceDetailsReportUuid
      ? currentDeploymentReportsEntitiesDefinitionsMapping?.[currentApplicationSection??"data"]?.availableReports?.find(
          (r) => r.uuid === entityDefinition.defaultInstanceDetailsReportUuid
        )
      : undefined;
  }, [
    entityDefinition,
    currentDeploymentReportsEntitiesDefinitionsMapping,
    currentApplicationSection,
  ]);
  const formik = useFormikContext<any>()
  // ##############################################################################################
  useEffect(() => {
    formik.setValues(
      {
        ...formik.values,
        [reportSectionPath.join("_")]: defaultFormValuesObject,
        formikReportDefinitionPath: defaultDetailsReport,
      }
    );
  }, [defaultFormValuesObject]);


  // ##############################################################################################
  const formValueMLSchema: JzodObject = useMemo(() => {
    // if (!currentDeploymentUuid || !entityDefinitionReport?.entityUuid) {
    //   return { type: "object", definition: {} };
    // }
    const r = currentDeploymentUuid?reportSectionsFormSchema(
      (defaultDetailsReport as any)?.definition?.section?.definition[0],
      currentDeploymentUuid,
      currentDeploymentReportsEntitiesDefinitionsMapping,
      currentModel,
      {
        ...formik.values,
        [reportSectionPath.join("_")]: defaultFormValuesObject,
        formikReportDefinitionPath: defaultDetailsReport,
      },
      // initialReportSectionsFormValue,
      // [formikEditedInstancePath]
      reportSectionPath
    )
     : { };
    const result: JzodObject = {
      type: "object",
      definition: {
        ...r,
        [formikReportDefinitionPath]: entityDefinitionReport.jzodSchema,
      },
    };
    // log.info(
    //   "############################################## computing formValueMLSchema",
    //   "formValueMLSchema",
    //   result,
    //   []
    // );
    return result;
  }, [
    currentDeploymentReportsEntitiesDefinitionsMapping,
  ]);

  return (
    <Dialog onClose={handleAddObjectDialogFormClose} open={formIsOpen} fullScreen>
      <DialogTitle>{label} add / edit Element</DialogTitle>
      <div>
        <ThemedOnScreenDebug
          label={"JsonObjectEditFormDialog formValueMLSchema"}
          data={formValueMLSchema}
          initiallyUnfolded={false}
        />
        {/* <ThemedOnScreenDebug
          label={"JsonObjectEditFormDialog initialReportSectionsFormValue"}
          data={initialReportSectionsFormValue}
        /> */}
        <ThemedOnScreenDebug
          label={"JsonObjectEditFormDialog formik.values"}
          data={formik.values}
          initiallyUnfolded={false}
        />
      </div>
      <span>
        form: {"form." + label}, JsonObjectEditFormDialog count {count}
      </span>
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
              }}
            />
          )}
        >
          {currentApplicationSection && currentDeploymentUuid && (
            <ReportSectionViewWithEditor
              valueObjectEditMode={props.valueObjectEditMode}
              applicationSection={currentApplicationSection}
              application={props.currentApplication}
              applicationDeploymentMap={props.applicationDeploymentMap}
              deploymentUuid={currentDeploymentUuid}
              generalEditMode={true}
              paramsAsdomainElements={{}}
              isOutlineOpen={false} // no connection to outline context here
              onToggleOutline={() => {}}
              // data
              reportDataDEFUNCT={{} as any}
              fetchedDataJzodSchemaDEFUNCT={{} as any}
              //
              reportSectionDEFUNCT={{} as any} // TODO: defunct, must use formik[reportName]?.definition.section
              reportDefinitionDEFUNCT={{} as any}
              formValueMLSchema={formValueMLSchema}
              formikReportDefinitionPathString={formikReportDefinitionPath}
              reportSectionPath={reportSectionPath}
              reportName="reportName"
              // 
              setAddObjectdialogFormIsOpen={props.setAddObjectdialogFormIsOpen}
            />
          )}
        </ErrorBoundary>
      </span>
    </Dialog>
  );
      // }
    // }
    // </Formik>
  // );
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
    "##################################### rendering JsonObjectEditFormDialog",
    "label",
    label,
    "aggregate",
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

      // if (!currentDeploymentUuid) { // TODO: do not throw, use snackbar mechanism
      //   throw new Error(
      //     "JsonObjectEditFormDialog onEditFormObject currentDeploymentUuid is undefined."
      //   );
      // }
      // if (!currentApplicationSection) { // TODO: do not throw, use snackbar mechanism
      //   throw new Error(
      //     "JsonObjectEditFormDialog onEditFormObject currentApplicationSection is undefined."
      //   );
      // }
      // if (currentDeploymentUuid == selfApplicationDeploymentMiroir.uuid || currentApplicationSection == "model") {
      //   await domainController.handleAction(
      //     {
      //       actionType: "transactionalInstanceAction",
      //       deploymentUuid: currentDeploymentUuid,
      //       instanceAction: {
      //         actionType: "updateInstance",
      //         deploymentUuid: currentDeploymentUuid,
      //         endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      //         payload: {
      //           applicationSection: "model",
      //           includeInTransaction: true, // not used
      //           objects: [
      //             {
      //               parentName: data.name,
      //               parentUuid: data.parentUuid,
      //               applicationSection: currentApplicationSection,
      //               instances: [data],
      //             },
      //           ],
      //         },
      //       },
      //     },
      //     defaultMetaModelEnvironment
      //   );
      // } else {
      //   const updateAction: InstanceAction = {
      //     actionType: "updateInstance",
      //     deploymentUuid: currentDeploymentUuid,
      //     endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
      //     payload: {
      //       applicationSection: currentApplicationSection ? currentApplicationSection : "data",
      //       objects: [
      //         {
      //           parentName: data.name,
      //           parentUuid: data.parentUuid,
      //           applicationSection: currentApplicationSection ? currentApplicationSection : "data",
      //           instances: [data],
      //         },
      //       ],
      //     },
      //   };
      //   await domainController.handleAction(updateAction);
      // }
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

  // ##############################################################################################
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
          defaultFormValuesObject={defaultFormValuesObject}
          setdialogOuterFormObject={setdialogOuterFormObject}
          handleAddObjectDialogFormSubmit={handleAddObjectDialogFormSubmit}
          handleAddObjectDialogFormClose={handleAddObjectDialogFormClose}
          onCreateFormObject={onCreateFormObject}
          onEditFormObject={onEditFormObject}
          // onSubmit={onSubmit}
          currentApplication={props.currentApplication}
          applicationDeploymentMap={props.applicationDeploymentMap}
          currentDeploymentUuid={currentDeploymentUuid}
          currentApplicationSection={currentApplicationSection}
          entityDefinition={props.entityDefinition}
          entityDefinitionJzodSchema={entityDefinitionJzodSchema}
          resolvedJzodSchema={resolvedJzodSchema}
          foreignKeyObjects={foreignKeyObjects}
          currentAppModel={currentAppModel}
          currentMiroirModel={currentMiroirModel}
          miroirFundamentalJzodSchema={context.miroirFundamentalJzodSchema}
          count={count}
          formIsOpen={formIsOpen}
          setAddObjectdialogFormIsOpen={setAddObjectdialogFormIsOpen}
          valueObjectEditMode={props.valueObjectEditMode}
        />
      ) : (
        <></>
      )}
    </div>
  );
}
