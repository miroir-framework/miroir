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

/** #217 Phase 12 — Entity or EntityVersion/ED-shaped schema carrier. */
type PresentModelSchemaCarrier = {
  uuid?: string | undefined;
  entityUuid?: string | undefined;
  name?: string | undefined;
  mlSchema?: { definition?: Record<string, any> | undefined } | undefined;
};

function carrierIdentityUuid(carrier: PresentModelSchemaCarrier): string | undefined {
  return carrier.entityUuid ?? carrier.uuid;
}

export const splitEntity = async (p: {
  domainController: DomainControllerInterface,
  deploymentUuid: string;
  applicationSection: ApplicationSection;
  entityVersion: EntityVersion;
  entityDefinitions: EntityVersion[];
  newEntityName: string,
  splitAttributes: string[]
}) => {
  log.info(
    "++++++++++++++++++++++++++++ splitEntity entity",
    p.entityVersion.name,
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
  entityVersion: PresentModelSchemaCarrier;
  entityDefinitions: EntityVersion[];
  /** #217 Phase 9/12 — prefer Entity present model for FK walk when provided. */
  entities?: Entity[];
  entityInstances: EntityInstance[];
}) => {
  log.info(
    "++++++++++++++++++++++++++++ deleteInstanceWithCascade deleteCascade deleting instances of entity",
    p.entityVersion.name,
    p.entityInstances
  );

  const targetEntityUuid = carrierIdentityUuid(p.entityVersion);
  const schemaCarriers: PresentModelSchemaCarrier[] =
    p.entities && p.entities.length > 0
      ? p.entities
      : p.entityDefinitions;

  // finding all entities which have an attribute pointing to the current entity
  const foreignKeysPointingToEntity = Object.fromEntries(
    schemaCarriers
      .map((ed: PresentModelSchemaCarrier) => {
        const fkAttributes = Object.entries(ed.mlSchema?.definition ?? {}).find(
          (a) => a[1].tag?.value?.foreignKeyParams?.targetEntity == targetEntityUuid
        );
        return [carrierIdentityUuid(ed), fkAttributes ? fkAttributes[0] : undefined];
      })
      .filter((e) => e[0] && e[1])
  );

  log.info(
    "deleteInstanceWithCascade deleteCascade will delete instances of entities that point to current entity",
    foreignKeysPointingToEntity
  );

  // // delete current list of objects (on a relational database, this would require suspending foreign key constraints for the involved relations)
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
      // deploymentUuid: p.deploymentUuid,
      pageParams,
      queryParams: {},
      contextResults: {},
      extractorTemplates: Object.fromEntries(
        Object.keys(foreignKeysPointingToEntity).map((entityUuid) => [
          entityUuid,
          { // TODO: FILTER ON FK TO ONLY THE ONES POINTING TO THE DELETED INSTANCES
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
      const entityDefinitionTmp: EntityVersion | undefined = schemaCarriers.find(
        (ed: EntityVersion) => ed.entityUuid == entityInstance.parentUuid,
      );
      if (!entityDefinitionTmp) {
        throw new Error(
          "deleteInstanceWithCascade deleteCascade could not find definition for Entity " +
            entityInstance.parentUuid +
            " entity definition: " +
            JSON.stringify(p.entityDefinitions)
        );
      }

      deleteCascade({
        domainController: p.domainController,
        application: p.application,
        applicationDeploymentMap: p.applicationDeploymentMap,
        deploymentUuid: p.deploymentUuid,
        applicationSection: p.applicationSection,
        entityVersion: entityDefinitionTmp,
        entityDefinitions: p.entityDefinitions,
        entities: p.entities,
        entityInstances: [entityInstance],
      });
    }
  }

  // log.info("deleteInstanceWithCascade deleteCascade foreign key objects to delete", JSON.stringify(foreignKeyObjects));
};
