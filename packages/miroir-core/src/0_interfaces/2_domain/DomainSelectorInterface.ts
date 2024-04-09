import {
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

export type DomainStateSelectorNew<Q extends MiroirSelectorQueryParams, T> = (
  domainState: DomainState,
  params: DomainStateSelectorParams<Q>
) => T;


// // ################################################################################################
export type DomainStateJzodSchemaSelector<Q extends DomainModelQueryJzodSchemaParams> = (
  domainState: DomainState,
  params: DomainStateJzodSchemaSelectorParams<Q>
) => RecordOfJzodElement | JzodElement | undefined;

export type DomainStateJzodSchemaSelectorMap = {[k:string]: DomainStateJzodSchemaSelector<DomainModelQueryJzodSchemaParams>};

export interface DomainStateJzodSchemaSelectorParams<Q extends DomainModelQueryJzodSchemaParams> {
  selectorMap: DomainStateJzodSchemaSelectorMap
  query: Q
}

// // ################################################################################################
// export type DomainStateSelector<P extends MiroirSelectorQueryParams, T> = (
//   domainState: DomainState,
//   params: P
// ) => T;

