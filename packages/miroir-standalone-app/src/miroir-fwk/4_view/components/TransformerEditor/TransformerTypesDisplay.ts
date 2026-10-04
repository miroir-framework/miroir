import { createContext, useCallback, useContext, useState } from "react";

import { useAdminViewParams } from "../useAdminViewParams.js";

// ################################################################################################
// #453: the value of the TransformerEditor's "Show transformer types" switch, the ViewParams
// attribute `showTransformerTypes`.
//
// On the Tools page, the editor reads and saves it in the store's ViewParams. A component test
// case renders in its own React root over a store without ViewParams: there the runner provides
// `TransformerTypesDisplayContext` from its host, which the Component Test Sandbox fills from the
// app's ViewParams, so that the switch keeps its value from one case to the next. Under vitest
// without such a host, the switch starts off and is not saved.
// ################################################################################################

export interface TransformerTypesDisplaySetting {
  /** The value the editor starts with. */
  initial: boolean;
  save: (showTransformerTypes: boolean) => void;
}

export const TransformerTypesDisplayContext = createContext<TransformerTypesDisplaySetting | undefined>(undefined);

/**
 * The switch value, shown at once when changed, and its change, which also saves it. A change
 * holds while the saved value stays the one it was made over: when the saved value moves (the
 * save lands, or the setting is changed elsewhere, e.g. in the ViewParams report), it is shown.
 */
export function useShowTransformerTypes(): [boolean, (showTransformerTypes: boolean) => void] {
  const caseSetting = useContext(TransformerTypesDisplayContext);
  const { viewParamsData, saveViewParams } = useAdminViewParams();
  const persisted = caseSetting ? caseSetting.initial : viewParamsData?.showTransformerTypes === true;
  const [local, setLocal] = useState<{ persisted: boolean; changed?: boolean }>({ persisted });
  if (local.persisted !== persisted) {
    // state adjusted while rendering, see https://react.dev/learn/you-might-not-need-an-effect
    setLocal({ persisted });
  }
  const setShowTransformerTypes = useCallback(
    (showTransformerTypes: boolean) => {
      setLocal({ persisted, changed: showTransformerTypes });
      if (caseSetting) {
        caseSetting.save(showTransformerTypes);
      } else {
        saveViewParams({ showTransformerTypes });
      }
    },
    [caseSetting, saveViewParams, persisted],
  );
  return [local.persisted === persisted ? (local.changed ?? persisted) : persisted, setShowTransformerTypes];
}
