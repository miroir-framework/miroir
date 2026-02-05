import type {
  EndpointDefinition,
  Entity,
  EntityDefinition,
  MetaModel,
  MiroirModelEnvironment,
  MlSchema,
  Report,
} from "miroir-core";
// Library Model - Entities
import entityPublisher from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json" assert { type: "json" };
import entityUser from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/ca794e28-b2dc-45b3-8137-00151557eea8.json" assert { type: "json" };
import entityCountry from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d3139a6d-0486-4ec8-bded-2a83a3c3cee4.json" assert { type: "json" };
import entityAuthor from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json" assert { type: "json" };
import entityLendingHistoryItem from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e81078f3-2de7-4301-bd79-d3a156aec149.json" assert { type: "json" };
import entityBook from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json" assert { type: "json" };
// Library Model - Entity Definitions
import entityDefinitionCountry from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json" assert { type: "json" };
import entityDefinitionBook from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json" assert { type: "json" };
import entityDefinitionPublisher from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/7a939fe8-d119-4e7f-ab94-95b2aae30db9.json" assert { type: "json" };
import entityDefinitionUser from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/8a4b9e9f-ae19-489f-977f-f3062107e066.json" assert { type: "json" };
import entityDefinitionAuthor from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json" assert { type: "json" };
import entityDefinitionLendingHistoryItem from "../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/ce054a0c-5c45-4e2b-a1a9-07e3e5dc8505.json" assert { type: "json" };

// Library Model - Reports
import reportCountryList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/08176cc7-43ae-4fca-91b7-bf869d19e4b9.json" assert { type: "json" };
import reportAuthorList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/66a09068-52c3-48bc-b8dd-76575bbc8e72.json" assert { type: "json" };
import reportAuthorDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/6d9faa54-643c-4aec-87c3-32635ad95902.json" assert { type: "json" };
import reportBookList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json" assert { type: "json" };
import reportPublisherList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/a77aa662-006d-46cd-9176-01f02a1a12dc.json" assert { type: "json" };
import reportBookDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json" assert { type: "json" };

// Library Model - Endpoints
import lendingEndpoint from "../assets/library_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/212f2784-5b68-43b2-8ee0-89b1c6fdd0de.json" assert { type: "json" };
import bookEndpoint from "../assets/library_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/9884c1a4-5122-488a-85db-a99fbc02e678.json" assert { type: "json" };

import selfApplicationLibrary from "../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json" assert { type: "json" };


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
