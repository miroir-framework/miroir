import { useMemo } from 'react';

import {
  ApplicationSection,
  Entity,
  EntityDefinition,
  EntityInstance,
  JzodElement,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Uuid,
  adminConfigurationDeploymentMiroir,
  resolveReferencesForJzodSchemaAndValueObject
} from "miroir-core";

import {
  useErrorLogService, useMiroirContextService
} from "../MiroirContextReactProvider.js";

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



// ###############################################################################################################
export const ReportSectionEntityInstance = (props: ReportSectionEntityInstanceProps) => {
  const errorLog = useErrorLogService();
  const context = useMiroirContextService();

  log.info(
    "++++++++++++++++++++++++++++++++ render with props",
    props
  );

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
    () => context.miroirFundamentalJzodSchema? getCurrentEnumJzodSchemaResolver(currentMiroirModel,context.miroirFundamentalJzodSchema): undefined,
    [context.miroirFundamentalJzodSchema, currentMiroirModel]
  );

  log.info("ReportSectionEntityInstance instance", instance);
  log.info("ReportSectionEntityInstance entityJzodSchema", entityJzodSchemaDefinition);

  const resolvedJzodSchema = useMemo(
    () => context.miroirFundamentalJzodSchema &&
    currentReportTargetEntityDefinition?.jzodSchema &&
    instance &&
    currentModel ?
    resolveReferencesForJzodSchemaAndValueObject(
      context.miroirFundamentalJzodSchema,
      currentReportTargetEntityDefinition?.jzodSchema,
      instance,
      currentModel,
      currentMiroirModel,
      {}
    ): undefined,
    [props]
  )

  if (instance) {
    return (
      <div>
        {/* <p>
        ReportSectionEntityInstance
        </p> */}
        <h1>
          {currentReportTargetEntity?.name} details: {instance.name}
        </h1>
        {
          currentReportTargetEntity 
          && currentEnumJzodSchemaResolver
          && currentReportTargetEntityDefinition 
          && context.applicationSection
          && resolvedJzodSchema?.status == "ok"? (
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
              resolvedElementJzodSchema={resolvedJzodSchema.element}
              currentReportDeploymentSectionEntities={currentReportDeploymentSectionEntities}
              currentEnumJzodSchemaResolver={currentEnumJzodSchemaResolver}
            ></JzodElementDisplay>
          </div>
        ) : (
          <div>
            Oops, ReportSectionEntityInstance could not be displayed.
            <p/>
            <div>props selfApplication section: {props.applicationSection}</div>
            <div>context selfApplication section: {context.applicationSection}</div>
            <div>target entity: {currentReportTargetEntity?.name ?? "report target entity not found!"}</div>
            <div>resolved entity: {JSON.stringify(resolvedJzodSchema)}</div>
            <div>
              target entity definition:{" "}
              {currentReportTargetEntityDefinition?.name ?? "report target entity definition not found!"}
            </div>
          </div>
        )}
      </div>
    );
  } else {
    return <>ReportSectionEntityInstance: No instance to display!</>;
  }
};
