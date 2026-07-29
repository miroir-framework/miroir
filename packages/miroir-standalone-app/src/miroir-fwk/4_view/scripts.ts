import {
  Action2Error,
  Action2ReturnType,
  ApplicationSection,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  defaultMiroirModelEnvironment,
  Domain2QueryReturnType,
  DomainControllerInterface,
  EntityVersion,
  EntityInstance,
  InstanceAction,
  LoggerInterface,
  MiroirLoggerFactory,
  type ApplicationDeploymentMap,
  type Entity,
  type Uuid
} from "miroir-core";
import { packageName } from "../../constants.js";
import { cleanLevel } from "./constants.js";
import type { ExtractorTemplateInstancesByEntity } from "miroir-core";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Scripts"), "UI",
).then((logger: LoggerInterface) => {log = logger});

/** Map of referencing-entity-uuid → FK attribute name pointing at targetEntityUuid. */
export function reverseForeignKeysPointingToEntity(
  schemaCarriers: Entity[],
  targetEntityUuid: string,
): Record<string, string> {
  return Object.fromEntries(
    schemaCarriers
      .map((ed: Entity) => {
        const fkAttributes = Object.entries(ed.mlSchema?.definition ?? {}).find(
          (a) => a[1].tag?.value?.foreignKeyParams?.targetEntity == targetEntityUuid
        );
        return [ed.uuid, fkAttributes ? fkAttributes[0] : undefined];
      })
      .filter((e) => e[0] && e[1])
  ) as Record<string, string>;
}

export const splitEntity = async (p: {
  domainController: DomainControllerInterface,
  deploymentUuid: string;
  applicationSection: ApplicationSection;
  entity: EntityVersion;
  entities: EntityVersion[];
  newEntityName: string,
  splitAttributes: string[]
}) => {
  log.info(
    "++++++++++++++++++++++++++++ splitEntity entity",
    p.entity.name,
  );

}

// ################################################################################################
export const deleteCascade = async (p: {
  domainController: DomainControllerInterface;
  applicationDeploymentMap: ApplicationDeploymentMap;
  application: Uuid;
  deploymentUuid: string;
  applicationSection: ApplicationSection;
  entity: Entity;
  /** Present-model Entities for schema / reverse-FK walk (#221 — no EntityVersion dual-read). */
  entities: Entity[];
  entityInstances: EntityInstance[];
}) => {
  log.info(
    "++++++++++++++++++++++++++++ deleteInstanceWithCascade deleteCascade deleting instances of entity",
    p.entity.name,
    p.entityInstances
  );

  const targetEntityUuid = p.entity.uuid;
  const schemaCarriers: Entity[] = p.entities;

  const foreignKeysPointingToEntity = reverseForeignKeysPointingToEntity(
    schemaCarriers,
    targetEntityUuid,
  );

  log.info(
    "deleteInstanceWithCascade deleteCascade will delete instances of entities that point to current entity",
    foreignKeysPointingToEntity
  );

  const deleteCurrentEntityInstancesAction: InstanceAction = {
    actionType: "deleteInstance",
    endpoint: "ed520de4-55a9-4550-ac50-b1b713b72a89",
    payload: {
      application: p.application,
      applicationSection: p.applicationSection,
      objects: p.entityInstances,
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
      pageParams,
      queryParams: {},
      contextResults: {},
      extractorTemplates: Object.fromEntries(
        Object.keys(foreignKeysPointingToEntity).map((entityUuid) => [
          entityUuid,
          {
            extractorOrCombinerType: "extractorInstancesByEntity",
            application: p.application,
            applicationSection: p.applicationSection,
            parentName: "",
            parentUuid: entityUuid,
          } as ExtractorTemplateInstancesByEntity,
        ])
      ),
    };

    const foreignKeyUnfilteredObjects: Action2ReturnType =
      await p.domainController.handleQueryTemplateActionForServerONLY(
        {
          actionType: "runBoxedQueryTemplateAction",
          endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
          payload: {
            application: p.application,
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

    log.info(
      "deleteInstanceWithCascade deleteCascade found foreignKeyUnfilteredObjects",
      foreignKeyUnfilteredObjects
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
    );
    for (const entityInstance of foreignKeyObjects) {
      const entityCarrier = schemaCarriers.find((e) => e.uuid === entityInstance.parentUuid);
      if (!entityCarrier) {
        throw new Error(
          "deleteInstanceWithCascade deleteCascade could not find present model for Entity " +
            entityInstance.parentUuid +
            " entities: " +
            JSON.stringify(p.entities)
        );
      }

      deleteCascade({
        domainController: p.domainController,
        application: p.application,
        applicationDeploymentMap: p.applicationDeploymentMap,
        deploymentUuid: p.deploymentUuid,
        applicationSection: p.applicationSection,
        entity: entityCarrier,
        entities: p.entities,
        entityInstances: [entityInstance],
      });
    }
  }
};
