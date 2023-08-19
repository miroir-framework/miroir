import Box from '@mui/material/Box';
import {
  ApplicationDeployment,
  ApplicationSection,
  EntityDefinition,
  EntityInstancesUuidIndex,
  MetaEntity,
  MiroirApplicationModel,
  Report,
  Uuid,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel
} from "miroir-core";
import {
  useErrorLogService
} from "miroir-fwk/4_view/MiroirContextReactProvider";
import { LocalCacheInputSelectorParams, ReduxStateWithUndoRedo, selectModelForDeployment } from "miroir-redux";


import { List, ListItem } from '@mui/material';

import { JzodElement, JzodObject } from '@miroir-framework/jzod';
import entityBook from "miroir-standalone-app/src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { EntityInstanceLink } from './EntityInstanceLink';
import { JzodObjectDisplay } from './JzodElementDisplay';
import { resolveJzodSchemaReference } from './JzodElementEditor';
import {
  useCurrentModel,
  useEntityInstanceUuidIndexFromLocalCache,
} from "./ReduxHooks";

// duplicated from server!!!!!!!!
const applicationDeploymentLibrary: ApplicationDeployment = {
  "uuid":"f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
  "parentName":"ApplicationDeployment",
  "parentUuid":"35c5608a-7678-4f07-a4ec-76fc5bc35424",
  "type":"singleNode",
  "name":"LibraryApplicationPostgresDeployment",
  "application":"5af03c98-fe5e-490b-b08f-e1230971c57f",
  "description": "The default Postgres Deployment for Application Library",
  "applicationModelLevel": "model",
  "model": {
    "location": {
      "type": "sql",
      "side":"server",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "library"
    }
  },
  "data": {
    "location": {
      "type": "sql",
      "side":"server",
      "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
      "schema": "library"
    }
  }
}

export interface ReportSectionEntityInstanceProps {
  applicationSection: ApplicationSection,
  deploymentUuid: Uuid,
  entityUuid: Uuid,
  instanceUuid: Uuid,
  // store:any;
  // reportName: string;
}

export type EntityInstanceUrlParamKeys = 'deploymentUuid' | 'applicationSection' | 'entityUuid' | 'instanceUuid';


// ###############################################################################################################
export const ReportSectionEntityInstance = (props: ReportSectionEntityInstanceProps) => {
  // const params = useParams<any>() as Readonly<Params<EntityInstanceUrlParamKeys>>;
  // const params = useParams<ReportUrlParams>();
  // console.log('ReportPage params',params);
  
  // const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  // const domainController: DomainControllerInterface = useDomainControllerService();
  const errorLog = useErrorLogService();
  
  const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];


  const currentModelSelectorParams:LocalCacheInputSelectorParams = useMemo(
    () => ({
      deploymentUuid: applicationDeploymentLibrary.uuid,
    } as LocalCacheInputSelectorParams),
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

  const instancesToDisplayUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
    {
      deploymentUuid: props.deploymentUuid,
      applicationSection: props.applicationSection as ApplicationSection,
      entityUuid: props.entityUuid,
    }
  );

  const instance:any = instancesToDisplayUuidIndex && props.instanceUuid?instancesToDisplayUuidIndex[props.instanceUuid]:undefined;

  const booksUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
    {
      deploymentUuid: props.deploymentUuid,
      applicationSection: props.applicationSection as ApplicationSection,
      entityUuid: entityBook.uuid,
    }
  );

  const currentMiroirModel = useCurrentModel(applicationDeploymentMiroir.uuid);

  const currentEnumJzodSchemaResolver:{[k:string]:JzodObject} = useMemo(()=>({
    "array": resolveJzodSchemaReference({ "type": "schemaReference", definition: { "absolutePath":"1e8dab4b-65a3-4686-922e-ce89a2d62aa9", "relativePath":"jzodArraySchema"} },currentReportTargetEntityDefinition?.jzodSchema,currentMiroirModel),
    "simpleType": resolveJzodSchemaReference({ "type": "schemaReference", definition: { "absolutePath":"1e8dab4b-65a3-4686-922e-ce89a2d62aa9", "relativePath":"jzodAttributeSchema"} },currentReportTargetEntityDefinition?.jzodSchema,currentMiroirModel),
    "enum": resolveJzodSchemaReference({ "type": "schemaReference", definition: { "absolutePath":"1e8dab4b-65a3-4686-922e-ce89a2d62aa9", "relativePath":"jzodEnumSchema"}},currentReportTargetEntityDefinition?.jzodSchema,currentMiroirModel),
    "union": resolveJzodSchemaReference({ "type": "schemaReference", definition: { "absolutePath":"1e8dab4b-65a3-4686-922e-ce89a2d62aa9", "relativePath":"jzodUnionSchema"}},currentReportTargetEntityDefinition?.jzodSchema,currentMiroirModel),
    "record": resolveJzodSchemaReference({ "type": "schemaReference", definition: { "absolutePath":"1e8dab4b-65a3-4686-922e-ce89a2d62aa9", "relativePath":"jzodRecordSchema"}},currentReportTargetEntityDefinition?.jzodSchema,currentMiroirModel),
    "object": resolveJzodSchemaReference({ "type": "schemaReference", definition: { "absolutePath":"1e8dab4b-65a3-4686-922e-ce89a2d62aa9", "relativePath":"jzodObjectSchema"}},currentReportTargetEntityDefinition?.jzodSchema,currentMiroirModel),
    "function": resolveJzodSchemaReference({ "type": "schemaReference", definition: { "absolutePath":"1e8dab4b-65a3-4686-922e-ce89a2d62aa9", "relativePath":"jzodFunctionSchema"}},currentReportTargetEntityDefinition?.jzodSchema,currentMiroirModel),
    "lazy": resolveJzodSchemaReference({ "type": "schemaReference", definition: { "absolutePath":"1e8dab4b-65a3-4686-922e-ce89a2d62aa9", "relativePath":"jzodLazySchema"}},currentReportTargetEntityDefinition?.jzodSchema,currentMiroirModel),
    "literal": resolveJzodSchemaReference({ "type": "schemaReference", definition: { "absolutePath":"1e8dab4b-65a3-4686-922e-ce89a2d62aa9", "relativePath":"jzodLiteralSchema"}},currentReportTargetEntityDefinition?.jzodSchema,currentMiroirModel),
    "schemaReference": resolveJzodSchemaReference({ "type": "schemaReference", definition: { "absolutePath":"1e8dab4b-65a3-4686-922e-ce89a2d62aa9", "relativePath":"jzodReferenceSchema"}},currentReportTargetEntityDefinition?.jzodSchema,currentMiroirModel),
  }),[currentMiroirModel])


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
  
  if (props.applicationSection && instance) {
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
            currentReportTargetEntity && currentReportTargetEntityDefinition && props.applicationSection?
              <div>
                <JzodObjectDisplay
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
                ></JzodObjectDisplay>
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
