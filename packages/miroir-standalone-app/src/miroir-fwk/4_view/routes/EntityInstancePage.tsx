import { List, ListItem } from '@mui/material';
import Box from '@mui/material/Box';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { JzodElement } from '@miroir-framework/jzod-ts';
import {
  ApplicationDeploymentConfiguration,
  ApplicationSection,
  Entity,
  EntityDefinition,
  EntityInstancesUuidIndex,
  LocalCacheQueryParams,
  LoggerInterface,
  MetaEntity,
  MetaModel,
  MiroirLoggerFactory,
  Report,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel,
  entityBook,
  getLoggerName
} from "miroir-core";

import { ReduxStateWithUndoRedo, selectModelForDeployment } from "miroir-localcache-redux";

import {
  useErrorLogService
} from "../../../miroir-fwk/4_view/MiroirContextReactProvider";


import { packageName } from '../../../constants';
import { JzodEnumSchemaToJzodElementResolver, getCurrentEnumJzodSchemaResolver } from '../../JzodTools';
import { EntityInstanceLink } from '../EntityInstanceLink';
import { JzodElementDisplay } from '../JzodElementDisplay';
import {
  useCurrentModel,
  useEntityInstanceUuidIndexFromLocalCache
} from "../ReduxHooks";
import { cleanLevel } from '../constants';

const loggerName: string = getLoggerName(packageName, cleanLevel,"EntityInstancePage");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export type EntityInstanceUrlParamKeys = 'deploymentUuid' | 'applicationSection' | 'entityUuid' | 'instanceUuid';


// ###############################################################################################################
export const EntityInstancePage = () => {
  const params = useParams<EntityInstanceUrlParamKeys>();
  log.info('EntityInstancePage params',params);
  
  // const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  // const domainController: DomainControllerInterface = useDomainControllerService();
  const errorLog = useErrorLogService();
  
  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeploymentConfiguration[];

  // const context = useMiroirContextService();

  // const displayedReportUuid = context.reportUuid;
  // const setDisplayedReportUuid = context.setReportUuid;

  // if (displayedDeploymentDefinition == ) {
    
  // } else {
    
  // }


  // const currentModelSelectorParams:EntityInstanceUuidIndexSelectorParams = useMemo(
  const currentModelSelectorParams:LocalCacheQueryParams = useMemo(
    () => ({
      queryType: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid: applicationDeploymentLibrary.uuid,
      }
    } as LocalCacheQueryParams),
    [applicationDeploymentLibrary.uuid]
  );

  const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
  const libraryAppModel: MetaModel = useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, currentModelSelectorParams)
  ) as MetaModel;

  // computing current state #####################################################################
  const displayedDeploymentDefinition: ApplicationDeploymentConfiguration | undefined = deployments.find(
    (d) => d.uuid == params.deploymentUuid
  );
  log.info("ReportPage displayedDeploymentDefinition", displayedDeploymentDefinition);
  const currentReportDefinitionDeployment: ApplicationDeploymentConfiguration | undefined =
    displayedDeploymentDefinition?.applicationModelLevel == "metamodel" || params.applicationSection == "model"
      ? (applicationDeploymentMiroir as ApplicationDeploymentConfiguration)
      : displayedDeploymentDefinition;
  const currentModel =
    params.deploymentUuid == applicationDeploymentLibrary.uuid ? libraryAppModel : defaultMiroirMetaModel;
  const currentReportDefinitionApplicationSection: ApplicationSection | undefined =
    currentReportDefinitionDeployment?.applicationModelLevel == "metamodel" ? "data" : "model";
  log.info(
    "EntityInstancePage currentReportDefinitionDeployment",
    currentReportDefinitionDeployment,
    "currentReportDefinitionApplicationSection",
    currentReportDefinitionApplicationSection
  );

  const deploymentReports: Report[] = currentModel.reports;
  const currentReportDeploymentSectionEntities: Entity[] = currentModel.entities; // Entities are always defined in the 'model' section
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] = currentModel.entityDefinitions; // EntityDefinitions are always defined in the 'model' section

  log.info("EntityInstancePage currentReportDeploymentSectionEntities", currentReportDeploymentSectionEntities);

  const currentReportTargetEntity: Entity | undefined = currentReportDeploymentSectionEntities?.find(
    (e) => e?.uuid === params.entityUuid
  );
  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);

  const entityJzodSchemaDefinition: { [attributeName: string]: JzodElement } | undefined =
    currentReportTargetEntityDefinition?.jzodSchema.definition;

  const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
    {
      queryType: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid: params.deploymentUuid,
        applicationSection: params.applicationSection as ApplicationSection,
        entityUuid: params.entityUuid,
      }
    }
  );

  const instance:any = instancesToDisplayUuidIndex && params.instanceUuid?instancesToDisplayUuidIndex[params.instanceUuid]:undefined;

  const booksUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
    {
      queryType: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid: params.deploymentUuid,
        applicationSection: params.applicationSection as ApplicationSection,
        entityUuid: entityBook.uuid,
      }
    }
  );

  const currentMiroirModel = useCurrentModel(applicationDeploymentMiroir.uuid);
  const currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver = useMemo(
    () => getCurrentEnumJzodSchemaResolver(currentMiroirModel),
    [currentMiroirModel]
  );


  const publisherBooks = useMemo(
    () =>
      (booksUuidIndex ? Object.values(booksUuidIndex) : []).filter(
        (b: any) => b["publisher"] == (instance["publisher"] ? instance["publisher"] : instance.uuid)
      ),
    [instance, booksUuidIndex]
  );
  const authorBooks = useMemo(
    () =>
      (booksUuidIndex ? Object.values(booksUuidIndex) : []).filter(
        (b: any) => b["author"] == (instance["author"] ? instance["author"] : instance.uuid)
      ),
    [instance, booksUuidIndex]
  );

  log.info('EntityInstancePage publisherBooks',publisherBooks,'authorBooks',authorBooks);

  log.info('EntityInstancePage instance',instance);
  log.info('EntityInstancePage entityJzodSchema',entityJzodSchemaDefinition);
  
  if (params.applicationSection && instance) {
    return (
      <div> 
        {/* params:{JSON.stringify(params)}
        <p /> */}
        <span>reports: {JSON.stringify(deploymentReports.map(r=>r.name))}</span>
        <p />
        <Box>
          <h3>
            erreurs: {JSON.stringify(errorLog)}
          </h3>
  
        </Box>
        <span>
          Entity Instance Attribute Values:
        </span>
          {
            currentReportTargetEntity && currentReportTargetEntityDefinition && params.applicationSection?
              <div>
                <JzodElementDisplay
                  path={instance?.name}
                  name={instance?.name}
                  deploymentUuid={params.deploymentUuid}
                  applicationSection={params.applicationSection as ApplicationSection}
                  entityUuid={params.entityUuid}
                  element={instance}
                  rootJzodSchema={currentReportTargetEntityDefinition?.jzodSchema}
                  elementJzodSchema={currentReportTargetEntityDefinition?.jzodSchema}
                  currentReportDeploymentSectionEntities={currentReportDeploymentSectionEntities}
                  currentEnumJzodSchemaResolver={ currentEnumJzodSchemaResolver}
                ></JzodElementDisplay>
                <span>
                  Publisher Books:
                </span>
                <List sx={{ pt: 0}}>
                  {
                    publisherBooks?.map(
                      (book:any) => {
                        return (
                          <ListItem disableGutters key={book.name}>
                            <EntityInstanceLink
                              deploymentUuid={params.deploymentUuid as string}
                              applicationSection={params.applicationSection as ApplicationSection}
                              entityUuid={entityBook.uuid}
                              instanceUuid={book.uuid}
                              label={book.name}
                              key={book.uuid}
                            />
                          </ListItem>
                        )
                      }
                    )
                  }
                  </List>
                <span>
                  Author Books:
                </span>
                <List sx={{ pt: 0}}>
                  {
                    authorBooks?.map(
                      (book:any) => {
                        return (
                          <ListItem disableGutters key={book.name}>
                            <EntityInstanceLink
                              deploymentUuid={params.deploymentUuid as string}
                              applicationSection={params.applicationSection as ApplicationSection}
                              entityUuid={entityBook.uuid}
                              instanceUuid={book.uuid}
                              label={book.name}
                              key={book.uuid}
                            />
                          </ListItem>
                        )
                      }
                    )
                  }
                  </List>
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
