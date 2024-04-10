import {
  DomainElement,
  DomainElementObject,
  DomainModelQueryJzodSchemaParams,
  JzodElement,
  JzodObject,
  MiroirSelectorQueryParams
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import { DeploymentEntityState } from "./DeploymentStateInterface";
import { DomainState } from "./DomainControllerInterface";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// ################################################################################################
export type QuerySelectorMap<QueryType extends MiroirSelectorQueryParams, StateType> = {
  selectEntityInstanceUuidIndex: QuerySelector<QueryType, StateType, DomainElement>,
  selectEntityInstanceFromObjectQuery: QuerySelector<QueryType, StateType, DomainElement>,
  selectEntityInstanceListFromListQuery: QuerySelector<QueryType, StateType, DomainElement>,
  selectByDomainManyQueries: QuerySelector<QueryType, StateType, DomainElementObject>
};

export interface QuerySelectorParams<QueryType extends MiroirSelectorQueryParams, StateType> {
  selectorMap?: QuerySelectorMap<QueryType, StateType>
  query: QueryType
}

export type QuerySelector<QueryType extends MiroirSelectorQueryParams, StateType, ResultType> = (
  domainState: StateType,
  params: QuerySelectorParams<QueryType, StateType>
) => ResultType;




// ################################################################################################
export type DeploymentEntityStateQuerySelectorMap<Q extends MiroirSelectorQueryParams> = {
  [k: string]: DeploymentEntityStateQuerySelector<Q, any>;
};

export interface DeploymentEntityStateQuerySelectorParams<Q extends MiroirSelectorQueryParams> {
  selectorMap?: DeploymentEntityStateQuerySelectorMap<Q>
  query: Q
}

export type DeploymentEntityStateQuerySelector<Q extends MiroirSelectorQueryParams, T> = (
  domainState: DeploymentEntityState,
  params: DeploymentEntityStateQuerySelectorParams<Q>
) => T;


// // ################################################################################################
export type DeploymentEntityStateJzodSchemaSelector<Q extends DomainModelQueryJzodSchemaParams> = (
  domainState: DeploymentEntityState,
  params: DeploymentEntityStateJzodSchemaSelectorParams<Q>
) => RecordOfJzodElement | JzodElement | undefined;

export type DeploymentEntityStateJzodSchemaSelectorMap = {[k:string]: DeploymentEntityStateJzodSchemaSelector<DomainModelQueryJzodSchemaParams>};

export interface DeploymentEntityStateJzodSchemaSelectorParams<Q extends DomainModelQueryJzodSchemaParams> {
  selectorMap: DeploymentEntityStateJzodSchemaSelectorMap
  query: Q
}

// // ################################################################################################
// export type DomainStateSelector<P extends MiroirSelectorQueryParams, T> = (
//   domainState: DomainState,
//   params: P
// ) => T;

