import { useMemo } from 'react';

import { JzodElement } from '@miroir-framework/jzod-ts';
import {
  ApplicationSection,
  Entity,
  EntityDefinition,
  EntityInstance,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  Uuid,
  applicationDeploymentMiroir,
  getLoggerName,
  resolveReferencesForJzodSchemaAndValueObject
} from "miroir-core";

import {
  useErrorLogService, useMiroirContextService
} from "../MiroirContextReactProvider";


import { packageName } from '../../../constants';
import { JzodEnumSchemaToJzodElementResolver, getCurrentEnumJzodSchemaResolver } from '../../JzodTools';
import { JzodElementDisplay } from './JzodElementDisplay';
import {
  useCurrentModel
} from "../ReduxHooks";
import { cleanLevel } from '../constants';

const loggerName: string = getLoggerName(packageName, cleanLevel,"ReportSectionEntityInstance");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

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
    "++++++++++++++++++++++++++++++++ props",
    props
  );

  const currentModel: MetaModel = useCurrentModel(
    context.applicationSection == "data" ? context.deploymentUuid : applicationDeploymentMiroir.uuid
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

  const currentMiroirModel = useCurrentModel(applicationDeploymentMiroir.uuid);

  const currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver = useMemo(
    () => getCurrentEnumJzodSchemaResolver(currentMiroirModel,context.miroirFundamentalJzodSchema),
    [currentMiroirModel]
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
              rootJzodSchema={currentReportTargetEntityDefinition?.jzodSchema}
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
            <div>props application section: {props.applicationSection}</div>
            <div>context application section: {context.applicationSection}</div>
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
