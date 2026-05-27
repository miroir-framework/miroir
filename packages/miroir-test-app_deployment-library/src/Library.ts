import type {
  EndpointDefinition,
  Entity,
  EntityDefinition,
  Menu,
  MetaModel,
  MiroirModelEnvironment,
  MlSchema,
  Report,
  Runner,
  SelfApplication,
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
// import reportCountryList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/08176cc7-43ae-4fca-91b7-bf869d19e4b9.json" assert { type: "json" };
// import reportAuthorList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/66a09068-52c3-48bc-b8dd-76575bbc8e72.json" assert { type: "json" };
// import reportAuthorDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/6d9faa54-643c-4aec-87c3-32635ad95902.json" assert { type: "json" };
// import reportBookList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json" assert { type: "json" };
// import reportPublisherList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/a77aa662-006d-46cd-9176-01f02a1a12dc.json" assert { type: "json" };
// import reportBookDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json" assert { type: "json" };

import reportAuthorDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/6d9faa54-643c-4aec-87c3-32635ad95902.json" assert { type: "json" };
import reportAuthorList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/66a09068-52c3-48bc-b8dd-76575bbc8e72.json" assert { type: "json" };
// export { default as reportBookInstance } from "./assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json" assert { type: "json" };
import reportBookDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json" assert { type: "json" };
import reportBookList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json" assert { type: "json" };
import reportCountryDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/fc4ba6bc-751f-4d1a-acce-865c10354a31.json" assert { type: "json" };
import reportCountryList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/08176cc7-43ae-4fca-91b7-bf869d19e4b9.json" assert { type: "json" };
import reportPublisherDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/21133a6b-c9b2-44bf-812a-e13d99e7235e.json" assert { type: "json" };
import reportPublisherList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/a77aa662-006d-46cd-9176-01f02a1a12dc.json" assert { type: "json" };
import reportUserList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/3df9413d-5050-4357-910c-f764aacae7e6.json" assert { type: "json" };
import reportUserDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/8adee3d5-f8cc-4118-aa02-5a2cd07908aa.json" assert { type: "json" };
import reportLibraryHome from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/9c0cdb97-9537-4ee2-8053-a6ece3e0afe8.json" assert { type: "json" };
import reportLendingHistoryItemDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/7ccc9ac5-d29d-4b5b-a9ec-841bea152e2c.json" assert { type: "json" };
import reportLendingHistoryItemList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/cee26a1e-be58-497c-9d15-fa6832787907.json" assert { type: "json" };

// Library Model - Endpoints
import lendingEndpoint from "../assets/library_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/212f2784-5b68-43b2-8ee0-89b1c6fdd0de.json" assert { type: "json" };
import bookEndpoint from "../assets/library_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/9884c1a4-5122-488a-85db-a99fbc02e678.json" assert { type: "json" };

import returnDocument from "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/98a38a84-e702-4540-a056-c7676a193a2b.json" assert { type: "json" };
import lendDocument from "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/cc853632-f158-43fa-b9ed-437c9c25f539.json" assert { type: "json" };

import selfApplicationVersionLibraryInitialVersion from "../assets/library_model/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/419773b4-a73c-46ca-8913-0ee27fb2ce0a.json" assert { type: "json" };


// import {
//   reportCountryDetails,
//   reportLendingHistoryItemDetails,
//   reportLendingHistoryItemList,
//   reportLibraryHome,
//   reportPublisherDetails,
//   reportUserDetails,
//   reportUserList,
//   // returnDocument,
//   selfApplicationVersionLibraryInitialVersion,
// } from "..";
import selfApplicationLibrary from "../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json" assert { type: "json" };
import menuDefaultLibrary from "../assets/library_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json" assert { type: "json" };


export type EntityDefinitionCouple = {
  entity: Entity,
  entityDefinition: EntityDefinition,
};

const libraryAppEntities: EntityDefinitionCouple[] = [
  { entity: entityAuthor as Entity, entityDefinition: entityDefinitionAuthor as EntityDefinition},
  { entity: entityBook as Entity, entityDefinition: entityDefinitionBook as EntityDefinition},
  { entity: entityCountry as Entity, entityDefinition: entityDefinitionCountry as EntityDefinition},
  { entity: entityPublisher as Entity, entityDefinition: entityDefinitionPublisher as EntityDefinition},
  { entity: entityUser as Entity, entityDefinition: entityDefinitionUser as any as EntityDefinition},
  { entity: entityLendingHistoryItem as Entity, entityDefinition: entityDefinitionLendingHistoryItem as EntityDefinition},
];

const libraryAppReportsByEntityName = {
  author: [reportAuthorList, reportAuthorDetails],
  book: [reportBookList, reportBookDetails],
  country: [reportCountryList],
  publisher: [reportPublisherList],
};

// export const defaultLibraryAppModel: MetaModel = {
//   applicationUuid: selfApplicationLibrary.uuid,
//   applicationName: selfApplicationLibrary.name,
//   entities: libraryAppEntities.map((couple) => couple.entity),
//   entityDefinitions: libraryAppEntities.map((couple) => couple.entityDefinition),
//   endpoints: [
//     bookEndpoint as any as EndpointDefinition,
//     lendingEndpoint as any as EndpointDefinition,
//   ],
//   jzodSchemas: [],
//   menus: [
//     menuDefaultLibrary as Menu
//   ],
//   runners: [

//   ],
//   themes: [],
//   applicationVersions: [],
//   reports: Object.values(libraryAppReportsByEntityName).flat() as Report[],
//   storedQueries: [
//   ],
//   applicationVersionCrossEntityDefinition: [
//   ],
//   applications: []
// };
export const defaultLibraryAppModel: MetaModel = {
      applicationUuid: selfApplicationLibrary.uuid,
      applicationName: selfApplicationLibrary.name,
      applications: [
        selfApplicationLibrary as SelfApplication
      ],
      entities: [
        entityAuthor as Entity,
        entityBook as Entity,
        entityCountry as Entity,
        entityLendingHistoryItem as Entity,
        entityPublisher as Entity,
        entityUser as Entity,
      ],
      entityDefinitions: [
        entityDefinitionAuthor as EntityDefinition,
        entityDefinitionBook as EntityDefinition,
        entityDefinitionCountry as EntityDefinition,
        entityDefinitionLendingHistoryItem as EntityDefinition,
        entityDefinitionPublisher as EntityDefinition,
        entityDefinitionUser as EntityDefinition,
      ],
      endpoints: [
        bookEndpoint as any as EndpointDefinition,
        lendingEndpoint as any as EndpointDefinition,
      ],
      menus: [
        menuDefaultLibrary as Menu,
      ],
      reports: [
        reportAuthorDetails as Report,
        reportAuthorList as Report,
        reportBookDetails as Report,
        reportBookList as Report,
        reportCountryDetails as Report,
        reportCountryList as Report,
        reportPublisherDetails as Report,
        reportPublisherList as Report,
        reportUserDetails as Report,
        reportUserList as Report,
        reportLendingHistoryItemDetails as Report,
        reportLendingHistoryItemList as Report,
        reportLibraryHome as Report,
      ],
      runners: [
        lendDocument as Runner,
        returnDocument as Runner,
      ],
      themes: [],
      applicationVersionCrossEntityDefinition: [],
      storedQueries: [],
      jzodSchemas: [],
      applicationVersions: [
        selfApplicationVersionLibraryInitialVersion,
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

export function getDefaultLibraryModelEnvironmentDEFUNCT(
  miroirFundamentalJzodSchema: MlSchema,
  defaultMiroirMetaModel: MetaModel,
  endpointDocumentNOTUSED: EndpointDefinition,
  libraryDeploymentUuid: string,
): MiroirModelEnvironment {
  return {
    miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as MlSchema,
    miroirMetaModel: defaultMiroirMetaModel,
    // endpointsByUuid: {[endpointDocument.uuid]: endpointDocument},
    endpointsByUuid: defaultLibraryAppModel.endpoints.reduce(
      (acc, endpoint) => {
        acc[endpoint.uuid] = endpoint;
        return acc;
      },
      {} as Record<string, EndpointDefinition>,
    ),
    deploymentUuid: libraryDeploymentUuid,
    currentModel: defaultLibraryAppModel,
  };
}
