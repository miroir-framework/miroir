
import { useCallback, useMemo } from "react";


import {
  ApplicationSection,
  EntityAttribute,
  EntityInstancesUuidIndex,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Uuid,
  defaultSelfApplicationDeploymentMap,
  jzodTypeCheck,
  type ApplicationDeploymentMap,
  type MiroirModelEnvironment
} from "miroir-core";

import { packageName } from "../../../constants.js";
import { cleanLevel } from "../constants.js";
import {
  useMiroirContextInnerFormOutput,
  useMiroirContextService
} from "../MiroirContextReactProvider.js";
import { useCurrentModel, useCurrentModelEnvironment } from "../ReduxHooks.js";
import {
  ThemedDialog,
  ThemedDialogTitle,
  ThemedDialogContent,
  ThemedDialogActions,
  ThemedStyledButton,
  ThemedLabel,
  ThemedSpan,
  ThemedBox,
} from "./Themes/index.js";


let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "JsonObjectDeleteFormDialog"), "UI"
).then((logger: LoggerInterface) => {log = logger});


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
  currentApplication: Uuid,
  currentApplicationDeploymentMap: ApplicationDeploymentMap,
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
    "aggregate",
    count,
    "defaultFormValuesObject",
    props.defaultFormValuesObject,
    "entityDefinitionJzodSchema",
    props.entityDefinitionJzodSchema
  );
  const context = useMiroirContextService();

  // const currentModel: MetaModel = useCurrentModelEnvironment(
  const currentModelEnvironment: MiroirModelEnvironment = useCurrentModelEnvironment(
    props.currentApplication,
    props.currentApplicationDeploymentMap ?? defaultSelfApplicationDeploymentMap
  );
  const currentDeploymentUuid = props.currentDeploymentUuid ?? props.currentApplicationDeploymentMap[props.currentApplication];
  const currentDeploymentReportsEntitiesDefinitionsMapping =
    context.deploymentUuidToReportsEntitiesDefinitionsMapping[currentDeploymentUuid] || {};

  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
  // const [formHelperState, setformHelperState] = useMiroirContextformHelperState();

  const formIsOpen = props.deleteObjectdialogFormIsOpen || (!props.showButton && props.isOpen);

  const resolvedJzodSchema = useMemo(
    () =>
      context.miroirFundamentalJzodSchema &&
      props.entityDefinitionJzodSchema &&
      props.defaultFormValuesObject &&
      props.currentAppModel
        ? jzodTypeCheck(
            props.entityDefinitionJzodSchema,
            props.defaultFormValuesObject,
            [], // currentValuePath
            [], // currentTypePath
            currentModelEnvironment,
            {}
          )
        : undefined,
    [props, context.miroirFundamentalJzodSchema]
  );
  log.info(
    "JsonObjectDeleteFormDialog called jzodTypeCheck for valueObject",
    props.defaultFormValuesObject,
    "mlSchema",
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

  return (
    <div className="JsonObjectDeleteFormDialog">
      {props.showButton && (
        <h3>
          Show Button! (Button is no more supported by JzonsObjectFormEditorDialog, this is a bug)
        </h3>
      )}
      {props.currentDeploymentUuid &&
        props.currentApplicationSection &&
        !props.showButton &&
        props?.isOpen &&
        dialogOuterFormObject && (
          <ThemedDialog onClose={handleDeleteObjectDialogFormClose} open={formIsOpen}>
            <ThemedDialogTitle>Delete Element: {props.label}</ThemedDialogTitle>
            <ThemedDialogContent>
              <ThemedBox style={{ marginBottom: 12 }}>
                <ThemedLabel style={{ fontWeight: 500 }}>UUID:</ThemedLabel>{' '}
                <ThemedSpan style={{ wordBreak: 'break-all', marginLeft: 8 }}>
                  {dialogOuterFormObject?.uuid}
                </ThemedSpan>
              </ThemedBox>
              <ThemedBox style={{ marginBottom: 12 }}>
                <ThemedLabel style={{ fontWeight: 500 }}>Name:</ThemedLabel>{' '}
                <ThemedSpan style={{ marginLeft: 8 }}>
                  {dialogOuterFormObject?.name}
                </ThemedSpan>
              </ThemedBox>
              <ThemedBox style={{ marginTop: 16, marginBottom: 8 }}>
                <ThemedSpan style={{ fontWeight: 500, color: '#b71c1c' }}>
                  Are you sure you want to delete this object?
                </ThemedSpan>
              </ThemedBox>
            </ThemedDialogContent>
            <ThemedDialogActions>
              <ThemedStyledButton
                variant="contained"
                color="error"
                onClick={handleDeleteObjectDialogFormSubmit}
              >
                OK
              </ThemedStyledButton>
              <ThemedStyledButton
                variant="outlined"
                color="secondary"
                onClick={handleDeleteObjectDialogFormClose}
              >
                CANCEL
              </ThemedStyledButton>
            </ThemedDialogActions>
          </ThemedDialog>
        )}
    </div>
  );
}
