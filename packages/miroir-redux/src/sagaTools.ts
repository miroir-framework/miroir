import {
  implementPromiseAction
} from "@teroneko/redux-saga-promise";

import { call } from 'redux-saga/effects';

// ###############################################################################
export function handlePromiseActionForSaga (saga, ...args) {
  return function*(actionHandler) {
    if (args.length > 0) {
      yield call(implementPromiseAction, actionHandler, saga.bind(...args,actionHandler))
    } else {
      yield call(implementPromiseAction, actionHandler, saga.bind(undefined,actionHandler))
    }
  }
}
