// Our worker Saga: will perform the async increment task
import { all, call, put, takeEvery } from 'redux-saga/effects'
import { fetchMiroirEntitiesSaga, miroirEntitiesActions } from '../entities/entitySlice'

export const delay = (ms:number) => new Promise(res => setTimeout(res, ms))


export function* incrementAsync() {
  yield put({ type: 'INCREMENT' })
  yield call(delay,1000)
}

// Our watcher Saga: spawn a new incrementAsync task on each INCREMENT_ASYNC
export function* watchIncrementAsync() {
  // yield takeEvery('INCREMENT_ASYNC', incrementAsync)
  yield takeEvery(miroirEntitiesActions.fetchMiroirEntities, fetchMiroirEntitiesSaga)
}

export function* helloSaga():any {
  console.log('Hello Sagas!')
  yield
}

// notice how we now only export the rootSaga
// single entry point to start all Sagas at once
export default function* rootSaga() {
  yield all([
    helloSaga(),
    watchIncrementAsync()
  ])
}

