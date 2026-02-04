import {
  bookEndpoint,
  entityAuthor,
  entityBook,
  entityCountry,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionCountry,
  entityDefinitionLendingHistoryItem,
  entityDefinitionPublisher,
  entityDefinitionUser,
  entityLendingHistoryItem,
  entityPublisher,
  entityUser,
  lendingEndpoint,
  reportAuthorDetails,
  reportAuthorList,
  reportBookDetails,
  reportBookList,
  reportCountryList,
  reportPublisherList,
  selfApplicationLibrary
} from "miroir-example-library";
import type {
  EndpointDefinition,
  Entity,
  EntityDefinition,
  MetaModel,
  MlSchema,
  Report,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";

export type EntityDefinitionCouple = {
  entity: Entity,
  entityDefinition: EntityDefinition,
};

const libraryAppEntities: EntityDefinitionCouple[] = [
  { entity: entityAuthor as Entity, entityDefinition: entityDefinitionAuthor as EntityDefinition},
  { entity: entityBook as Entity, entityDefinition: entityDefinitionBook as EntityDefinition},
  { entity: entityCountry as Entity, entityDefinition: entityDefinitionCountry as EntityDefinition},
  { entity: entityPublisher as Entity, entityDefinition: entityDefinitionPublisher as EntityDefinition},
  { entity: entityUser as Entity, entityDefinition: entityDefinitionUser as EntityDefinition},
  { entity: entityLendingHistoryItem as Entity, entityDefinition: entityDefinitionLendingHistoryItem as EntityDefinition},
];

const libraryAppReportsByEntityName = {
  author: [reportAuthorList, reportAuthorDetails],
  book: [reportBookList, reportBookDetails],
  country: [reportCountryList],
  publisher: [reportPublisherList],
};

export const defaultLibraryAppModelDEFUNCT: MetaModel = {
  applicationUuid: selfApplicationLibrary.uuid,
  applicationName: selfApplicationLibrary.name,
  entities: libraryAppEntities.map((couple) => couple.entity),
  entityDefinitions: libraryAppEntities.map((couple) => couple.entityDefinition),
  endpoints: [
    bookEndpoint as EndpointDefinition,
    lendingEndpoint as EndpointDefinition,
  ],
  jzodSchemas: [],
  menus: [],
  applicationVersions: [],
  reports: Object.values(libraryAppReportsByEntityName).flat() as Report[],
  storedQueries: [
  ],
  applicationVersionCrossEntityDefinition: [
  ],
};
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("defaultLibraryAppModelDEFUNCT:", JSON.stringify(defaultLibraryAppModelDEFUNCT, null, 2));
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")
// console.log("###################################################################################")

// export const defaultLibraryModelEnvironment: MiroirModelEnvironment = {
//   miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
//   miroirMetaModel: defaultMiroirMetaModel,
//   endpointsByUuid: {[endpointDocument.uuid]: endpointDocument},
//   deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
//   currentModel: defaultLibraryAppModelDEFUNCT,
// };

export function getDefaultLibraryModelEnvironmentDEFUNCT(
  miroirFundamentalJzodSchema: MlSchema,
  defaultMiroirMetaModel: MetaModel,
  endpointDocument: EndpointDefinition,
  libraryDeploymentUuid: string,
): MiroirModelEnvironment {
  return {
    miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
    miroirMetaModel: defaultMiroirMetaModel,
    endpointsByUuid: {[endpointDocument.uuid]: endpointDocument},
    deploymentUuid: libraryDeploymentUuid,
    currentModel: defaultLibraryAppModelDEFUNCT,
  }
}
