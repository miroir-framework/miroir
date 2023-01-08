import { combineReducers, configureStore, EntityState } from '@reduxjs/toolkit'
import createSagaMiddleware, { Channel, channel } from 'redux-saga'
import { all, call } from 'redux-saga/effects'
import { MEntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity'
import { EntitySagas } from 'src/miroir-fwk/4_storage/remote/EntitySagas'
import EntitySlice from 'src/miroir-fwk/4_storage/local/EntitySlice'
import { Minstance } from 'src/miroir-fwk/0_interfaces/1_core/Instance'
import { InstanceSagas } from 'src/miroir-fwk/4_storage/remote/InstanceSagas'
import MInstanceSlice, { MinstanceSliceState } from 'src/miroir-fwk/4_storage/local/MInstanceSlice'
import { Maction } from './Mslice'
import { createUndoableReducer, MreduxWithUndoRedoReducer, MreduxWithUndoRedoStore } from 'src/miroir-fwk/2_domain/undoableReducer'
import { MInstanceStoreInputActionsI, MreduxStoreI } from 'src/miroir-fwk/0_interfaces/4-storage/local/MReduxStore'


//#########################################################################################
//# INSTANCE INTERACTOR
//#########################################################################################
/**
 * The external view of the world for the domain model
 */

export interface MDatastoreInputActionsI {
  fetchInstancesFromDatastoreForEntity(entityName:string):void;
  fetchInstancesFromDatastoreForAllEntities(entities:MEntityDefinition[]):void;
}

export interface MDatastoreOutputNotificationsI {
  allInstancesRefreshed():void;
}



// const persistedState = loadFromLocalStorage();

export interface InnerStoreStateInterface {
  miroirEntities: EntityState<MEntityDefinition>;
  miroirInstances: MinstanceSliceState;
}
export type InnerReducerInterface = (state: InnerStoreStateInterface, action:Maction) => any;

export class MreduxStore implements MreduxStoreI {
  public store:MreduxWithUndoRedoStore;
  public staticReducers:MreduxWithUndoRedoReducer;
  public sagaMiddleware:any;
  public asyncDispatchMiddleware:any;//TODO: set proper type
  // private instanceStore: MInstanceStoreInputActionsI = new InstanceStore(this);

  // public entitySlice: MEntitySlice = new MEntitySlice(this); 

  constructor(
    public entitySagasObject: EntitySagas,
    public instanceSagasObject: InstanceSagas,
  ) {

    this.staticReducers = createUndoableReducer(
      combineReducers(
        {
          miroirEntities: EntitySlice.reducer,
          miroirInstances: MInstanceSlice.reducer,
        }
      )
    );
    this.sagaMiddleware = createSagaMiddleware()

    this.store = configureStore(
      {
        reducer: this.staticReducers,
        middleware: (getDefaultMiddleware) => (
          getDefaultMiddleware()
          .concat(this.sagaMiddleware)
        )
      }
    );

    // create indexedDb local storage, in the case the DB accessed through REST runs in a distinct process.
    // if REST API accesses the indexedDb local storage itself, then the Redux store systematically invalidates
    // any data found in it, and thus re-calls the Rest API for any access. The Redux store is then not used,
    // at least not as a store.

  } //end constructor

  // public dispatch(a) {
  //   return this.store.dispatch(a);
  // }

  public run():void {
    this.sagaMiddleware.run(
      this.rootSaga, this
    );
  }
  // ###############################################################################
  fetchFromApiAndReplaceInstancesForEntity(entityName:string):void {
    // this.dispatch(this.entitySagasObject.mEntitySagaActionsCreators.fetchMiroirEntities())
  }

  // ###############################################################################
  fetchFromApiAndReplaceInstancesForAllEntities():void {
    this.store.dispatch(this.entitySagasObject.mEntitySagaActionsCreators.fetchAllMEntitiesFromDatastore())
  }

  // ###############################################################################
  addInstancesForEntity(entityName:string,instances:Minstance[]):void { 
    this.store.dispatch(
      MInstanceSlice.actionCreators[MInstanceSlice.inputActionNames.AddInstancesForEntity](
        {instances:instances, entity: entityName}
      )
    );
  }

  // ###############################################################################
  modifyInstancesForEntity(entityName:string,instances:Minstance[]):void{
    this.store.dispatch(
      MInstanceSlice.actionCreators[MInstanceSlice.inputActionNames.UpdateInstancesForEntity](
        {instances:instances, entity: entityName}
      )
    );
  }


  // ###############################################################################
  public *rootSaga(_this:MreduxStore):any {
    console.log("Mstore rootSaga");
    const sliceChannel:Channel<any> = yield call(channel);
    yield all(
      [
        _this.entitySagasObject.entityRootSaga(_this.entitySagasObject, sliceChannel),
        _this.instanceSagasObject.instanceRootSaga(_this.instanceSagasObject, sliceChannel),
      ]
    );
  }
}

  // ###############################################################################
  export default MreduxStore;