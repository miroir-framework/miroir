import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { JzodElement } from '@miroir-framework/jzod-ts';
import {
  ApplicationDeployment,
  ApplicationSection,
  EntityDefinition,
  MetaEntity,
  MiroirApplicationModel,
  LocalCacheQueryParams,
  Uuid,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";
import { ReduxStateWithUndoRedo, selectModelForDeployment } from "miroir-localcache-redux";

import {
  useErrorLogService
} from "../../miroir-fwk/4_view/MiroirContextReactProvider";


import { JzodEnumSchemaToJzodElementResolver, getCurrentEnumJzodSchemaResolver } from '../JzodTools';
import { JzodElementDisplay } from './JzodElementDisplay';
import {
  useCurrentModel
} from "./ReduxHooks";
import { packageName } from '../../constants';
import { cleanLevel } from './constants';

const loggerName: string = getLoggerName(packageName, cleanLevel,"ReportSectionEntityInstance");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export interface ReportSectionEntityInstanceProps {
  instance?: any,
  fetchedData?: Record<string,any>,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  entityUuid: Uuid,
}



// ###############################################################################################################
export const ReportSectionEntityInstance = (props: ReportSectionEntityInstanceProps) => {
  const errorLog = useErrorLogService();
  
  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];

  const currentModelSelectorParams:LocalCacheQueryParams = useMemo(
    () => ({
      type: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid: applicationDeploymentLibrary.uuid,
      }
    } as LocalCacheQueryParams),
    [applicationDeploymentLibrary.uuid]
  );

  const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
  const libraryAppModel: MiroirApplicationModel = useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, currentModelSelectorParams)
  ) as MiroirApplicationModel;

  // computing current state #####################################################################
  const displayedDeploymentDefinition: ApplicationDeployment | undefined = deployments.find(
    (d) => d.uuid == props.deploymentUuid
  );
  log.log("ReportPage displayedDeploymentDefinition", displayedDeploymentDefinition);
  const currentReportDefinitionDeployment: ApplicationDeployment | undefined =
    displayedDeploymentDefinition?.applicationModelLevel == "metamodel" || props.applicationSection == "model"
      ? (applicationDeploymentMiroir as ApplicationDeployment)
      : displayedDeploymentDefinition;
  const currentModel =
    props.deploymentUuid == applicationDeploymentLibrary.uuid ? libraryAppModel : defaultMiroirMetaModel;
  
  const currentReportDefinitionApplicationSection: ApplicationSection | undefined =
    currentReportDefinitionDeployment?.applicationModelLevel == "metamodel" ? "data" : "model";
  log.log(
    "ReportPage currentReportDefinitionDeployment",
    currentReportDefinitionDeployment,
    "currentReportDefinitionApplicationSection",
    currentReportDefinitionApplicationSection
  );

  const currentReportDeploymentSectionEntities: MetaEntity[] = currentModel.entities; // Entities are always defined in the 'model' section
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] = currentModel.entityDefinitions; // EntityDefinitions are always defined in the 'model' section

  log.log("ReportSectionEntityInstance currentReportDeploymentSectionEntities", currentReportDeploymentSectionEntities);


  const currentReportTargetEntity: MetaEntity | undefined = currentReportDeploymentSectionEntities?.find(
      (e) => e?.uuid === props.entityUuid
    );

  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);

  const entityJzodSchemaDefinition: { [attributeName: string]: JzodElement } | undefined =
    currentReportTargetEntityDefinition?.jzodSchema.definition;

  const instance:any = props.instance;

  const currentMiroirModel = useCurrentModel(applicationDeploymentMiroir.uuid);

  const currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver = useMemo(
    () => getCurrentEnumJzodSchemaResolver(currentMiroirModel),
    [currentMiroirModel]
  );

  log.log('ReportSectionEntityInstance instance',instance);
  log.log('ReportSectionEntityInstance entityJzodSchema',entityJzodSchemaDefinition);
  
  if (instance) {
    return (
      <div> 
        <p>
        ReportSectionEntityInstance
        </p>
        <span>
          Entity Instance Attribute Values:
        </span>
          {
            currentReportTargetEntity && currentReportTargetEntityDefinition && props.applicationSection?
              <div>
                <JzodElementDisplay
                  path={instance?.name}
                  name={instance?.name}
                  deploymentUuid={props.deploymentUuid}
                  applicationSection={props.applicationSection as ApplicationSection}
                  entityUuid={props.entityUuid}
                  element={instance}
                  rootJzodSchema={currentReportTargetEntityDefinition?.jzodSchema}
                  elementJzodSchema={currentReportTargetEntityDefinition?.jzodSchema}
                  currentReportDeploymentSectionEntities={currentReportDeploymentSectionEntities}
                  currentEnumJzodSchemaResolver={currentEnumJzodSchemaResolver}
                ></JzodElementDisplay>
              </div>
            :
            <div>Oops.</div>
          }
      </div>
    );
  } else {
    return (
      <>
        Invalid parameters!
      </>
    )
  }
};
