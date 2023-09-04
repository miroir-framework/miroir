import Box from '@mui/material/Box';
import {
  ApplicationDeployment,
  ApplicationSection,
  DomainControllerInterface,
  EntityDefinition,
  EntityInstancesUuidIndex,
  MetaEntity,
  MiroirApplicationModel,
  Report,
  applicationDeploymentMiroir,
  defaultMiroirMetaModel
} from "miroir-core";
import {
  useDomainControllerService, useErrorLogService,
  useLocalCacheTransactions
} from "miroir-fwk/4_view/MiroirContextReactProvider";
import { LocalCacheInputSelectorParams, ReduxStateChanges, ReduxStateWithUndoRedo, selectModelForDeployment } from "miroir-redux";
import { Params, useParams } from 'react-router-dom';


import { List, ListItem } from '@mui/material';
import { ReportSectionListDisplay } from '../ReportSectionListDisplay';
import { getColumnDefinitionsFromEntityDefinitionJzodObjectSchema } from '../getColumnDefinitionsFromEntityAttributes';

import { JzodElement, JzodObject } from '@miroir-framework/jzod-ts';
import entityBook from "miroir-standalone-app/src/assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import { EntityInstanceLink } from '../EntityInstanceLink';
import {
  useCurrentModel,
  useEntityInstanceUuidIndexFromLocalCache,
} from "../ReduxHooks";
import { useSelector } from 'react-redux';
import { useCallback, useMemo, useState } from 'react';
import { JzodObjectDisplay } from '../JzodElementDisplay';
import { resolveJzodSchemaReference } from '../JzodElementEditor';

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

export interface ReportPageProps {
  // deploymentUuid: Uuid,
  // store:any;
  // reportName: string;
}

export type EntityInstanceUrlParamKeys = 'deploymentUuid' | 'applicationSection' | 'entityUuid' | 'instanceUuid';


// ###############################################################################################################
export const EntityInstancePage = (props: ReportPageProps) => {
  const params = useParams<any>() as Readonly<Params<EntityInstanceUrlParamKeys>>;
  // const params = useParams<ReportUrlParams>();
  console.log('ReportPage params',params);
  
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
      deploymentUuid: params.deploymentUuid,
      applicationSection: params.applicationSection as ApplicationSection,
      entityUuid: params.entityUuid,
    }
  );

  const instance:any = instancesToDisplayUuidIndex && params.instanceUuid?instancesToDisplayUuidIndex[params.instanceUuid]:undefined;

  const booksUuidIndex: EntityInstancesUuidIndex | undefined = useEntityInstanceUuidIndexFromLocalCache(
    {
      deploymentUuid: params.deploymentUuid,
      applicationSection: params.applicationSection as ApplicationSection,
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
                <JzodObjectDisplay
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
