import type { BlockEditorBuildMarking } from "miroir-core";
import { createContext, useContext } from "react";

import { useAdminViewParams } from "../useAdminViewParams.js";

// ################################################################################################
// #498 (analysis #497, D1): how the block editor marks build transformers, the ViewParams
// attribute `blockEditorBuildMarking`. Runtime transformers are never marked; a transformer with
// no `interpolation` is evaluated as build, so it is marked.
//
// In the app the value comes from the store's ViewParams. A component test case renders over a
// store without ViewParams: there `BlockEditorDisplayContext` gives the case's value.
// ################################################################################################

export const DEFAULT_BLOCK_EDITOR_BUILD_MARKING: BlockEditorBuildMarking = "dashedOutline";

export const BlockEditorDisplayContext = createContext<{ buildMarking: BlockEditorBuildMarking } | undefined>(
  undefined,
);

export function useBlockEditorBuildMarking(): BlockEditorBuildMarking {
  const caseSetting = useContext(BlockEditorDisplayContext);
  const { viewParamsData } = useAdminViewParams();
  return caseSetting?.buildMarking ?? viewParamsData?.blockEditorBuildMarking ?? DEFAULT_BLOCK_EDITOR_BUILD_MARKING;
}
