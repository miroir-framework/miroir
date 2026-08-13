import {
  getMiroirFundamentalSchemaForDeployment,
  type EndpointDefinition,
  type Entity,
  type EntityInstance,
  type Menu,
  type MetaModel,
  type MiroirModelEnvironment,
  type Report,
  type Runner,
  type SelfApplication,
} from "miroir-core";
// Library Model - Entities
import entityPublisher from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json" with { type: "json" };
import entityUser from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/ca794e28-b2dc-45b3-8137-00151557eea8.json" with { type: "json" };
import entityCountry from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d3139a6d-0486-4ec8-bded-2a83a3c3cee4.json" with { type: "json" };
import entityAuthor from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json" with { type: "json" };
import entityLendingHistoryItem from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e81078f3-2de7-4301-bd79-d3a156aec149.json" with { type: "json" };
import entityBook from "../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json" with { type: "json" };

import reportAuthorDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/6d9faa54-643c-4aec-87c3-32635ad95902.json" with { type: "json" };
import reportAuthorList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/66a09068-52c3-48bc-b8dd-76575bbc8e72.json" with { type: "json" };
import reportBookDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json" with { type: "json" };
import reportBookList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json" with { type: "json" };
import reportCountryDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/fc4ba6bc-751f-4d1a-acce-865c10354a31.json" with { type: "json" };
import reportCountryList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/08176cc7-43ae-4fca-91b7-bf869d19e4b9.json" with { type: "json" };
import reportPublisherDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/21133a6b-c9b2-44bf-812a-e13d99e7235e.json" with { type: "json" };
import reportPublisherList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/a77aa662-006d-46cd-9176-01f02a1a12dc.json" with { type: "json" };
import reportUserList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/3df9413d-5050-4357-910c-f764aacae7e6.json" with { type: "json" };
import reportUserDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/8adee3d5-f8cc-4118-aa02-5a2cd07908aa.json" with { type: "json" };
import reportLibraryHome from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/9c0cdb97-9537-4ee2-8053-a6ece3e0afe8.json" with { type: "json" };
import reportLendingHistoryItemDetails from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/7ccc9ac5-d29d-4b5b-a9ec-841bea152e2c.json" with { type: "json" };
import reportLendingHistoryItemList from "../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/cee26a1e-be58-497c-9d15-fa6832787907.json" with { type: "json" };

// Library Model - Endpoints
import lendingEndpoint from "../assets/library_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/212f2784-5b68-43b2-8ee0-89b1c6fdd0de.json" with { type: "json" };
import bookEndpoint from "../assets/library_model/3d8da4d4-8f76-4bb4-9212-14869d81c00c/9884c1a4-5122-488a-85db-a99fbc02e678.json" with { type: "json" };

import returnDocument from "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/98a38a84-e702-4540-a056-c7676a193a2b.json" with { type: "json" };
import lendDocument from "../assets/library_model/e54d7dc1-4fbc-495e-9ed9-b5cf081b9fbd/cc853632-f158-43fa-b9ed-437c9c25f539.json" with { type: "json" };

import selfApplicationLibrary from "../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json" with { type: "json" };
import menuDefaultLibrary from "../assets/library_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json" with { type: "json" };
import selfApplicationModelBranchLibraryMasterBranch from "../assets/library_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json" with { type: "json" };

/** Init-only ApplicationVersion for unversioned Library (not shipped as a model asset). */
export const libraryInitApplicationVersion: EntityInstance = {
  uuid: "419773b4-a73c-46ca-8913-0ee27fb2ce0a",
  parentName: "ApplicationVersion",
  parentUuid: "c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24",
  name: "Initial",
  previousVersion: "",
  modelStructureMigration: [],
  modelCUDMigration: [],
  selfApplication: selfApplicationLibrary.uuid,
  branch: selfApplicationModelBranchLibraryMasterBranch.uuid,
  description: "Synthetic init-only ApplicationVersion for unversioned Library",
} as EntityInstance;

const libraryAppReportsByEntityName = {
  author: [reportAuthorList, reportAuthorDetails],
  book: [reportBookList, reportBookDetails],
  country: [reportCountryList],
  publisher: [reportPublisherList],
};

export const defaultLibraryAppModel: MetaModel = {
  applicationUuid: selfApplicationLibrary.uuid,
  applicationName: selfApplicationLibrary.name,
  applications: [selfApplicationLibrary as SelfApplication],
  entities: [
    entityAuthor as Entity,
    entityBook as Entity,
    entityCountry as Entity,
    entityLendingHistoryItem as Entity,
    entityPublisher as Entity,
    entityUser as Entity,
  ],
  entityVersions: [],
  endpoints: [
    bookEndpoint as any as EndpointDefinition,
    lendingEndpoint as any as EndpointDefinition,
  ],
  menus: [menuDefaultLibrary as Menu],
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
  runners: [lendDocument as Runner, returnDocument as Runner],
  tests: [],
  themes: [],
  transformerDefinitions: [],
  applicationVersionCrossEntityVersion: [],
  applicationVersionCrossQueryVersion: [],
  queryVersions: [],
  applicationVersionCrossReportVersion: [],
  reportVersions: [],
  applicationVersionCrossMenuVersion: [],
  menuVersions: [],
  applicationVersionCrossEndpointVersion: [],
  endpointVersions: [],
  applicationVersionCrossRunnerVersion: [],
  runnerVersions: [],
  applicationVersionCrossThemeVersion: [],
  themeVersions: [],
  applicationVersionCrossTransformerDefinitionVersion: [],
  transformerDefinitionVersions: [],
  storedQueries: [],
  jzodSchemas: [],
  applicationVersions: [],
};

export function getDefaultLibraryModelEnvironmentDEFUNCT(
  defaultMiroirMetaModelParam: MetaModel,
  endpointDocumentNOTUSED: EndpointDefinition,
  libraryDeploymentUuid: string,
): MiroirModelEnvironment {
  if (typeof libraryDeploymentUuid !== "string" || libraryDeploymentUuid.length === 0) {
    throw new Error(
      `getDefaultLibraryModelEnvironmentDEFUNCT: libraryDeploymentUuid must be a deployment uuid string, got ${typeof libraryDeploymentUuid}`,
    );
  }

  return {
    miroirFundamentalJzodSchema: getMiroirFundamentalSchemaForDeployment(
      libraryDeploymentUuid,
      defaultLibraryAppModel,
    ),
    miroirMetaModel: defaultMiroirMetaModelParam,
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
