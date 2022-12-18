import { MClientCallReturnType, MclientI } from '@App/api/MClient';
import { createAction, createEntityAdapter, createSlice, EntityAdapter, Slice } from '@reduxjs/toolkit';
import { Channel } from 'redux-saga';
import { all, call, put, takeEvery } from 'redux-saga/effects';
import { MiroirEntities, MiroirEntity } from './Entity';
import { MactionWithAsyncDispatchType, Mslice } from './Mslice';

//#########################################################################################
//# ACTION NAMES
//#########################################################################################
export const mEntitySliceStoreActionNames = {
  storeEntities:"storeEntities",
}

const mEntitySliceSagaActionNames = {
  fetchMiroirEntities:"entities/fetchMiroirEntities",
  entitiesStored:"entitiesStored",
}

export const mEntitySliceActionNames = {
  entitiesReceivedNotification:"entitiesReceivedNotification",
}

//#########################################################################################
//# DATA TYPES
//#########################################################################################
declare type MentitySliceStateType = MiroirEntities;
interface MentitySliceActionPayloadType extends MactionWithAsyncDispatchType{
  payload: MentitySliceStateType;
}



//#########################################################################################
//# ENTITY ADAPTER
//#########################################################################################
export const mEntitiesAdapter: EntityAdapter<MiroirEntity> = createEntityAdapter<MiroirEntity>(
  {
    // Assume IDs are stored in a field other than `book.id`
    selectId: (entity) => entity.uuid,
    // Keep the "all IDs" array sorted based on book titles
    sortComparer: (a, b) => a.name.localeCompare(b.name),
  }
)

//#########################################################################################
//# SLICE
//#########################################################################################
export class EntitySlice implements Mslice {
  constructor(
    public client: MclientI,
  ) {
    // console.log("EntitySlice constructor",client)
  }

//#########################################################################################
// public actionToDispatchMap:Map<string,ActionWithPayloadCreator[]> = new Map(
//     [
//       // [
//       //   "entities/" + mEntitySliceStoreActionNames.entitiesReceived,
//       //   [
//       //     {
//       //       actionCreator: mEntityActionsCreators.entitiesReceivedNotification,
//       //       getActionPayload:(state:any, action:ActionWithPayload)=>action.payload
//       //     }
//       //   ]
//       // ]
//     ]
//   );

  //#########################################################################################
  *fetchMentities(
    _this:EntitySlice,
    sliceChannel:Channel<any>,
  ):any {
    try {
      const _client = _this.client;
      const result:MClientCallReturnType = yield call(
        () => _client.get('/fakeApi/Entity/all')
      )
      console.log("fetchMentities sending", mEntitySliceStoreActionNames.storeEntities, result)
      yield put(mEntityActionsCreators[mEntitySliceStoreActionNames.storeEntities](result.data))
      yield put(mEntityActionsCreators[mEntitySliceSagaActionNames.entitiesStored](result.data))
    } catch (e) {
      console.error("fetchMentities exception",e)
      yield put({ type: 'entities/failure/entitiesNotReceived' })
    }
  }

  //#########################################################################################
  *entitiesStored(
    _this: EntitySlice,
    sliceChannel:Channel<any>,
    action:{type:string, payload:MiroirEntities},
  ):any {
    console.log("saga entitiesStored called", action)
    yield put(sliceChannel, action)
  }

  //#########################################################################################
  public *entityRootSaga(
    _this: EntitySlice,
    sliceChannel:Channel<any>,
  ) {
    // take
    yield all([
      takeEvery(
        mEntitySliceSagaActionNames.fetchMiroirEntities, 
        _this.fetchMentities,
        _this,
        sliceChannel,
      ),
      takeEvery(
        mEntitySliceSagaActionNames.entitiesStored, 
        _this.entitiesStored,
        _this,
        sliceChannel,
      ),
    ])
  }
}


//#########################################################################################
//# SLICE
//#########################################################################################
export const mEntitiesSlice:Slice = createSlice(
  {
    name: 'entities',
    initialState: mEntitiesAdapter.getInitialState(),
    reducers: {
      entityAdded: mEntitiesAdapter.addOne,
      // storeEntities(state, action:MentitySliceActionPayloadType) {
      [mEntitySliceStoreActionNames.storeEntities](state, action:MentitySliceActionPayloadType) {
        // console.log("entitiesReceived");
        console.log("reducer storeEtities called", action)
        mEntitiesAdapter.setAll(state, action.payload);
        // console.log("reducer storeEtities called2", JSON.stringify(state), action)
        return state;
      },
    },
  }
)

//#########################################################################################
//# ACTION DEFINITIONS
//#########################################################################################
export const mEntityActionsCreators:any = {
  fetchMiroirEntities:createAction(mEntitySliceSagaActionNames.fetchMiroirEntities),
  entitiesStored:createAction(mEntitySliceSagaActionNames.entitiesStored),
  ...mEntitiesSlice.actions
}

export default mEntitiesSlice.reducer