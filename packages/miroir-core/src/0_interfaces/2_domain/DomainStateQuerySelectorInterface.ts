import {
  DomainModelQueryTemplateJzodSchemaParams,
  JzodElement,
  JzodObject,
  MiroirQueryTemplate
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainState } from "./DomainControllerInterface.js";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// export type DomainStateQuerySelectorMap<Q extends MiroirQueryTemplate> = {[k:string]: DomainStateQuerySelector<Q, any>};

// export interface DomainStateQuerySelectorParams<Q extends MiroirQueryTemplate> {
//   extractorRunnerMap?: DomainStateQuerySelectorMap<Q>
//   query: Q
// }

// export type DomainStateQuerySelector<Q extends MiroirQueryTemplate, T> = (
//   domainState: DomainState,
//   params: DomainStateQuerySelectorParams<Q>
// ) => T;


// ################################################################################################
// export type DomainStateJzodSchemaSelector<Q extends DomainModelQueryTemplateJzodSchemaParams> = (
//   domainState: DomainState,
//   params: DomainStateJzodSchemaSelectorParams<Q>
// ) => RecordOfJzodElement | JzodElement | undefined;

// export type DomainStateJzodSchemaSelectorMap = {[k:string]: DomainStateJzodSchemaSelector<DomainModelQueryTemplateJzodSchemaParams>};

// export interface DomainStateJzodSchemaSelectorParams<Q extends DomainModelQueryTemplateJzodSchemaParams> {
//   extractorRunnerMap: DomainStateJzodSchemaSelectorMap
//   query: Q
// }

// // ################################################################################################
// export type DomainStateSelector<P extends MiroirQueryTemplate, T> = (
//   domainState: DomainState,
//   params: P
// ) => T;

