import { MClientCallReturnType, MclientI } from 'src/api/MClient';
import { createAction, createEntityAdapter, createSlice, EntityAdapter, Slice } from '@reduxjs/toolkit';
import { Channel } from 'redux-saga';
import { all, call, put, putResolve, takeEvery } from 'redux-saga/effects';
import { MiroirEntities, MiroirEntity } from './Entity';
import { MactionWithAsyncDispatchType, Mslice } from './Mslice';
import miroirConfig from "../assets/miroirConfig.json"

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
  *fetchMentities(
    _this:EntitySlice,
    sliceChannel:Channel<any>,
  ):any {
    try {
      const _client = _this.client;
      const result:MClientCallReturnType = yield call(
        () => _client.get(miroirConfig.rootApiUrl+'/'+'Entity/all')
      )
      // console.log("fetchMentities sending", mEntitySliceStoreActionNames.storeEntities, result)
      console.log("fetchMentities received", result.status);
      yield putResolve(_this.mEntityActionsCreators[mEntitySliceStoreActionNames.storeEntities](result.data))
      // console.log("fetchMentities calling entitiesStored");
      yield put(_this.mEntityActionsCreators[mEntitySliceSagaActionNames.entitiesStored](result.data))
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
    // console.log("saga entitiesStored called", action)
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

  //#########################################################################################
  //# SLICE
  //#########################################################################################
  public mEntitiesSlice:Slice = createSlice(
    {
      name: 'entities',
      initialState: mEntitiesAdapter.getInitialState(),
      reducers: {
        entityAdded: mEntitiesAdapter.addOne,
        // storeEntities(state, action:MentitySliceActionPayloadType) {
        [mEntitySliceStoreActionNames.storeEntities](state, action:MentitySliceActionPayloadType) {
          // console.log("reducer storeEtities called", action)
          mEntitiesAdapter.setAll(state, action.payload);
          return state;
        },
      },
    }
  )

  //#########################################################################################
  //# ACTION DEFINITIONS
  //#########################################################################################
  public mEntityActionsCreators:any = {
    fetchMiroirEntities:createAction(mEntitySliceSagaActionNames.fetchMiroirEntities),
    entitiesStored:createAction(mEntitySliceSagaActionNames.entitiesStored),
    ...this.mEntitiesSlice.actions
  }

} // end class EntitySlice




//#########################################################################################
//# DEFAULT EXPORT
//#########################################################################################
// export default mEntitiesSlice.reducer

