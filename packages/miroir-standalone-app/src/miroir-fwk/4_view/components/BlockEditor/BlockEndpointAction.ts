import {
  addEndpointActionParameter,
  endpointActionHat,
  removeEndpointActionParameter,
  renameEndpointActionParameter,
} from "miroir-core";
import { useMemo } from "react";

import type { BlockDefine } from "./BlockViewMode.js";

// ################################################################################################
// #506 (analysis #497, G9): the body of a composite Endpoint action is a define block. Its header
// names the action by its action type and lists the attributes of its payload, which the body
// reads as `["payload", parameter]`. A parameter change rewrites the whole action at once.
// ################################################################################################

export const ENDPOINT_ACTION_CONTEXT_NAME = "payload";

/**
 * The define block of the composite Endpoint action `action` whose body is shown at
 * `rootLessListKey`, its parameter changes written by `setAction`; `undefined` when `action` is
 * no composite Endpoint action.
 */
export function useBlockDefineOfEndpointAction(
  action: unknown,
  setAction: (action: Record<string, unknown>) => void,
  rootLessListKey: string,
): BlockDefine | undefined {
  return useMemo(() => {
    const hat = endpointActionHat(action);
    if (!hat) {
      return undefined;
    }
    const change = (edit: () => Record<string, unknown>): string | undefined => {
      try {
        setAction(edit());
        return undefined;
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    };
    return {
      rootLessListKey,
      name: hat.name,
      contextName: ENDPOINT_ACTION_CONTEXT_NAME,
      parameters: hat.parameters.map((parameter) => ({ name: parameter.name, read: parameter.read })),
      addParameter: (name) => change(() => addEndpointActionParameter(action, name)),
      renameParameter: (from, to) => change(() => renameEndpointActionParameter(action, from, to)),
      removeParameter: (name) => change(() => removeEndpointActionParameter(action, name)),
    };
  }, [action, setAction, rootLessListKey]);
}
