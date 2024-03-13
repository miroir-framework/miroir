import { JzodElement, JzodObject } from "@miroir-framework/jzod-ts";
import {
  DomainModelGetSingleSelectObjectListQueryQueryParams,
  MiroirSelectorQueryParams
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import { DomainState } from "./DomainControllerInterface";

export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;

export type DomainStateSelectorMap<Q extends MiroirSelectorQueryParams, T> = {[k:string]: DomainStateSelectorNew<Q, any>};

export interface DomainStateSelectorParams<Q extends MiroirSelectorQueryParams> {
  selectorMap: DomainStateSelectorMap<Q, any>
  // selectorMap: {[k:string]: DomainStateSelector<Q, any>}
  query: Q
}


// ################################################################################################
export type DomainStateSelector<P extends MiroirSelectorQueryParams, T> = (
  domainState: DomainState,
  params: P
) => T;
// export type DomainStateSelector<P extends DomainStateSelectorParams<MiroirSelectorQueryParams>, T> = (
export type DomainStateSelectorNew<P extends MiroirSelectorQueryParams, T> = (
  domainState: DomainState,
  params: DomainStateSelectorParams<P>
) => T;
