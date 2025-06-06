import { useCallback, useMemo, useState } from 'react';

import {
  ApplicationSection,
  Entity,
  EntityDefinition,
  EntityInstance,
  JzodElement,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ResolvedJzodSchemaReturnType,
  Uuid,
  adminConfigurationDeploymentMiroir,
  jzodTypeCheck
} from "miroir-core";

import {
  useErrorLogService, useMiroirContextService
} from "../MiroirContextReactProvider.js";

import { javascript } from '@codemirror/lang-javascript';
import { Switch } from '@mui/material';
import ReactCodeMirror from '@uiw/react-codemirror';
import { packageName } from '../../../constants.js';
import { JzodEnumSchemaToJzodElementResolver, getCurrentEnumJzodSchemaResolver } from '../../JzodTools.js';
import { cleanLevel } from '../constants.js';
import {
  useCurrentModel
} from "../ReduxHooks.js";
import { JzodElementDisplay } from './JzodElementDisplay.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportSectionEntityInstance")
).then((logger: LoggerInterface) => {log = logger});


export interface ReportSectionEntityInstanceProps {
  instance?: EntityInstance,
  domainElement?: Record<string,any>,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  entityUuid: Uuid,
}

// const label = { inputProps: { 'aria-label': 'Color switch demo' } };


// ###############################################################################################################
export const ReportSectionEntityInstance = (props: ReportSectionEntityInstanceProps) => {
  const errorLog = useErrorLogService();
  const context = useMiroirContextService();

  log.info(
    "++++++++++++++++++++++++++++++++ render with props",
    props
  );

  const [displayAsStructuredElement, setDisplayAsStructuredElement] = useState(true);
  const [displayEditor, setDisplayEditor] = useState(true);

  const currentModel: MetaModel = useCurrentModel(
    context.applicationSection == "data" ? context.deploymentUuid : adminConfigurationDeploymentMiroir.uuid
  );

  const currentReportDeploymentSectionEntities: Entity[] = currentModel.entities; // Entities are always defined in the 'model' section
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] = currentModel.entityDefinitions; // EntityDefinitions are always defined in the 'model' section

  log.info(
    "ReportSectionEntityInstance currentReportDeploymentSectionEntities",
    currentReportDeploymentSectionEntities
  );

  const currentReportTargetEntity: Entity | undefined = currentReportDeploymentSectionEntities?.find(
    (e) => e?.uuid === props.entityUuid
  );

  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);

  const entityJzodSchemaDefinition: { [attributeName: string]: JzodElement } | undefined =
    currentReportTargetEntityDefinition?.jzodSchema.definition;

  const instance: any = props.instance;

  const currentMiroirModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);

  const currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver | undefined = useMemo(
    () =>
      context.miroirFundamentalJzodSchema
        ? getCurrentEnumJzodSchemaResolver(currentMiroirModel, context.miroirFundamentalJzodSchema)
        : undefined,
    [context.miroirFundamentalJzodSchema, currentMiroirModel]
  );

  // log.info("ReportSectionEntityInstance instance", instance);
  // log.info("ReportSectionEntityInstance entityJzodSchema", entityJzodSchemaDefinition);
  // log.info("ReportSectionEntityInstance miroirFundamentalJzodSchema", context.miroirFundamentalJzodSchema);
  // log.info("ReportSectionEntityInstance currentReportTargetEntityDefinition", currentReportTargetEntityDefinition);
  // log.info("ReportSectionEntityInstance currentModel", currentModel);
  // log.info("ReportSectionEntityInstance currentMiroirModel", currentMiroirModel);

  const resolvedJzodSchema: ResolvedJzodSchemaReturnType | undefined = useMemo(() => {
    let result: ResolvedJzodSchemaReturnType | undefined = undefined;
    try {
      result =
        context.miroirFundamentalJzodSchema &&
        currentReportTargetEntityDefinition?.jzodSchema &&
        instance &&
        currentModel
          ? jzodTypeCheck(
              currentReportTargetEntityDefinition?.jzodSchema,
              instance,
              [], // currentValuePath
              [], // currentTypePath
              context.miroirFundamentalJzodSchema,
              currentModel,
              currentMiroirModel,
              {}
            )
          : undefined;
    } catch (e) {
      log.error(
        "ReportSectionEntityInstance useMemo error",
        // JSON.stringify(e, Object.getOwnPropertyNames(e)),
        e,
        "props",
        props,
        "context",
        context
      );
      result = {
        status: "error",
        valuePath: [],
        typePath: [],
        error: JSON.stringify(e, Object.getOwnPropertyNames(e)),
      };
    }
    return result;
  }, [props, currentReportTargetEntityDefinition, instance, context]);

  const handleDisplayAsStructuredElementSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayAsStructuredElement(event.target.checked);
  };
  
  const handleDisplayEditorSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayEditor(event.target.checked);
  };
  
  const onCodeEditorChange = useCallback((values:any, viewUpdate:any) => {
    log.info('edit code received value:', values);
    // setdialogOuterFormObject(JSON.parse(values))
    log.info('edit code done');
  }, []);

  if (instance) {
    return (
      <>
        <div>
          {/* <p>
        ReportSectionEntityInstance
        </p> */}
          <div>
            <label htmlFor="displayAsStructuredElementSwitch">
              Display as structured element:
            </label>
            <Switch
              checked={displayAsStructuredElement}
              id="displayAsStructuredElementSwitch"
              onChange={handleDisplayAsStructuredElementSwitchChange}
              inputProps={{ "aria-label": "Display as structured element" }}
            />
            <label htmlFor="displayEditorSwitch">
              Display editor:
            </label>
            <Switch
              checked={displayEditor}
              id="displayEditorSwitch"
              onChange={handleDisplayEditorSwitchChange}
              inputProps={{ "aria-label": "Edit" }}
            />
          </div>
          <h1>
            {currentReportTargetEntity?.name} details: {instance.name}{" "}
          </h1>
          {currentReportTargetEntity &&
          currentEnumJzodSchemaResolver &&
          currentReportTargetEntityDefinition &&
          context.applicationSection &&
          resolvedJzodSchema &&
          (resolvedJzodSchema as any)?.status == "ok" ? (
            displayAsStructuredElement ? (
              <div>
                <JzodElementDisplay
                  path={instance?.name}
                  name={instance?.name}
                  deploymentUuid={props.deploymentUuid}
                  // prop drilling!
                  applicationSection={context.applicationSection as ApplicationSection}
                  entityUuid={props.entityUuid}
                  element={instance}
                  // rootJzodSchema={currentReportTargetEntityDefinition?.jzodSchema}
                  elementJzodSchema={currentReportTargetEntityDefinition?.jzodSchema}
                  resolvedElementJzodSchema={(resolvedJzodSchema as any)?.element}
                  currentReportDeploymentSectionEntities={currentReportDeploymentSectionEntities}
                  currentEnumJzodSchemaResolver={currentEnumJzodSchemaResolver}
                ></JzodElementDisplay>
              </div>
            ) : (
              <div>
                <pre>{JSON.stringify(instance, null, 2)}</pre>
              </div>
            )
          ) : (
            <div>
              Oops, ReportSectionEntityInstance could not be displayed.
              <p />
              <div>props selfApplication section: {props.applicationSection}</div>
              <div>context selfApplication section: {context.applicationSection}</div>
              <div>
                target entity:{" "}
                {currentReportTargetEntity?.name ?? "report target entity not found!"}
              </div>
              <div>resolved schema: {JSON.stringify(resolvedJzodSchema)}</div>
              <div style={{ whiteSpace: "pre-line" }}>
                target entity definition:{" "}
                {currentReportTargetEntityDefinition?.name ??
                  "report target entity definition not found!"}
              </div>
              <div> ######################################## </div>
              <div style={{ whiteSpace: "pre-line" }}>
                entity jzod schema: {JSON.stringify(instance?.jzodSchema)}
              </div>
            </div>
          )}
        </div>
        <div>
          {displayEditor ? (
            <div>
              <ReactCodeMirror
                value={JSON.stringify(instance, null, 2)}
                height="200px"
                extensions={[javascript({ jsx: true })]}
                onChange={onCodeEditorChange}
              />
            </div>
          ) : (
            <div>
              <pre>{JSON.stringify(resolvedJzodSchema, null, 2)}</pre>
            </div>
          )}
        </div>
      </>
    );
  } else {
    return <>ReportSectionEntityInstance: No instance to display!</>;
  }
};
