import { combineReducers, configureStore, EntityState } from '@reduxjs/toolkit'
import createSagaMiddleware, { Channel, channel } from 'redux-saga'
import { all, call, takeEvery } from 'redux-saga/effects'

import { MEntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity'
import { Minstance } from 'src/miroir-fwk/0_interfaces/1_core/Instance'
import { LocalStoreEvent, LocalStoreInterface } from 'src/miroir-fwk/0_interfaces/4-storage/local/MLocalStoreInterface'
import { EventManager, Observer } from 'src/miroir-fwk/1_core/utils/EventManager'
import EntitySlice from 'src/miroir-fwk/4_storage/local/EntitySlice'
import instanceSliceObject, { InstanceSliceState } from 'src/miroir-fwk/4_storage/local/InstanceSlice'
import {
  createUndoableReducer,
  MreduxWithUndoRedoReducer,
  MreduxWithUndoRedoStore
} from "src/miroir-fwk/4_storage/local/undoableReducer"
import { EntitySagas } from 'src/miroir-fwk/4_storage/remote/EntitySagas'
import { InstanceSagas } from 'src/miroir-fwk/4_storage/remote/InstanceSagas'
import { Maction } from './Mslice'


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
  miroirInstances: InstanceSliceState;
}
export type InnerReducerInterface = (state: InnerStoreStateInterface, action:Maction) => any;

/**
 * Local store implementation using Redux.
 * 
 */
export class ReduxStore implements LocalStoreInterface {
  private store:MreduxWithUndoRedoStore;
  private staticReducers:MreduxWithUndoRedoReducer;
  private sagaMiddleware:any;
  // private asyncDispatchMiddleware:any;//TODO: set proper type
  private eventManager: EventManager<LocalStoreEvent> = new EventManager<LocalStoreEvent>();
  // private listeners: Set<MLocalStoreObserver> = new Set();

  // ###############################################################################
  constructor(
    public entitySagasObject: EntitySagas,
    public instanceSagasObject: InstanceSagas,
  ) {
    this.staticReducers = createUndoableReducer(
      combineReducers(
        {
          miroirEntities: EntitySlice.reducer,
          miroirInstances: instanceSliceObject.reducer,
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
  } //end constructor

  // ###############################################################################
  getInnerStore() {
    return this.store;
  }

  // ###############################################################################
  observerSubscribe(observer:Observer<LocalStoreEvent>){
    this.eventManager.observerSubscribe(observer);
  }

  // ###############################################################################
  observerUnsubscribe(observer:Observer<LocalStoreEvent>) {
    this.eventManager.observerUnsubscribe(observer);
  }
  // // ###############################################################################
  // listenerSubscribe(listener:MLocalStoreObserver) {
  //   console.log('listenerSubscribe', listener);
  //   this.listeners.add(listener);
  // }
  // // ###############################################################################
  // listenerUnsubscribe(listener:MLocalStoreObserver) {
  //   this.listeners.delete(listener);
  // }

  // ###############################################################################
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
  fetchInstancesFromDatastoreForEntityList(entities:MEntityDefinition[]):void {
    this.store.dispatch(this.instanceSagasObject.mInstanceSagaActionsCreators.fetchInstancesFromDatastoreForEntityList(entities))
  }

  // ###############################################################################
  fetchFromApiAndReplaceInstancesForAllEntities():void {
    this.store.dispatch(this.entitySagasObject.mEntitySagaActionsCreators.fetchAllMEntitiesFromDatastore())
  }

  // ###############################################################################
  addInstancesForEntity(entityName:string,instances:Minstance[]):void { 
    this.store.dispatch(
      instanceSliceObject.actionCreators[instanceSliceObject.inputActionNames.AddInstancesForEntity](
        {instances:instances, entity: entityName}
      )
    );
  }

  // ###############################################################################
  modifyInstancesForEntity(entityName:string,instances:Minstance[]):void{
    this.store.dispatch(
      instanceSliceObject.actionCreators[instanceSliceObject.inputActionNames.UpdateInstancesForEntity](
        {instances:instances, entity: entityName}
      )
    );
  }


  // ###############################################################################
  *handleEntitySagaOutput (
    _this:ReduxStore,
    event:LocalStoreEvent,
  ):any {
    console.log("MreduxStore handleEntitySagaOutput, event", event);
    // const listener:MLocalStoreObserver=Array.from(_this.listeners.keys())[0];
    // yield call([listener,listener.dispatch],event)
    yield call([_this.eventManager,_this.eventManager.dispatch],event)
  }

  // ###############################################################################
  *handleInstanceSagaOutput (
    _this:ReduxStore,
    event:LocalStoreEvent,
  ):any {
    console.log("MreduxStore handleInstanceSagaOutput");
    // const listener:MLocalStoreObserver=Array.from(_this.listeners.keys())[0];
    yield call([_this.eventManager,_this.eventManager.dispatch],event)
  }

  // ###############################################################################
  public *rootSaga(_this:ReduxStore):any {
    console.log("MreduxStore rootSaga",this);
    const entitySagaOutputChannel:Channel<LocalStoreEvent> = yield call(channel);
    const instanceSagaOutputChannel:Channel<LocalStoreEvent> = yield call(channel);
    yield all(
      [
        takeEvery(entitySagaOutputChannel, _this.handleEntitySagaOutput, _this),
        takeEvery(instanceSagaOutputChannel, _this.handleInstanceSagaOutput, _this),
        _this.entitySagasObject.entityRootSaga(_this.entitySagasObject, entitySagaOutputChannel),
        _this.instanceSagasObject.instanceRootSaga(_this.instanceSagasObject, instanceSagaOutputChannel),
      ]
    );
  }
}

  // ###############################################################################
  export default ReduxStore;