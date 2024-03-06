import { JzodElement, JzodObject } from "@miroir-framework/jzod-ts";
import {
  MiroirSelectorQueryParams
} from "../1_core/preprocessor-generated/miroirFundamentalType";
import { DomainState } from "./DomainControllerInterface";

export type RecordOfJzodElement = Record<string, JzodElement | undefined>;
export type RecordOfJzodObject = Record<string, JzodObject | undefined>;


// ################################################################################################
export type DomainStateSelector<P extends MiroirSelectorQueryParams, T> = (
  domainState: DomainState,
  params: P
) => T;
