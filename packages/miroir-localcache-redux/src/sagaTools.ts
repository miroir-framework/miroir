import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import {
  implementPromiseAction
} from "@teroneko/redux-saga-promise";

import { call } from "typed-redux-saga";
import { PersistenceSagaGenReturnType } from "./4_services/persistence/PersistenceActionReduxSaga.js";

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
