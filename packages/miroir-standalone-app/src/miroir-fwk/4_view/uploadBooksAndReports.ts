import {
  adminConfigurationDeploymentLibrary,
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
  entityDefinitionPublisher,
  entityPublisher,
  folio,
  penguin,
  reportAuthorList,
  reportBookList,
  reportPublisherList,
  springer,
  DomainControllerInterface,
  entityCountry,
  entityDefinitionCountry,
  reportAuthorDetails,
  reportBookDetails,
  reportCountryList,
  Country1,
  Country2,
  Country3,
  Country4,
  MetaModel,
  Entity,
  EntityInstanceCollection,
  type MiroirModelEnvironment,
} from "miroir-core";

export const libraryApplicationInstances: EntityInstanceCollection[] = [
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
    ]
;
// ###################################################################################
export async function uploadBooksAndReports(
  domainController: DomainControllerInterface,
  currentModel?: MiroirModelEnvironment
) {
  await domainController.handleAction(
    {
      actionType: "createEntity",
      deploymentUuid:adminConfigurationDeploymentLibrary.uuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
      payload: {
        entities: [
          { entity: entityAuthor as Entity, entityDefinition: entityDefinitionAuthor as EntityDefinition },
          { entity: entityBook as Entity, entityDefinition: entityDefinitionBook as EntityDefinition },
          { entity: entityCountry as Entity, entityDefinition: entityDefinitionCountry as EntityDefinition },
          { entity: entityPublisher as Entity, entityDefinition: entityDefinitionPublisher as EntityDefinition },
          // { entity: entityTest as Entity, entityDefinition: entityDefinitionTest as EntityDefinition },
        ],
      }
    },
    currentModel
  );

  await domainController.handleAction(
    {
      actionType: "commit",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    },
    // { actionName: "commit", actionType: "modelAction", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e", label: "Adding Author and Book entities" },
    currentModel
  );

  await domainController.handleAction(
    {
      actionType: "transactionalInstanceAction",
      application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
      endpoint: "1e2ef8e6-7fdf-4e3f-b291-2e6e599fb2b5",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      payload: {
        instanceAction: {
          // actionType: "instanceAction",
          actionType: "createInstance",
          deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
          application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
          endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
          payload: {
            applicationSection: "model",
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
                  // reportTestList as EntityInstance,
                ],
              },
            ],
          },
        },
      },
    },
    currentModel
  );

  await domainController.handleAction(
    {
      actionType: "commit",
      // actionType: "modelAction",
      deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
      endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
    },
    // { actionName: "commit", actionType: "modelAction", endpoint: "7947ae40-eb34-4149-887b-15a9021e714e", label: "Adding Author and Book entities" },
    currentModel
  );

  
  await domainController.handleAction({
    // actionType: "instanceAction",
    actionType: "createInstance",
    application: "79a8fa03-cb64-45c8-9f85-7f8336bf92a5",
    deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    payload: {
      applicationSection: "data",
      objects: libraryApplicationInstances,
    },
  });
}
