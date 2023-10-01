import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { List, ListItem } from '@mui/material';
import Box from '@mui/material/Box';
import { Params, useParams } from 'react-router-dom';

import { JzodElement } from '@miroir-framework/jzod-ts';
import {
  ApplicationDeployment,
  ApplicationSection,
  EntityDefinition,
  EntityInstancesUuidIndex,
  MetaEntity,
  MiroirApplicationModel,
  MiroirSelectorSingleQueryParams,
  Report,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel
} from "miroir-core";

import { ReduxStateWithUndoRedo, selectModelForDeployment } from "miroir-redux";

import {
  useErrorLogService
} from "../../../miroir-fwk/4_view/MiroirContextReactProvider";


import { JzodEnumSchemaToJzodElementResolver, getCurrentEnumJzodSchemaResolver } from '../../JzodTools';
import { EntityInstanceLink } from '../EntityInstanceLink';
import { JzodElementDisplay } from '../JzodElementDisplay';
import {
  EntityInstanceUuidIndexSelectorParams,
  useCurrentModel,
  useEntityInstanceUuidIndexFromLocalCache,
} from "../ReduxHooks";

import entityBook from "../../../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";

export type EntityInstanceUrlParamKeys = 'deploymentUuid' | 'applicationSection' | 'entityUuid' | 'instanceUuid';


// ###############################################################################################################
export const EntityInstancePage = () => {
  const params = useParams<EntityInstanceUrlParamKeys>();
  console.log('ReportPage params',params);
  
  // const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  // const domainController: DomainControllerInterface = useDomainControllerService();
  const errorLog = useErrorLogService();
  
  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];


  // const currentModelSelectorParams:EntityInstanceUuidIndexSelectorParams = useMemo(
  const currentModelSelectorParams:MiroirSelectorSingleQueryParams = useMemo(
    () => ({
      type: "DomainEntityInstancesSelectorParams",
      definition: {
        deploymentUuid: applicationDeploymentLibrary.uuid,
      }
    } as MiroirSelectorSingleQueryParams),
    [applicationDeploymentLibrary.uuid]
  );

  const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
  const libraryAppModel: MiroirApplicationModel = useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, currentModelSelectorParams)
  ) as MiroirApplicationModel;

  // computing current state #####################################################################
  const displayedDeploymentDefinition: ApplicationDeployment | undefined = deployments.find(
    (d) => d.uuid == params.deploymentUuid
  );
  console.log("ReportPage displayedDeploymentDefinition", displayedDeploymentDefinition);
  const currentReportDefinitionDeployment: ApplicationDeployment | undefined =
    displayedDeploymentDefinition?.applicationModelLevel == "metamodel" || params.applicationSection == "model"
      ? (applicationDeploymentMiroir as ApplicationDeployment)
      : displayedDeploymentDefinition;
  const currentModel =
    params.deploymentUuid == applicationDeploymentLibrary.uuid ? libraryAppModel : defaultMiroirMetaModel;
  const currentReportDefinitionApplicationSection: ApplicationSection | undefined =
    currentReportDefinitionDeployment?.applicationModelLevel == "metamodel" ? "data" : "model";
  console.log(
    "ReportPage currentReportDefinitionDeployment",
    currentReportDefinitionDeployment,
    "currentReportDefinitionApplicationSection",
    currentReportDefinitionApplicationSection
  );

  const deploymentReports: Report[] = currentModel.reports;
  const currentReportDeploymentSectionEntities: MetaEntity[] = currentModel.entities; // Entities are always defined in the 'model' section
  const currentReportDeploymentSectionEntityDefinitions: EntityDefinition[] = currentModel.entityDefinitions; // EntityDefinitions are always defined in the 'model' section

  console.log("EntityInstancePage currentReportDeploymentSectionEntities", currentReportDeploymentSectionEntities);

  const currentReportTargetEntity: MetaEntity | undefined = currentReportDeploymentSectionEntities?.find(
    (e) => e?.uuid === params.entityUuid
  );
  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);

  const entityJzodSchemaDefinition: { [attributeName: string]: JzodElement } | undefined =
    currentReportTargetEntityDefinition?.jzodSchema.definition;

  const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
    {
      type: "DomainEntityInstancesSelectorParams",
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
      type: "DomainEntityInstancesSelectorParams",
      definition: {
        deploymentUuid: params.deploymentUuid,
        applicationSection: params.applicationSection as ApplicationSection,
        entityUuid: entityBook.uuid,
      }
    }
  );

  const currentMiroirModel = useCurrentModel(applicationDeploymentMiroir.uuid);

  // const currentEnumJzodSchemaResolver: JzodElementRecord = useMemo(
  //   // () => getCurrentEnumJzodSchemaResolver(currentMiroirModel,currentReportTargetEntityDefinition?.jzodSchema??{type:"object", definition:{}}),
  //   () => getCurrentEnumJzodSchemaResolver(currentMiroirModel),
  //   [currentMiroirModel]
  // );
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

  console.log('EntityInstancePage publisherBooks',publisherBooks,'authorBooks',authorBooks);

  console.log('EntityInstancePage instance',instance);
  console.log('EntityInstancePage entityJzodSchema',entityJzodSchemaDefinition);
  
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
                  instanceUuid={params.instanceUuid}
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
