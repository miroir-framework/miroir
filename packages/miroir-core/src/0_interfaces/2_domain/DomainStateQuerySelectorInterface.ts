import {
  DomainModelQueryTemplateJzodSchemaParams,
  JzodElement,
  JzodObject,
  ExtractorTemplateForDomainModelDEFUNCT
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import { DomainState } from "./DomainControllerInterface";

// ################################################################################################
export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

// export type DomainStateQuerySelectorMap<Q extends ExtractorTemplateForDomainModelDEFUNCT> = {[k:string]: DomainStateQuerySelector<Q, any>};

// export interface DomainStateQuerySelectorParams<Q extends ExtractorTemplateForDomainModelDEFUNCT> {
//   extractorRunnerMap?: DomainStateQuerySelectorMap<Q>
//   query: Q
// }

// export type DomainStateQuerySelector<Q extends ExtractorTemplateForDomainModelDEFUNCT, T> = (
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
// export type DomainStateSelector<P extends ExtractorTemplateForDomainModelDEFUNCT, T> = (
//   domainState: DomainState,
//   params: P
// ) => T;

