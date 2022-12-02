import { createEntityAdapter, createSlice, EntityAdapter } from '@reduxjs/toolkit';
import { call, put } from 'redux-saga/effects';
import { client } from '../../api/client';

export const miroirEntitiesActions = {
  fetchMiroirEntities:"entities/fetchMiroirEntities"
}
export interface MiroirEntityAttribute {
  "id": number,
  "name": string,
  "defaultLabel": string,
  "type": string,
  "required": boolean,
  "editable": boolean,
  "attributeFormat"?: {
    "name": string,
    "defaultLabel": string,
  }[],
};

export interface MiroirEntity {
  "uuid": number,
  "entity": string,
  "name":string,
  "attributes"?: MiroirEntityAttribute[],
};

export type MiroirEntities=MiroirEntity[];

export function* fetchMiroirEntitiesGen():any {
  console.log("fetchMiroirEntitiesSaga")
  try {
    let result:{
      status: number;
      data: any;
      headers: Headers;
      url: string;
  } = yield call(
      () => client.get('/fakeApi/entities')
    )
    yield put({type: "entities/entitiesReceived", payload:result.data})
  } catch (e) {
    yield put({ type: 'entities/failure/entitiesNotReceived' })
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

export const miroirEntitiesSlice = createSlice(
  {
    name: 'entities',
    initialState: miroirEntitiesAdapter.getInitialState(),
    reducers: {
      entityAdded: miroirEntitiesAdapter.addOne,
      // entitiesReducer,
      entitiesReceived(state, action) {
        // console.log("entitiesReceived", action)
        // Or, call them as "mutating" helpers in a case reducer
        miroirEntitiesAdapter.setAll(state, action.payload)
      },
    },
  }
)

export default miroirEntitiesSlice.reducer