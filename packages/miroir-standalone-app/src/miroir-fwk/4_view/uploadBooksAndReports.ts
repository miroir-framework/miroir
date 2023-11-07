import { DomainControllerInterface, MiroirApplicationModel, applicationDeploymentLibrary, MetaEntity, EntityDefinition, entityReport, EntityInstance } from "miroir-core";


import reportBookInstance from "../../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json";
// import entityPublisher from "../../assets/library_model/";
import entityPublisher from "../../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/a027c379-8468-43a5-ba4d-bf618be25cab.json";
import entityAuthor from "../../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d7a144ff-d1b9-4135-800c-a7cfc1f38733.json";
import entityBook from "../../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/e8ba151b-d68e-4cc3-9a83-3459d309ccf5.json";
import entityCountry from "../../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/d3139a6d-0486-4ec8-bded-2a83a3c3cee4.json";
import entityTest from "../../assets/library_model/16dbfe28-e1d7-4f20-9ba4-c1a9873202ad/9ad64893-5f8f-4eaf-91aa-ffae110f88c8.json";
// import applicationDeploymentLibraryDeployment from "assets/library_model/35c5608a-7678-4f07-a4ec-76fc5bc35424/ab4c13c3-f476-407c-a30c-7cb62275a352.json";
import entityDefinitionBook from "../../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/797dd185-0155-43fd-b23f-f6d0af8cae06.json";
import entityDefinitionCountry from "../../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/56628e31-3db5-4c5c-9328-4ff7ce54c36a.json";
import entityDefinitionPubliser from "../../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/7a939fe8-d119-4e7f-ab94-95b2aae30db9.json";
import entityDefinitionAuthor from "../../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/b30b7180-f7dc-4cca-b4e8-e476b77fe61d.json";
import entityDefinitionTest from "../../assets/library_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/83872519-ce34-4a24-b1db-b7bf604ebd3a.json";
import reportAuthorList from "../../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/66a09068-52c3-48bc-b8dd-76575bbc8e72.json";
import reportBookList from "../../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/74b010b6-afee-44e7-8590-5f0849e4a5c9.json";
import reportCountryList from "../../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/08176cc7-43ae-4fca-91b7-bf869d19e4b9.json";
import reportPublisherList from "../../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/a77aa662-006d-46cd-9176-01f02a1a12dc.json";
import reportTestList from "../../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/931dd036-dfce-4e47-868e-36dba3654816.json";
import reportAuthorDetails from "../../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/6d9faa54-643c-4aec-87c3-32635ad95902.json";
import reportBookDetails from "../../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/c3503412-3d8a-43ef-a168-aa36e975e606.json";
// import reportAuthorDetails from "../../assets/library_model/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916/931dd036-dfce-4e47-868e-36dba3654816.json";

import applicationLibrary from "../../assets/library_model/a659d350-dd97-4da9-91de-524fa01745dc/5af03c98-fe5e-490b-b08f-e1230971c57f.json";
import applicationStoreBasedConfigurationLibrary from "../../assets/library_model/7990c0c9-86c3-40a1-a121-036c91b55ed7/2e5b7948-ff33-4917-acac-6ae6e1ef364f.json";
import applicationVersionLibraryInitialVersion from "../../assets/library_model/c3f0facf-57d1-4fa8-b3fa-f2c007fdbe24/419773b4-a73c-46ca-8913-0ee27fb2ce0a.json";
import applicationModelBranchLibraryMasterBranch from "../../assets/library_model/cdb0aec6-b848-43ac-a058-fe2dbe5811f1/ad1ddc4e-556e-4598-9cff-706a2bde0be7.json";

import folio from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/1f550a2a-33f5-4a56-83ee-302701039494.json";
import penguin from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/516a7366-39e7-4998-82cb-80199a7fa667.json";
import springer from "../../assets/library_data/a027c379-8468-43a5-ba4d-bf618be25cab/c1c97d54-aba8-4599-883a-7fe8f3874095.json";
import author1 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/4441169e-0c22-4fbc-81b2-28c87cf48ab2.json";
import author2 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/ce7b601d-be5f-4bc6-a5af-14091594046a.json";
import author3 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/d14c1c0c-eb2e-42d1-8ac1-2d58f5143c17.json";
import author4 from "../../assets/library_data/d7a144ff-d1b9-4135-800c-a7cfc1f38733/e4376314-d197-457c-aa5e-d2da5f8d5977.json";
import book1 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f.json";
import book2 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/e20e276b-619d-4e16-8816-b7ec37b53439.json";
import book3 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/4cb917b3-3c53-4f9b-b000-b0e4c07a81f7.json";
import book4 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/6fefa647-7ecf-4f83-b617-69d7d5094c37.json";
import book5 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c97be567-bd70-449f-843e-cd1d64ac1ddd.json";
import book6 from "../../assets/library_data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/c6852e89-3c3c-447f-b827-4b5b9d830975.json";
import test1 from "../../assets/library_data/9ad64893-5f8f-4eaf-91aa-ffae110f88c8/150bacfd-06d0-4ecb-828d-f5275494448a.json";
import Country1 from "../../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/2eda1207-4dcc-4af9-a3ba-ef75e7f12c11.json";
import Country2 from "../../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/30b8e7c6-b75d-4db0-906f-fa81fa5c4cc0.json";
import Country3 from "../../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b62fc20b-dcf5-4e3b-a247-62d0475cf60f.json";
import Country4 from "../../assets/library_data/d3139a6d-0486-4ec8-bded-2a83a3c3cee4/b6ddfb89-4301-48bf-9ed9-4ed6ee9261fe.json";

// ###################################################################################
export async function uploadBooksAndReports(
  domainController: DomainControllerInterface,
  currentModel?:MiroirApplicationModel
) {
  await domainController.handleDomainAction(
    applicationDeploymentLibrary.uuid,
    {
    actionType: "DomainTransactionalAction",
    actionName: "updateEntity",
    update: {
      updateActionName:"WrappedTransactionalEntityUpdate",
      modelEntityUpdate: {
        updateActionType: "ModelEntityUpdate",
        updateActionName: "createEntity",
        entities: [
          {entity:entityAuthor as MetaEntity, entityDefinition:entityDefinitionAuthor as EntityDefinition},
          {entity:entityBook as MetaEntity, entityDefinition:entityDefinitionBook as EntityDefinition},
          {entity:entityCountry as MetaEntity, entityDefinition:entityDefinitionCountry as EntityDefinition},
          {entity:entityPublisher as MetaEntity, entityDefinition:entityDefinitionPubliser as EntityDefinition},
          {entity:entityTest as MetaEntity, entityDefinition:entityDefinitionTest as EntityDefinition},
        ],
      },
    }
  },currentModel);
  await domainController.handleDomainAction(
    applicationDeploymentLibrary.uuid,
    {
      actionType: "DomainTransactionalAction",
      actionName: "UpdateMetaModelInstance",
      update: {
        updateActionType: "ModelCUDInstanceUpdate",
        updateActionName: "create",
        objects: [
          {
            parentName: entityReport.name,
            parentUuid: entityReport.uuid,
            applicationSection: "model",
            instances: [
              reportAuthorDetails as EntityInstance,
              reportAuthorList as EntityInstance,
              reportBookDetails as EntityInstance,
              reportBookList as EntityInstance,
              reportCountryList as EntityInstance,
              reportPublisherList as EntityInstance,
              reportTestList as EntityInstance,
            ],
          },
        ],
      },
    },
    currentModel
  );

  await domainController.handleDomainAction(
    applicationDeploymentLibrary.uuid,
    { actionName: "commit", actionType: "DomainTransactionalAction", label:"Adding Author and Book entities" },
    currentModel
  );

  await domainController.handleDomainAction(
    applicationDeploymentLibrary.uuid,
    {
    actionType: "DomainDataAction",
    actionName: "create",
    objects: [
      {
        parentName: entityPublisher.name,
        parentUuid: entityPublisher.uuid,
        applicationSection:'data',
        instances: [folio as EntityInstance, penguin as EntityInstance, springer as EntityInstance],
      },
      {
        parentName: entityAuthor.name,
        parentUuid: entityAuthor.uuid,
        applicationSection:'data',
        instances: [
          author1 as EntityInstance, 
          author2 as EntityInstance,
          author3 as EntityInstance,
          author4 as EntityInstance,
        ],
      },
      {
        parentName: entityBook.name,
        parentUuid: entityBook.uuid,
        applicationSection:'data',
        instances: [
          book1 as EntityInstance, 
          book2 as EntityInstance, 
          book3 as EntityInstance, 
          book4 as EntityInstance,
          book5 as EntityInstance,
          book6 as EntityInstance,
        ],
      },
      {
        parentName: entityTest.name,
        parentUuid: entityTest.uuid,
        applicationSection:'data',
        instances: [
          test1 as EntityInstance, 
        ],
      },
      {
        parentName: entityCountry.name,
        parentUuid: entityCountry.uuid,
        applicationSection:'data',
        instances: [
          Country1 as EntityInstance, 
          Country2 as EntityInstance, 
          Country3 as EntityInstance, 
          Country4 as EntityInstance, 
        ],
      },
    ],
  });
}
