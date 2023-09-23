import { List, ListItem } from '@mui/material';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { JzodElement } from '@miroir-framework/jzod-ts';
import {
  ApplicationDeployment,
  ApplicationSection,
  DomainEntityInstancesSelectorParams,
  EntityDefinition,
  EntityInstancesUuidIndex,
  MetaEntity,
  MiroirApplicationModel,
  MiroirSelectorParams,
  Report,
  Uuid,
  applicationDeploymentLibrary,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel
} from "miroir-core";
import { ReduxStateWithUndoRedo, selectModelForDeployment } from "miroir-redux";

import {
  useErrorLogService
} from "miroir-fwk/4_view/MiroirContextReactProvider";

import entityBook from "miroir-standalone-app/src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";

import { JzodEnumSchemaToJzodElementResolver, getCurrentEnumJzodSchemaResolver } from '../JzodTools';
import { EntityInstanceLink } from './EntityInstanceLink';
import { JzodElementDisplay } from './JzodElementDisplay';
import {
  useCurrentModel,
  useEntityInstanceUuidIndexFromLocalCache,
} from "./ReduxHooks";

export interface ReportSectionEntityInstanceProps {
  // reportSection: ReportDefinition | undefined,
  instance?: any,
  fetchedData?: Record<string,any>,
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  entityUuid: Uuid,
  instanceUuid: Uuid,
}



// ###############################################################################################################
export const ReportSectionEntityInstance = (props: ReportSectionEntityInstanceProps) => {
  // const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  // const domainController: DomainControllerInterface = useDomainControllerService();
  const errorLog = useErrorLogService();
  
  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];


  // const currentModelSelectorParams:DomainEntityInstancesSelectorParams = useMemo(
  const currentModelSelectorParams:MiroirSelectorParams = useMemo(
    () => ({
      type: "DomainEntityInstancesSelectorParams",
      definition: {
        deploymentUuid: applicationDeploymentLibrary.uuid,
      }
    // } as DomainEntityInstancesSelectorParams),
    } as MiroirSelectorParams),
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
  console.log("ReportPage displayedDeploymentDefinition", displayedDeploymentDefinition);
  const currentReportDefinitionDeployment: ApplicationDeployment | undefined =
    displayedDeploymentDefinition?.applicationModelLevel == "metamodel" || props.applicationSection == "model"
      ? (applicationDeploymentMiroir as ApplicationDeployment)
      : displayedDeploymentDefinition;
  const currentModel =
    props.deploymentUuid == applicationDeploymentLibrary.uuid ? libraryAppModel : defaultMiroirMetaModel;
  
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
      (e) => e?.uuid === props.entityUuid
    );

  const currentReportTargetEntityDefinition: EntityDefinition | undefined =
    currentReportDeploymentSectionEntityDefinitions?.find((e) => e?.entityUuid === currentReportTargetEntity?.uuid);

  const entityJzodSchemaDefinition: { [attributeName: string]: JzodElement } | undefined =
    currentReportTargetEntityDefinition?.jzodSchema.definition;

  // const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
  //   {
  //     type: "DomainEntityInstancesSelectorParams",
  //     definition: {
  //       deploymentUuid: props.deploymentUuid,
  //       applicationSection: props.applicationSection as ApplicationSection,
  //       entityUuid: props.entityUuid,
  //     }
  //   }
  // );

  // const instance:any = instancesToDisplayUuidIndex && props.instanceUuid?instancesToDisplayUuidIndex[props.instanceUuid]:undefined;
  const instance:any = props.instance;

  const currentMiroirModel = useCurrentModel(applicationDeploymentMiroir.uuid);

  const currentEnumJzodSchemaResolver: JzodEnumSchemaToJzodElementResolver = useMemo(
    () => getCurrentEnumJzodSchemaResolver(currentMiroirModel),
    [currentMiroirModel]
  );

  console.log('EntityInstancePage instance',instance);
  console.log('EntityInstancePage entityJzodSchema',entityJzodSchemaDefinition);
  
  if (instance) {
    return (
      <div> 
        {/* params:{JSON.stringify(params)}
        <p /> */}
        <p>
        ReportSectionEntityInstance
        </p>
        {/* <span>reports: {JSON.stringify(deploymentReports.map(r=>r.name))}</span>
        <p />
        <Box>
          <h3>
            erreurs: {JSON.stringify(errorLog)}
          </h3>
        </Box> */}
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
                  instanceUuid={props.instanceUuid}
                  element={instance}
                  rootJzodSchema={currentReportTargetEntityDefinition?.jzodSchema}
                  elementJzodSchema={currentReportTargetEntityDefinition?.jzodSchema}
                  currentReportDeploymentSectionEntities={currentReportDeploymentSectionEntities}
                  currentEnumJzodSchemaResolver={currentEnumJzodSchemaResolver}
                ></JzodElementDisplay>
                {/* <span>
                  Publisher Books:
                </span>
                <List sx={{ pt: 0}}>
                  {
                    publisherBooks?.map(
                      (book:any) => {
                        return (
                          <ListItem disableGutters key={book.name}>
                            <EntityInstanceLink
                              deploymentUuid={props.deploymentUuid as string}
                              applicationSection={props.applicationSection as ApplicationSection}
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
                  </List> */}
                {/* <span>
                  Author Books:
                </span>
                <List sx={{ pt: 0}}>
                  {
                    authorBooks?.map(
                      (book:any) => {
                        return (
                          <ListItem disableGutters key={book.name}>
                            <EntityInstanceLink
                              deploymentUuid={props.deploymentUuid as string}
                              applicationSection={props.applicationSection as ApplicationSection}
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
                  </List> */}
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
