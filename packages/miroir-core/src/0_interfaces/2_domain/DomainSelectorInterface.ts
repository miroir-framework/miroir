// import { JzodElement, JzodObject } from "@miroir-framework/jzod-ts";
import {
  DomainModelGetSingleSelectObjectListQueryQueryParams,
  DomainModelQueryJzodSchemaParams,
  JzodElement,
  JzodObject,
  MiroirSelectorQueryParams
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import { DomainState } from "./DomainControllerInterface";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

export type DomainStateSelectorMap<Q extends MiroirSelectorQueryParams> = {[k:string]: DomainStateSelectorNew<Q, any>};

export interface DomainStateSelectorParams<Q extends MiroirSelectorQueryParams> {
  selectorMap?: DomainStateSelectorMap<Q>
  query: Q
}

export type DomainStateSelectorNew<P extends MiroirSelectorQueryParams, T> = (
  domainState: DomainState,
  params: DomainStateSelectorParams<P>
) => T;


// // ################################################################################################
// // DomainModelQueryJzodSchemaParams = DomainModelGetEntityDefinitionQueryParams | DomainModelGetFetchParamJzodSchemaQueryParams | DomainModelGetSingleSelectQueryJzodSchemaQueryParams;
// export type DomainStateJzodSchemaSelector = (
//   domainState: DomainState,
//   // domainState: ReduxStateWithUndoRedo,
//   params: DomainStateJzodSchemaSelectorParams
//   // query: Q
// ) => RecordOfJzodElement | JzodElement | undefined;

// export type DomainStateJzodSchemaSelectorMap = {[k:string]: DomainModelQueryJzodSchemaParams};

// export interface DomainStateJzodSchemaSelectorParams {
//   selectorMap: DomainStateJzodSchemaSelectorMap
//   query: DomainModelQueryJzodSchemaParams
// }
export type DomainStateJzodSchemaSelector<Q extends DomainModelQueryJzodSchemaParams> = (
  domainState: DomainState,
  // domainState: ReduxStateWithUndoRedo,
  params: DomainStateJzodSchemaSelectorParams<Q>
  // query: Q
) => RecordOfJzodElement | JzodElement | undefined;

// export type DomainStateJzodSchemaSelectorMap<Q extends DomainModelQueryJzodSchemaParams> = {[k:string]: DomainStateJzodSchemaSelector<Q>};
export type DomainStateJzodSchemaSelectorMap = {[k:string]: DomainStateJzodSchemaSelector<DomainModelQueryJzodSchemaParams>};

export interface DomainStateJzodSchemaSelectorParams<Q extends DomainModelQueryJzodSchemaParams> {
  selectorMap: DomainStateJzodSchemaSelectorMap
  query: Q
}

// export type DomainStateJzodSchemaSelector<P extends MiroirSelectorQueryParams, T> = (
//   domainState: DomainState,
//   params: DomainStateSelectorParams<P>
// ) => T;


// ################################################################################################
export type DomainStateSelector<P extends MiroirSelectorQueryParams, T> = (
  domainState: DomainState,
  params: P
) => T;
// export type DomainStateSelector<P extends DomainStateSelectorParams<MiroirSelectorQueryParams>, T> = (

