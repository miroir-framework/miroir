import {
  DomainModelQueryJzodSchemaParams,
  JzodElement,
  JzodObject,
  ExtractorTemplateForDomainModel
} from "../1_core/preprocessor-generated/miroirFundamentalType.js";
import { DomainState } from "./DomainControllerInterface.js";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// export type DomainStateQuerySelectorMap<Q extends ExtractorTemplateForDomainModel> = {[k:string]: DomainStateQuerySelector<Q, any>};

// export interface DomainStateQuerySelectorParams<Q extends ExtractorTemplateForDomainModel> {
//   extractorRunnerMap?: DomainStateQuerySelectorMap<Q>
//   query: Q
// }

// export type DomainStateQuerySelector<Q extends ExtractorTemplateForDomainModel, T> = (
//   domainState: DomainState,
//   params: DomainStateQuerySelectorParams<Q>
// ) => T;


// ################################################################################################
// export type DomainStateJzodSchemaSelector<Q extends DomainModelQueryJzodSchemaParams> = (
//   domainState: DomainState,
//   params: DomainStateJzodSchemaSelectorParams<Q>
// ) => RecordOfJzodElement | JzodElement | undefined;

// export type DomainStateJzodSchemaSelectorMap = {[k:string]: DomainStateJzodSchemaSelector<DomainModelQueryJzodSchemaParams>};

// export interface DomainStateJzodSchemaSelectorParams<Q extends DomainModelQueryJzodSchemaParams> {
//   extractorRunnerMap: DomainStateJzodSchemaSelectorMap
//   query: Q
// }

// // ################################################################################################
// export type DomainStateSelector<P extends ExtractorTemplateForDomainModel, T> = (
//   domainState: DomainState,
//   params: P
// ) => T;

