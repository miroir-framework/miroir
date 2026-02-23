import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import {
  implementPromiseAction
} from "@teroneko/redux-saga-promise";

import {
  DomainController,
  DomainControllerInterface,
  MiroirContext
} from "miroir-core";
import { call } from "typed-redux-saga";
import { LocalCache } from "./4_services/LocalCache.js";
import PersistenceReduxSaga, {
  PersistenceSagaGenReturnType,
  PersistenceStoreAccessParams,
} from "./4_services/persistence/PersistenceReduxSaga.js";

// ################################################################################################
/**
 * BEWARE: DOES SIDE EFFECTS ON @private persistenceReduxSagaParams
 * 
 * @param miroirContext 
 * @param persistenceReduxSagaParams 
 * @returns 
 */
export function setupMiroirDomainController(
  miroirContext: MiroirContext,
  persistenceReduxSagaParams: PersistenceStoreAccessParams,
): DomainControllerInterface {
  const persistenceSaga: PersistenceReduxSaga = new PersistenceReduxSaga(
    persistenceReduxSagaParams
  );
  
  const localCache: LocalCache = new LocalCache(persistenceSaga);
  
  persistenceReduxSagaParams.localPersistenceStoreControllerManager.setLocalCache(localCache);
  persistenceSaga.run(localCache)
  persistenceReduxSagaParams.localPersistenceStoreControllerManager.setPersistenceStoreLocalOrRemote(persistenceSaga); // useless?

  const domainController = new DomainController(
    persistenceReduxSagaParams.persistenceStoreAccessMode,
    miroirContext,
    localCache, // implements LocalCacheInterface
    persistenceSaga, // implements PersistenceStoreLocalOrRemoteInterface
    // {} as any// new Endpoint(localCache)
  );
  return domainController
}

// ###############################################################################
export function handlePromiseActionForSaga(
  saga: { (a: any): PersistenceSagaGenReturnType; bind?: any },
  ...args: undefined[]
) {
  return function* (
    actionHandler: { payload: any; type: any } & {
      meta: {
        promiseActions: {
          resolved: ActionCreatorWithPayload<any, any>;
          rejected: ActionCreatorWithPayload<any, `${any}/rejected`>;
        };
      };
    }
  ) {
    if (args.length > 0) {
      yield call(implementPromiseAction, actionHandler, saga.bind(...args, actionHandler));
    } else {
      yield call(implementPromiseAction, actionHandler, saga.bind(undefined, actionHandler));
    }
  };
}
