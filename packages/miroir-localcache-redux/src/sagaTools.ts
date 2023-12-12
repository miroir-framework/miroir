import { ActionCreatorWithPayload } from "@reduxjs/toolkit";
import {
  implementPromiseAction
} from "@teroneko/redux-saga-promise";

import { call } from "typed-redux-saga";
import { RemoteStoreSagaGenReturnType } from "./4_services/remoteStore/RemoteStoreRestAccessSaga.js";

// ###############################################################################
export function handlePromiseActionForSaga(
  saga: { (a: any): RemoteStoreSagaGenReturnType; bind?: any },
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
