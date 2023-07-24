import { JzodAttribute } from "@miroir-framework/jzod";
import { ApplicationSection, EntityInstance } from "../0_interfaces/1_core/Instance";
import { Report, ReportSectionListDefinition } from "../0_interfaces/1_core/Report";
import { EntitiesDomainStateInstanceSelector, EntitiesDomainStateEntityInstanceArraySelector, EntitiesDomainState, DomainState, DomainStateMetaModelSelector } from "../0_interfaces/2_domain/DomainControllerInterface";
import { DomainInstanceUuidIndexToArray } from "../1_core/DomainState";
import { ApplicationDeployment } from "../0_interfaces/1_core/StorageConfiguration";

import applicationDeploymentMiroir from '../assets/miroir_data/35c5608a-7678-4f07-a4ec-76fc5bc35424/10ff36f2-50a3-48d8-b80f-e48e5d13af8e.json';
import entityEntityDefinition from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd.json';
import entityReport from '../assets/miroir_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json';
import { MiroirMetaModel } from "../0_interfaces/1_core/Model";
import { defaultMiroirMetaModel } from "../1_core/Model";
import { EntityDefinition, MetaEntity, entityEntity } from "..";

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


export function selectReportSectionInstances(reportSectionListDefinition:ReportSectionListDefinition):EntitiesDomainStateEntityInstanceArraySelector{
  return (domainState:EntitiesDomainState):EntityInstance[] => {
    // console.log('selectReportSectionInstances', reportUuid, domainState)
    // const currentReport: Report = DomainInstanceUuidIndexToArray(domainState[entityReport.uuid])?.find(e=>e['uuid'] === reportSectionListDefinition.parentUuid) as Report;
    if (reportSectionListDefinition && reportSectionListDefinition.parentUuid) {
      return DomainInstanceUuidIndexToArray(domainState[reportSectionListDefinition.parentUuid]);
    } else {
      return []
    }
  }
}

// ################################################################################################
// export function selectEntityInstances(deploymentUuid:string,parentUuid:string):EntitiesDomainStateEntityInstanceArraySelector{
export function selectEntityInstances(parentUuid:string | undefined):EntitiesDomainStateEntityInstanceArraySelector{
  return (domainState:EntitiesDomainState):EntityInstance[] => {
    // console.log('selectEntityInstances for entityUuid', parentUuid, 'existing entities:', Object.keys(domainState))
    if (parentUuid && domainState[parentUuid]) {
      // console.log('selectEntityInstances for entityUuid', parentUuid, 'existing instances:', Object.keys(domainState[parentUuid]))
      return DomainInstanceUuidIndexToArray(domainState[parentUuid]);
    } else {
      return [];
    }
  }
}

// ################################################################################################
// export function selectEntityInstances(deploymentUuid:string,parentUuid:string):EntitiesDomainStateEntityInstanceArraySelector{
export function selectCurrentDeploymentModel(
  deploymentUuid:string | undefined
):DomainStateMetaModelSelector {
  return (domainState:DomainState):MiroirMetaModel => {
    console.log('selectEntityInstances for deploymentUuid', deploymentUuid, 'existing entities:', Object.keys(domainState))
    if (deploymentUuid == applicationDeploymentLibrary.uuid) {
      // console.log('selectEntityInstances for entityUuid', parentUuid, 'existing instances:', Object.keys(domainState[parentUuid]))
      return ({
        entities: (
          domainState &&
          domainState[deploymentUuid] &&
          domainState[deploymentUuid]["model"] &&
          domainState[deploymentUuid]["model"][entityEntity.uuid]?
          Object.values(domainState[deploymentUuid]["model"][entityEntity.uuid]) as MetaEntity[]:[]
        ),
        entityDefinitions: (
          domainState &&
          domainState[deploymentUuid] &&
          domainState[deploymentUuid]["model"] &&
          domainState[deploymentUuid]["model"][entityEntityDefinition.uuid] ?
          Object.values(domainState[deploymentUuid]["model"][entityEntityDefinition.uuid]) as EntityDefinition[]
          : []
        ),
        reports: (
          domainState &&
          domainState[deploymentUuid] &&
          domainState[deploymentUuid]["model"] &&
          domainState[deploymentUuid]["model"][entityReport.uuid]?
            Object.values(domainState[deploymentUuid]["model"][entityReport.uuid]) as Report[]
          : []
        ),
        configuration: [],
        applicationVersions: [],
        applicationVersionCrossEntityDefinition: [],
      })
    } else {
      return defaultMiroirMetaModel;
    }
  }
}

// ################################################################################################
export function selectEntityInstancesFromJzodAttribute(jzodSchema:JzodAttribute | undefined):EntitiesDomainStateEntityInstanceArraySelector{
  return (domainState:EntitiesDomainState):EntityInstance[] => {
    // console.log('selectEntityInstances for entityUuid', parentUuid, 'existing entities:', Object.keys(domainState))
    if (jzodSchema?.extra?.targetEntity && domainState[jzodSchema?.extra?.targetEntity]) {
      // console.log('selectEntityInstances for entityUuid', parentUuid, 'existing instances:', Object.keys(domainState[parentUuid]))
      return DomainInstanceUuidIndexToArray(domainState[jzodSchema?.extra?.targetEntity]);
    } else {
      return [];
    }
  }
}

// ################################################################################################
export function selectReportDefinitionFromReportUuid(
  // deploymentUuid: string | undefined,
  // section: ApplicationSection | undefined,
  reportUuid: string | undefined
):EntitiesDomainStateInstanceSelector{
  return (domainState:EntitiesDomainState):Report | undefined => {
    // console.log('selectEntityInstances for entityUuid', parentUuid, 'existing entities:', Object.keys(domainState))
    if (reportUuid && domainState[entityReport.uuid] && domainState[entityReport.uuid][reportUuid]) {
      // console.log('selectEntityInstances for entityUuid', parentUuid, 'existing instances:', Object.keys(domainState[parentUuid]))
      // const reportDefinitionUuid = Object.entries(domainState[entityEntityDefinition.uuid]).filter(e:[string,Report]=>e[1].)
      return domainState[entityReport.uuid][reportUuid] as Report;
    } else {
      return undefined;
    }
  }
}

// ################################################################################################
export function selectEntityInstancesForReportSection(
  reportUuid: string | undefined,
  reportSectionIndex: number,
):EntitiesDomainStateEntityInstanceArraySelector{
  return (domainState:EntitiesDomainState):EntityInstance[] => {
    console.log('selectEntityInstancesForReportSection for reportUuid', reportUuid, 'reportSectionIndex:', reportSectionIndex,'domainState',domainState)
    const reportDefinition:Report | undefined = selectReportDefinitionFromReportUuid(reportUuid)(domainState) as Report | undefined;
    const currentReportSectionIndex = reportSectionIndex;
    if (
      reportDefinition &&
      reportDefinition.type === "list" &&
      reportDefinition.definition.length > reportSectionIndex &&
      reportDefinition.definition[currentReportSectionIndex].type === "objectList" &&
      reportDefinition.definition[currentReportSectionIndex].definition.parentUuid &&
      domainState[reportDefinition.definition[currentReportSectionIndex].definition.parentUuid]
    ) {
      console.log('selectEntityInstancesForReportSection for entityUuid', reportUuid, 'reportSectionIndex', reportSectionIndex)
      return DomainInstanceUuidIndexToArray(domainState[reportDefinition.definition[0].definition.parentUuid]);
    } else {
      return [];
    }
  }
}

// ################################################################################################


// // ################################################################################################
// // duplicated from server!!!!!!!!
// const applicationDeploymentLibrary: ApplicationDeployment = {
//   "uuid":"f714bb2f-a12d-4e71-a03b-74dcedea6eb4",
//   "parentName":"ApplicationDeployment",
//   "parentUuid":"35c5608a-7678-4f07-a4ec-76fc5bc35424",
//   "type":"singleNode",
//   "name":"LibraryApplicationPostgresDeployment",
//   "application":"5af03c98-fe5e-490b-b08f-e1230971c57f",
//   "description": "The default Postgres Deployment for Application Library",
//   "applicationModelLevel": "model",
//   "model": {
//     "location": {
//       "type": "sql",
//       "side":"server",
//       "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
//       "schema": "library"
//     }
//   },
//   "data": {
//     "location": {
//       "type": "sql",
//       "side":"server",
//       "connectionString": "postgres://postgres:postgres@localhost:5432/postgres",
//       "schema": "library"
//     }
//   }
// }

// const deployments = [applicationDeploymentMiroir, applicationDeploymentLibrary] as ApplicationDeployment[];

// export function selectEntityInstancesForReport(
//   // deploymentUuid: string | undefined, applicationSection: ApplicationSection | undefined,
//   reportUuid: string | undefined,
// ):EntitiesDomainStateEntityInstanceArraySelector{
//   return (domainState:EntitiesDomainState):EntityInstance[] => {

//     const displayedDeploymentDefinition: ApplicationDeployment | undefined = deployments.find(
//       (d) => d.uuid == deploymentUuid
//     );
//     console.log("ReportPage displayedDeploymentDefinition", displayedDeploymentDefinition);
//     const currentReportDefinitionDeployment: ApplicationDeployment | undefined =
//       displayedDeploymentDefinition?.applicationModelLevel == "metamodel" || applicationSection == "model"
//         ? (applicationDeploymentMiroir as ApplicationDeployment)
//         : displayedDeploymentDefinition;
//     const currentReportDefinitionApplicationSection: ApplicationSection | undefined =
//       currentReportDefinitionDeployment?.applicationModelLevel == "metamodel" ? "data" : "model";
//     console.log(
//       "ReportPage currentReportDefinitionDeployment",
//       currentReportDefinitionDeployment,
//       "currentReportDefinitionApplicationSection",
//       currentReportDefinitionApplicationSection
//     );
  
//     const deploymentReports: Report[] = useLocalCacheDeploymentSectionReports(
//       currentReportDefinitionDeployment?.uuid,
//       currentReportDefinitionApplicationSection
//     );
  
//     console.log("ReportPage deploymentReports", deploymentReports);
  
//     // const currentReportInstancesApplicationSection:ApplicationSection = currentDeploymentDefinition?.applicationModelLevel == "metamodel"? 'data':'model';
  
//     const currentMiroirReport: Report | undefined = deploymentReports?.find((r) => r.uuid === params.reportUuid);
//     // console.log('selectEntityInstances for entityUuid', parentUuid, 'existing entities:', Object.keys(domainState))
//     if (jzodSchema?.extra?.targetEntity && domainState[jzodSchema?.extra?.targetEntity]) {
//       // console.log('selectEntityInstances for entityUuid', parentUuid, 'existing instances:', Object.keys(domainState[parentUuid]))
//       return DomainInstanceUuidIndexToArray(domainState[jzodSchema?.extra?.targetEntity]);
//     } else {
//       return [];
//     }
//   }
// }

