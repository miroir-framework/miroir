import { createAsyncThunk, createEntityAdapter, createReducer, createSlice, EntityAdapter, EntityState } from '@reduxjs/toolkit';
import { client } from '../../api/client';
import { all, call, put, takeEvery } from 'redux-saga/effects'
import { RootState } from '../state/store';

export const miroirEntitiesActions = {
  fetchMiroirEntities:"entities/fetchMiroirEntities"
}
export interface MiroirEntityAttribute {
  "id": number,
  "name": string,
  "display": string,
  "type": string,
  "required": boolean,
  "editable": boolean,
  "attributeFormat"?: {
    "name": string,
    "display": string,
  }[],
};

export interface MiroirEntity {
  "uuid": number,
  "entity": string,
  "name":string,
  "attributes"?: MiroirEntityAttribute[],
};

export type MiroirEntities=MiroirEntity[];

export const fetchMiroirEntities = createAsyncThunk('entities/fetchEntities', async () => {
  // const response = await client.get('/fakeApi/entities')
  // console.log("recu reponse",response)
  // return response.data
  return []
})

export function* fetchMiroirEntitiesSaga():any {
  console.log("fetchMiroirEntitiesSaga")
  try {
    let result = yield call(
      () => client.get('/fakeApi/entities')
    )
    console.log("fetchMiroirEntitiesSaga2",result.data)
    yield put({type: "entities/entitiesReceived", payload:result.data})
    // yield put(miroirEntitiesSlice.actions.entitiesReceived(result.payload))
    console.log("fetchMiroirEntitiesSaga3")
    // yield put(miroirEntitiesAdapter.setAll(result.data))
  } catch (e) {
    yield put({ type: 'NUMBER_SAGA_FAILED' })
  }
}


export const miroirEntitiesAdapter: EntityAdapter<MiroirEntity> = createEntityAdapter<MiroirEntity>(
  {
    // Assume IDs are stored in a field other than `book.id`
    selectId: (entity) => entity.uuid,
    // Keep the "all IDs" array sorted based on book titles
    sortComparer: (a, b) => a.name.localeCompare(b.name),
  }
)

// const entitiesReducer = createReducer([], (builder) => {
//   builder
//     .addCase('entities/add', (state, action) => {
//       // "mutate" the array by calling push()
//       // state.push(action.payload)
//     })
// })
// const entitiesReducer = createReducer([], (builder) => {
//   builder
//     // .addCase('entities/add', (state:RootState, action) => {
//     .addCase(miroirEntitiesActions.fetchMiroirEntities, (state, action) => {
//       console.log("fetchMiroirEntities")
//       // miroirEntitiesAdapter.setAll(state, action.payload.miroirEntities)
//     })
// })

export const miroirEntitiesSlice = createSlice({
  name: 'entities',
  // initialState,
  initialState: miroirEntitiesAdapter.getInitialState(),
  reducers: {
    entityAdded: miroirEntitiesAdapter.addOne,
    // entitiesReducer,
    entitiesReceived(state, action) {
      console.log("entitiesReceived", action)
      // Or, call them as "mutating" helpers in a case reducer
      miroirEntitiesAdapter.setAll(state, action.payload)
    },
  },
  extraReducers(builder) {
    builder.addCase(fetchMiroirEntities.fulfilled, miroirEntitiesAdapter.setAll)
  },
})

export default miroirEntitiesSlice.reducer