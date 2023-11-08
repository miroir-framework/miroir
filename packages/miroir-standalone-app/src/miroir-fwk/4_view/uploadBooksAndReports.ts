import {
  MiroirApplicationModel,
  applicationDeploymentLibrary,
  MetaEntity,
  EntityDefinition,
  entityReport,
  EntityInstance,
  author1,
  author2,
  author3,
  author4,
  book1,
  book2,
  book3,
  book4,
  book5,
  book6,
  entityAuthor,
  entityBook,
  entityDefinitionAuthor,
  entityDefinitionBook,
  entityDefinitionPubliser,
  entityDefinitionTest,
  entityPublisher,
  entityTest,
  folio,
  penguin,
  reportAuthorList,
  reportBookList,
  reportPublisherList,
  reportTestList,
  springer,
  test1,
  DomainControllerInterface,
  entityCountry,
  entityDefinitionCountry,
  reportAuthorDetails,
  reportBookDetails,
  reportCountryList,
} from "miroir-core";

// ###################################################################################
export async function uploadBooksAndReports(
  domainController: DomainControllerInterface,
  currentModel?: MiroirApplicationModel
) {
  await domainController.handleDomainAction(
    applicationDeploymentLibrary.uuid,
    {
      actionType: "DomainTransactionalAction",
      actionName: "updateEntity",
      update: {
        updateActionName: "WrappedTransactionalEntityUpdate",
        modelEntityUpdate: {
          updateActionType: "ModelEntityUpdate",
          updateActionName: "createEntity",
          entities: [
            { entity: entityAuthor as MetaEntity, entityDefinition: entityDefinitionAuthor as EntityDefinition },
            { entity: entityBook as MetaEntity, entityDefinition: entityDefinitionBook as EntityDefinition },
            { entity: entityCountry as MetaEntity, entityDefinition: entityDefinitionCountry as EntityDefinition },
            { entity: entityPublisher as MetaEntity, entityDefinition: entityDefinitionPubliser as EntityDefinition },
            { entity: entityTest as MetaEntity, entityDefinition: entityDefinitionTest as EntityDefinition },
          ],
        },
      },
    },
    currentModel
  );
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
    { actionName: "commit", actionType: "DomainTransactionalAction", label: "Adding Author and Book entities" },
    currentModel
  );

  await domainController.handleDomainAction(applicationDeploymentLibrary.uuid, {
    actionType: "DomainDataAction",
    actionName: "create",
    objects: [
      {
        parentName: entityPublisher.name,
        parentUuid: entityPublisher.uuid,
        applicationSection: "data",
        instances: [folio as EntityInstance, penguin as EntityInstance, springer as EntityInstance],
      },
      {
        parentName: entityAuthor.name,
        parentUuid: entityAuthor.uuid,
        applicationSection: "data",
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
        applicationSection: "data",
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
        applicationSection: "data",
        instances: [test1 as EntityInstance],
      },
      {
        parentName: entityCountry.name,
        parentUuid: entityCountry.uuid,
        applicationSection: "data",
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
