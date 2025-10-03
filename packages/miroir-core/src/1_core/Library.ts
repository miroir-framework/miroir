import type { JzodSchema, MetaModel } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

// import adminConfigurationDeploymentLibrary = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json"); //assert { type: "json" };
const adminConfigurationDeploymentLibrary = require("../assets/admin_data/7959d814-400c-4e80-988f-a00fe582ab98/f714bb2f-a12d-4e71-a03b-74dcedea6eb4.json"); //assert { type: "json" };
const entityPublisher = require("../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json");
const entityAuthor = require("../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json");
const entityBook = require("../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json");
const entityCountry = require("../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d3139a6d-0486-4ec8-bded-2a83a3c3cee4.json");
const reportAuthorList = require("../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/66a09068-52c3-48bc-b8dd-76575bbc8e72.json");
const reportBookList = require("../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json");
const reportBookInstance = require("../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json");
const reportPublisherList = require("../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/a77aa662-006d-46cd-9176-01f02a1a12dc.json");
const entityDefinitionBook = require("../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json");
const entityDefinitionPublisher = require("../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/7a939fe8-d119-4e7f-ab94-95b2aae30db9.json");
const entityDefinitionAuthor = require("../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json");
const entityDefinitionCountry = require("../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json");
const menuDefaultLibrary = require("../assets/library_model/dde4c883-ae6d-47c3-b6df-26bc6e3c1842/dd168e5a-2a21-4d2d-a443-032c6d15eb22.json");
const reportAuthorDetails = require("../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/6d9faa54-643c-4aec-87c3-32635ad95902.json");
const reportBookDetails = require("../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json");
const reportCountryList = require("../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/08176cc7-43ae-4fca-91b7-bf869d19e4b9.json");
import { miroirFundamentalJzodSchema } from "../0_interfaces/1_core/preprocessor-generated/miroirFundamentalJzodSchema";
import { defaultMiroirMetaModel } from "./Model";
import type { MiroirModelEnvironment } from "../0_interfaces/1_core/Transformer";

const libraryAppEntityDefinitions = {
  author: entityDefinitionAuthor,
  book: entityDefinitionBook,
  country: entityDefinitionCountry,
  publisher: entityDefinitionPublisher,
  // user: entityDefinitionUser,
};
const libraryAppEntities = {
  author: entityAuthor,
  book: entityBook,
  country: entityCountry,
  publisher: entityPublisher,
  // user: entityUser,
};

const libraryAppReports = {
  author: [reportAuthorList, reportAuthorDetails],
  book: [reportBookList, reportBookDetails],
  country: [reportCountryList],
  publisher: [reportPublisherList],
};

export const defaultLibraryAppModel: MetaModel = {
  // configuration: [instanceConfigurationReference],
  entities: Object.values(libraryAppEntities),
  entityDefinitions: Object.values(libraryAppEntityDefinitions),
  jzodSchemas: [],
  menus: [],
  applicationVersions: [],
  reports: Object.values(libraryAppReports).flat(),
  applicationVersionCrossEntityDefinition: [
  ],
};

export const defaultLibraryModelEnvironment: MiroirModelEnvironment = {
  deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
  miroirFundamentalJzodSchema: miroirFundamentalJzodSchema as JzodSchema,
  miroirMetaModel: defaultMiroirMetaModel,
  currentModel: defaultLibraryAppModel,
};
