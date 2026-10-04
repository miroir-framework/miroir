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

/** The switch value, shown at once when changed, and its change, which also saves it. */
export function useShowTransformerTypes(): [boolean, (showTransformerTypes: boolean) => void] {
  const caseSetting = useContext(TransformerTypesDisplayContext);
  const { viewParamsData, saveViewParams } = useAdminViewParams();
  const persisted = caseSetting ? caseSetting.initial : viewParamsData?.showTransformerTypes === true;
  const [changed, setChanged] = useState<boolean | undefined>(undefined);
  const setShowTransformerTypes = useCallback(
    (showTransformerTypes: boolean) => {
      setChanged(showTransformerTypes);
      if (caseSetting) {
        caseSetting.save(showTransformerTypes);
      } else {
        saveViewParams({ showTransformerTypes });
      }
    },
    [caseSetting, saveViewParams],
  );
  return [changed ?? persisted, setShowTransformerTypes];
}
