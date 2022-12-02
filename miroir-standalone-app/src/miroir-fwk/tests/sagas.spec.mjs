import { call, put } from 'redux-saga/effects'
// import fetchMiroirEntitiesGen from '../entities/entitySlice'
// import { fetchMiroirEntitiesGen } from 'src/miroir-fwk/entities/entitySlice'
// import { miroirEntitiesActions } from 'src/miroir-fwk/entities/entitySlice'
// import { miroirEntitiesActions } from '../entities/entitySlice'
// import { miroirEntitiesActions } from '../entities/entitySlice'
import test from 'tape'

// import { delay, incrementAsync } from './sagas.ts'

const miroirEntitiesActions = {
  fetchMiroirEntities:"entities/fetchMiroirEntities"
}

function* fetchMiroirEntitiesGen() {
  console.log("fetchMiroirEntitiesSaga")
  try {
    let result = yield call(
      () => client.get('/fakeApi/entities')
    )
    yield put({type: "entities/entitiesReceived", payload:result.data})
  } catch (e) {
    yield put({ type: 'NUMBER_SAGA_FAILED' })
  }
}


test(
  'incrementAsync Saga test',
  (assert) => {
    const gen = fetchMiroirEntitiesGen()

    assert.equal(
      gen.next().value,
      call(
        () => client.get('/fakeApi/entities')()
      ),
      // put({type: miroirEntitiesActions.fetchMiroirEntities}),
      'fetchMiroirEntitiesGen must call fake api'
    )

    // assert.deepEqual(
    //   gen.next().value,
    //   call(delay, 1000),
    //   'incrementAsync Saga must call delay(1000)'
    // )
  
    // assert.deepEqual(
    //   gen.next(),
    //   { done: true, value: undefined },
    //   'incrementAsync Saga must be done'
    // )
  
    assert.end()
  }
)