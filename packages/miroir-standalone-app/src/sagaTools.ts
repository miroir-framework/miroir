import {
  implementPromiseAction, promiseMiddleware
} from "@teroneko/redux-saga-promise";

import { call } from 'redux-saga/effects';

// ###############################################################################
export function handlePromiseActionForSaga (saga, ...args) {
  return function*(action) {
    if (args.length > 0) {
      yield call(implementPromiseAction, action, saga.bind(...args,action))
    } else {
      yield call(implementPromiseAction, action, saga.bind(undefined,action))
    }
  }
}
