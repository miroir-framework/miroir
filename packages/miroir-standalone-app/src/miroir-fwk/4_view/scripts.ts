import {
  Action2Error,
  Action2ReturnType,
  ApplicationSection,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  defaultMiroirModelEnvironment,
  Domain2QueryReturnType,
  DomainControllerInterface,
  EntityDefinition,
  EntityInstance,
  InstanceAction,
  LoggerInterface,
  MiroirLoggerFactory,
  type ApplicationDeploymentMap,
  type Uuid
} from "miroir-core";
import { packageName } from "../../constants.js";
import { cleanLevel } from "./constants.js";
import type { ExtractorTemplateForObjectListByEntity } from "miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Scripts"), "UI",
).then((logger: LoggerInterface) => {log = logger});

export const splitEntity = async (p: {
  domainController: DomainControllerInterface,
  deploymentUuid: string;
  applicationSection: ApplicationSection;
  entityDefinition: EntityDefinition;
  entityDefinitions: EntityDefinition[];
  // entityInstances: EntityInstance[];
  newEntityName: string,
  splitAttributes: string[]
}) => {
  log.info(
    "++++++++++++++++++++++++++++ splitEntity entity",
    p.entityDefinition.name,
    // p.entityInstances
  );

}

// ################################################################################################
export const deleteCascade = async (p: {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  application: Uuid;
  deploymentUuid: string;
  applicationSection: ApplicationSection;
  // state: LocalCacheSliceState;
  entityDefinition: EntityDefinition;
  entityDefinitions: EntityDefinition[];
  entityInstances: EntityInstance[];
}) => {
  log.info(
    "++++++++++++++++++++++++++++ deleteInstanceWithCascade deleteCascade deleting instances of entity",
    p.entityDefinition.name,
    p.entityInstances
  );

  // finding all entities which have an attribute pointing to the current entity
  const foreignKeysPointingToEntity = Object.fromEntries(
    Object.entries(p.entityDefinitions)
      .map((e: [string, EntityDefinition]) => {
        const fkAttributes = Object.entries(e[1].mlSchema.definition).find(
          (a) => a[1].tag?.value?.selectorParams?.targetEntity == p.entityDefinition.entityUuid
        );
        return [e[1].entityUuid, fkAttributes ? fkAttributes[0] : undefined];
      })
      .filter((e) => e[1])
  );

  log.info(
    "deleteInstanceWithCascade deleteCascade will delete instances of entities that point to current entity",
    foreignKeysPointingToEntity
  );

  // // delete current list of objects (on a relational database, this would require suspending foreign key constraints for the involved relations)
  const deleteCurrentEntityInstancesAction: InstanceAction = {
    actionType: "deleteInstance",
    application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    payload: {
      application: p.application,
      deploymentUuid: p.deploymentUuid,
      applicationSection: p.applicationSection,
      objects:
        p.entityInstances.length > 0
          ? [
              {
                parentName: (p.entityInstances[0] as any)["name"] ?? "undefined name",
                parentUuid: p.entityInstances[0].parentUuid,
                applicationSection: p.applicationSection,
                instances: p.entityInstances,
              },
            ]
          : [],
    },
  };

  log.info(
    "deleteInstanceWithCascade deleteCascade deleting current instances action",
    deleteCurrentEntityInstancesAction
  );
  p.domainController.handleAction(
    deleteCurrentEntityInstancesAction,
    p.applicationDeploymentMap,
    defaultMiroirModelEnvironment, // TODO: use actual current deployment environment
  ); 
  log.info("deleteInstanceWithCascade deleteCascade deleting current instances DONE");

  if (Object.keys(foreignKeysPointingToEntity).length > 0) {
    const pageParams: Domain2QueryReturnType<Record<string, any>> = {
      deploymentUuid: p.deploymentUuid,
      applicationSection: p.applicationSection,
    };

    const foreignKeyObjectsFetchQuery: BoxedQueryTemplateWithExtractorCombinerTransformer = {
      queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
      application: p.application,
      deploymentUuid: p.deploymentUuid,
      pageParams,
      queryParams: {},
      contextResults: {},
      extractorTemplates: Object.fromEntries(
        Object.keys(foreignKeysPointingToEntity).map((entityUuid) => [
          entityUuid,
          { // TODO: FILTER ON FK TO ONLY THE ONES POINTING TO THE DELETED INSTANCES
            extractorTemplateType: "extractorTemplateForObjectListByEntity",
            // application: p.application,
            applicationSection: p.applicationSection,
            parentName: "",
            parentUuid: {
              transformerType: "returnValue",
              mlSchema: { type: "uuid" },
              value: entityUuid,
            },
          } as ExtractorTemplateForObjectListByEntity,
        ])
      ),
    };

    const foreignKeyUnfilteredObjects: Action2ReturnType =
      await p.domainController.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
        {
          actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
          application: "360fcf1f-f0d4-4f8a-9262-07886e70fa15",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: p.application,
            deploymentUuid: p.deploymentUuid,
            applicationSection: p.applicationSection,
            query: foreignKeyObjectsFetchQuery,
          },
        },
        p.applicationDeploymentMap,
        defaultMiroirModelEnvironment // TODO: use actual current deployment environment
      );

    if (foreignKeyUnfilteredObjects instanceof Action2Error) {
      throw new Error(
        "deleteInstanceWithCascade deleteCascade found foreignKeyUnfilteredObjects with error " +
          foreignKeyUnfilteredObjects
      );
    }

    // if (foreignKeyUnfilteredObjects.returnedDomainElement.elementType != "entityInstanceCollection") {
    //   throw new Error("deleteInstanceWithCascade deleteCascade found foreignKeyUnfilteredObjects not an instance collection " + foreignKeyUnfilteredObjects.returnedDomainElement);
    // }
    log.info(
      "deleteInstanceWithCascade deleteCascade found foreignKeyUnfilteredObjects",
      foreignKeyUnfilteredObjects
      // JSON.stringify(foreignKeyUnfilteredObjects)
    );

    const foreignKeyObjects: EntityInstance[] = (
      Object.values(foreignKeyUnfilteredObjects.returnedDomainElement).flat() as EntityInstance[]
    ).filter(
      (entityInstance: any) =>
        p.entityInstances.find(
          (e) =>
            e.uuid ==
            (entityInstance as any)[foreignKeysPointingToEntity[entityInstance.parentUuid]]
        ) != undefined
    );

    log.info(
      "deleteInstanceWithCascade deleteCascade found foreign key objects pointing to objects to delete",
      foreignKeyObjects
      // JSON.stringify(foreignKeyObjects)
    );
    // recursive calls
    for (const entityInstance of foreignKeyObjects) {
      const entityDefinitionTmp: [string, EntityDefinition] | undefined = Object.entries(
        p.entityDefinitions ?? {}
      ).find((e: [string, EntityDefinition]) => e[1].entityUuid == entityInstance.parentUuid);
      if (!p.entityDefinitions || !entityDefinitionTmp) {
        throw new Error(
          "deleteInstanceWithCascade deleteCascade could not find definition for Entity " +
            entityInstance.parentUuid +
            " entity definition: " +
            JSON.stringify(p.entityDefinitions)
        );
      }

      const entityDefinition: EntityDefinition = entityDefinitionTmp[1];
      deleteCascade({
        domainController: p.domainController,
        application: p.application,
        applicationDeploymentMap: p.applicationDeploymentMap,
        deploymentUuid: p.deploymentUuid,
        applicationSection: p.applicationSection,
        entityDefinition: entityDefinition,
        entityDefinitions: p.entityDefinitions,
        entityInstances: [entityInstance],
      });
    }
  }

  // log.info("deleteInstanceWithCascade deleteCascade foreign key objects to delete", JSON.stringify(foreignKeyObjects));
};
