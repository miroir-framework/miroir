import { useMemo } from "react";

import { useSelector } from "react-redux";

// import { JzodAttribute } from "@miroir-framework/jzod-ts";
import {
  ApplicationSection,
  DomainElement,
  DomainModelQueryJzodSchemaParams,
  DomainStateJzodSchemaSelector,
  DomainStateJzodSchemaSelectorParams,
  DomainStateSelector,
  DomainStateSelectorNew,
  EntityDefinition,
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodAttribute,
  JzodElement,
  LocalCacheEntityInstancesSelectorParams,
  LocalCacheQueryParams,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  MiroirSelectorQueryParams,
  RecordOfJzodElement,
  Uuid,
  applicationDeploymentMiroir,
  entityEntityDefinition,
  getLoggerName,
  selectEntityUuidFromJzodAttribute
} from "miroir-core";
import {
  ReduxStateWithUndoRedo,
  applyDomainStateCleanSelector,
  applyDomainStateJzodSchemaSelector,
  applyDomainStateSelector,
  applyDomainStateSelectorNew,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeployment
} from "miroir-localcache-redux";

import { packageName } from "../../constants";
import { cleanLevel } from "./constants";
import { DomainStateSelectorParams } from "miroir-core/src/0_interfaces/2_domain/DomainSelectorInterface";

const loggerName: string = getLoggerName(packageName, cleanLevel,"ReduxHooks");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export type EntityInstanceUuidIndexSelectorParams = LocalCacheEntityInstancesSelectorParams;

// ################################################################################################
export function useDomainStateSelector<P extends MiroirSelectorQueryParams, T >(
  domainStateSelector:DomainStateSelector<P, T>,
  query:P,
  customQueryInterpreter?: { [k: string]: (query:MiroirSelectorQueryParams) => T }
): T {
  const innerSelector = useMemo(
    () => {
      return applyDomainStateSelector(domainStateSelector);
    }, [domainStateSelector]);
  const result: T = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, query)
  );
  return result
}

// ################################################################################################
export function useDomainStateSelectorNew<P extends MiroirSelectorQueryParams, T >(
  domainStateSelector:DomainStateSelectorNew<P, T>,
  selectorParams:DomainStateSelectorParams<P>,
  customQueryInterpreter?: { [k: string]: (query:MiroirSelectorQueryParams) => T }
): T {
  const innerSelector = useMemo(
    () => {
      return applyDomainStateSelectorNew(domainStateSelector);
    }, [domainStateSelector]);
  const result: T = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams)
  );
  return result
}

// ################################################################################################
export function useDomainStateJzodSchemaSelector<Q extends DomainModelQueryJzodSchemaParams>(
  domainStateSelector:DomainStateJzodSchemaSelector<Q>,
  selectorParams:DomainStateJzodSchemaSelectorParams<Q>,
  customQueryInterpreter?: { [k: string]: (query:DomainModelQueryJzodSchemaParams) => RecordOfJzodElement | JzodElement | undefined }
): RecordOfJzodElement | JzodElement | undefined {
  const innerSelector = useMemo(
    () => {
      return applyDomainStateJzodSchemaSelector(domainStateSelector);
    }, [domainStateSelector]);
  const result: RecordOfJzodElement | JzodElement | undefined = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, selectorParams)
  );
  return result
}

// ################################################################################################
export function useDomainStateCleanSelector<P extends MiroirSelectorQueryParams, T >(
  domainStateSelector:DomainStateSelector<P, DomainElement>,
  query:P,
  customQueryInterpreter?: { [k: string]: (query:MiroirSelectorQueryParams) => T }
): T {
  const innerSelector = useMemo(
    () => {
      return applyDomainStateCleanSelector(domainStateSelector);
    }, [domainStateSelector]);
  const result: T = useSelector((state: ReduxStateWithUndoRedo) =>
    innerSelector(state, query)
  );
  return result
}

// ################################################################################################
export function useCurrentModel(deploymentUuid: Uuid | undefined):MetaModel {
  const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
  const selectorParams:LocalCacheQueryParams = useMemo(
    () => ({
      queryType: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid,
      }
    } as LocalCacheQueryParams),
    [deploymentUuid]
  );

  return useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, selectorParams)
  ) as MetaModel
}


// ################################################################################################
export function useEntityInstanceUuidIndexFromLocalCache(params:LocalCacheQueryParams): EntityInstancesUuidIndex | undefined {
  const selectorParams:LocalCacheQueryParams = useMemo(
    () => ({...params}),
    [params]
  );

  return useSelector((state: ReduxStateWithUndoRedo) =>
    selectEntityInstanceUuidIndexFromLocalCache(state, selectorParams)
  )
}

//#########################################################################################
function entityInstancesUuidIndexToEntityInstanceArraySelector(
  state: EntityInstancesUuidIndex
) {
  return Object.values(state);
}

//#########################################################################################
export function useLocalCacheEntityDefinitions(): EntityDefinition[] {
  const miroirEntitiesState = useSelector((state: ReduxStateWithUndoRedo) =>
  selectInstanceArrayForDeploymentSectionEntity(
      state, 
      {
        queryType: "LocalCacheEntityInstancesSelectorParams",
        definition: {
          deploymentUuid:applicationDeploymentMiroir.uuid,
          applicationSection: "model",
          entityUuid: entityEntityDefinition.uuid
        }
      }
    )
  );
  return miroirEntitiesState as EntityDefinition[];
}

//#########################################################################################
export function useLocalCacheSectionEntityDefinitions(
  deploymentUuid: string | undefined,
  section: ApplicationSection | undefined
): EntityDefinition[] {
  const miroirEntitiesState = useSelector((state: ReduxStateWithUndoRedo) =>
  selectInstanceArrayForDeploymentSectionEntity(
      state, 
      {
        queryType: "LocalCacheEntityInstancesSelectorParams",
        definition: {
          deploymentUuid,
          applicationSection: section,
          entityUuid: entityEntityDefinition.uuid
        }
      }
    )
  );
  return miroirEntitiesState as EntityDefinition[];
}

//#########################################################################################
export function useLocalCacheInstancesForJzodAttribute(
  deploymentUuid: string | undefined,
  applicationSection: ApplicationSection | undefined,
  jzodSchema: JzodAttribute | undefined
): EntityInstance[] {
  const entityUuid = selectEntityUuidFromJzodAttribute(jzodSchema)
  const miroirEntities = useSelector((state: ReduxStateWithUndoRedo) =>
    selectInstanceArrayForDeploymentSectionEntity(
      state,
      {
        queryType: "LocalCacheEntityInstancesSelectorParams",
        definition: {
          deploymentUuid,
          applicationSection,
          entityUuid,
        }
      }
    )
  );
  log.info('useLocalCacheInstancesForJzodAttribute',deploymentUuid,applicationSection,jzodSchema,entityUuid,miroirEntities);
  // return Object.values(miroirEntities) as EntityInstance[];
  return miroirEntities as EntityInstance[];
}

