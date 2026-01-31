import {
  bookEndpoint,
  endpointDocument,
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
  reportPublisherList
} from "miroir-example-library";
import type {
  EndpointDefinition,
  Entity,
  EntityDefinition,
  MetaModel,
  MlSchema,
  Report,
} from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// import adminConfigurationDeploymentLibrary = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json"); //assert { type: "json" };
const adminConfigurationDeploymentLibrary = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json"); //assert { type: "json" };
// const endpointDocument = require("../assets/library_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/212f2784-5b68-43b2-8ee0-89b1c6fdd0de.json");



import { miroirFundamentalJzodSchema } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";
import { defaultMiroirMetaModel } from "./Model";
import type { Endpoint } from "../3_controllers/Endpoint";

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
const libraryAppEntityDefinitionsByName: Record<string, EntityDefinition> =
  libraryAppEntities.reduce(
    (acc, curr) => {
      acc[curr.entity.name] = curr.entityDefinition;
      return acc;
    },
    {} as Record<string, EntityDefinition>,
  );

const libraryAppEntitiesByName = libraryAppEntities.reduce((acc, curr) => {
  acc[curr.entity.name] = curr.entity;
  return acc;
}, {} as Record<string, Entity>);

const libraryAppReportsByEntityName = {
  author: [reportAuthorList, reportAuthorDetails],
  book: [reportBookList, reportBookDetails],
  country: [reportCountryList],
  publisher: [reportPublisherList],
};

export const defaultLibraryAppModel: MetaModel = {
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
// console.log("defaultLibraryAppModel:", JSON.stringify(defaultLibraryAppModel, null, 2));
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

export const defaultLibraryModelEnvironment: MiroirModelEnvironment = {
  miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
  miroirMetaModel: defaultMiroirMetaModel,
  endpointsByUuid: {[endpointDocument.uuid]: endpointDocument},
  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  currentModel: defaultLibraryAppModel,
};
