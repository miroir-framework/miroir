import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import {
  implementPromiseAction
} from "@teroneko/redux-saga-promise";

import { call } from "typed-redux-saga";
import PersistenceReduxSaga, { PersistenceStoreAccessParams, PersistenceSagaGenReturnType } from "./4_services/persistence/PersistenceReduxSaga.js";
import { LocalCacheInterface, MiroirConfigClient, MiroirContext, RestPersistenceClientAndRestClientInterface, DomainControllerInterface, PersistenceStoreControllerManagerInterface, PersistenceStoreControllerManager, ConfigurationService, DomainController, Endpoint, PersistenceStoreLocalOrRemoteInterface } from "miroir-core";
import { LocalCache } from "./4_services/LocalCache.js";

// ################################################################################################
export function setupMiroirDomainController(
  miroirContext: MiroirContext,
  persistenceReduxSagaParams: PersistenceStoreAccessParams,
): DomainControllerInterface {
  const localCache: LocalCache = new LocalCache();
  
  const persistenceSaga: PersistenceReduxSaga = new PersistenceReduxSaga(
    persistenceReduxSagaParams
  );
  
  persistenceReduxSagaParams.localPersistenceStoreControllerManager.setLocalCache(localCache);
  persistenceSaga.run(localCache)
  persistenceReduxSagaParams.localPersistenceStoreControllerManager.setPersistenceStoreLocalOrRemote(persistenceSaga); // useless?

  const domainController = new DomainController(
    persistenceReduxSagaParams.persistenceStoreAccessMode,
    miroirContext,
    localCache, // implements LocalCacheInterface
    persistenceSaga, // implements PersistenceStoreLocalOrRemoteInterface
    new Endpoint(localCache)
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
