import { combineReducers, configureStore, EntityState } from '@reduxjs/toolkit';
import {
  promiseMiddleware
} from "@teroneko/redux-saga-promise";
import sagaMiddleware from 'redux-saga';
import { all, call } from 'redux-saga/effects';

import { Maction } from './Mslice';
import { EntityRemoteAccessReduxSaga } from 'miroir-fwk/4_services/remoteStore/EntityRemoteAccessReduxSaga';
import {
  EntityDefinition,
  Instance,
  InstanceCollection,
  LocalStoreInterface,
  RemoteDataStoreInterface,
  StoreReturnType,
} from "miroir-core";
import {
  InstanceSlice,
  instanceSliceGeneratedActionNames,
  InstanceSliceState
} from "miroir-fwk/4_services/localStore/InstanceReduxSlice";
import {
  EntitySlice,
  entitySliceInputFullActionNames,
  entitySlicePromiseAction
} from "miroir-fwk/4_services/localStore/EntityReduxSlice";
import {
  createUndoRedoReducer,
  MreduxWithUndoRedoReducer, MreduxWithUndoRedoStore
} from "miroir-fwk/4_services/localStore/UndoRedoReducer";
import {
  instanceSagaGeneratedActionNames,
  instanceSagaInputActionNamesArray,
  InstanceRemoteAccessReduxSaga
} from "miroir-fwk/4_services/remoteStore/InstanceRemoteAccessReduxSaga";


//#########################################################################################
//# INSTANCE INTERACTOR
//#########################################################################################
/**
 * The external view of the world for the domain model
 */

export interface MDatastoreInputActionsI {
  fetchInstancesFromDatastoreForEntity(entityName:string):void;
  fetchInstancesFromDatastoreForEntityList(entities:EntityDefinition[]):void;
}

export interface MDatastoreOutputNotificationsI {
  allInstancesRefreshed():void;
}

export interface InnerStoreStateInterface {
  miroirEntities: EntityState<EntityDefinition>;
  miroirInstances: InstanceSliceState;
}
export type InnerReducerInterface = (state: InnerStoreStateInterface, action:Maction) => any;


// ###############################################################################
/**
 * Local store implementation using Redux.
 * 
 */
export class ReduxStore implements LocalStoreInterface, RemoteDataStoreInterface {
  private store: MreduxWithUndoRedoStore;
  private staticReducers: MreduxWithUndoRedoReducer;
  private sagaMiddleware: any;

  // ###############################################################################
  constructor(
    public entityRemoteAccessReduxSaga: EntityRemoteAccessReduxSaga,
    public instanceRemoteAccessReduxSaga: InstanceRemoteAccessReduxSaga
  ) {
    this.staticReducers = createUndoRedoReducer(
      combineReducers(
        {
          miroirEntities: EntitySlice.reducer,
          miroirInstances: InstanceSlice.reducer,
        }
      )
    );

    this.sagaMiddleware = sagaMiddleware();

    const ignoredActionsList = [
      ...entityRemoteAccessReduxSaga.entitySagaInputActionNames,
      ...entityRemoteAccessReduxSaga.entitySagaGeneratedActionNames,
      ...entitySliceInputFullActionNames,
      ...instanceSagaInputActionNamesArray,
      ...instanceSagaGeneratedActionNames,
      ...instanceSliceGeneratedActionNames,
    ];

    console.log('ReduxStore ignoredActionsList',ignoredActionsList);
    this.store = configureStore({
      reducer: this.staticReducers,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            // Ignore these action types
            ignoredActions: ignoredActionsList,
            // Ignore these field paths in all actions
            ignoredActionPaths: ["meta.promiseActions"],
          },
        })
          .concat(promiseMiddleware)
          .concat(this.sagaMiddleware),
    });
  } //end constructor

  // ###############################################################################
  getInnerStore() {
    return this.store;
  }

  // ###############################################################################
  public run(): void {
    this.sagaMiddleware.run(this.rootSaga.bind(this));
  }

  // ###############################################################################
  handleAction(action: DomainAction): Promise<StoreReturnType> {

  }
  
  // ###############################################################################
  fetchAllEntityDefinitionsFromRemoteDataStore(): Promise<StoreReturnType> {
    return this.store.dispatch(
      this.entityRemoteAccessReduxSaga.entitySagaInputActionsCreators.fetchAllEntityDefinitionsFromRemoteDatastore()
    );
  }

  // ###############################################################################
  replaceAllEntityDefinitions(entityDefinitions:EntityDefinition[]):Promise<StoreReturnType> {
    // clears all entities before putting the given ones in the store
    console.log("ReduxStore replaceAllEntityDefinitions called entityDefinitions",entityDefinitions,);
    return this.store.dispatch(entitySlicePromiseAction(entityDefinitions))
  }

  // ###############################################################################
  // addEntityDefinitions(entities: EntityDefinition[]): Promise<void> {
  //   // returns an exception if at least one of the entities already exists.
  //   return this.store.dispatch(
  //     entitySliceObject.actionCreators[entitySliceObject.inputActionNames.replaceEntities](entities)
  //   );
  // }

  // ###############################################################################
  // modifyEntityDefinitions(entityDefinitions: EntityDefinition[]): void {
  //   this.store.dispatch(
  //     instanceSliceObject.actionCreators[instanceSliceObject.inputActionNames.UpdateInstancesForEntity]({
  //       instances: instances,
  //       entity: entityName,
  //     })
  //   );
  // }

  // ###############################################################################
  fetchInstancesForEntityListFromRemoteDatastore(entities: EntityDefinition[]): Promise<StoreReturnType> {
    console.log("ReduxStore fetchInstancesForEntityListFromRemoteDatastore called, entities",entities,);
    if (entities !== undefined) {
      console.log("dispatching saga fetchInstancesForEntityListFromRemoteDatastore with entities",entities );
      return this.store.dispatch(
        this.instanceRemoteAccessReduxSaga.instanceSagaInputActionsCreators.fetchInstancesForEntityListFromRemoteDatastore(entities)
      );
    }
  }

  // ###############################################################################
  replaceAllInstances(instances:InstanceCollection[]):Promise<void> {
    return this.store.dispatch(
      this.instanceRemoteAccessReduxSaga.instanceSliceInputPromiseActions.ReplaceAllInstances.creator(instances)
    );
  }

  // ###############################################################################
  addInstancesForEntity(entityName: string, instances: Instance[]): void {
    // this.store.dispatch(
    //   instanceSliceObject.actionCreators[instanceSliceObject.inputActionNames.AddInstancesForEntity]({
    //     instances: instances,
    //     entity: entityName,
    //   })
    // );
  }

  // ###############################################################################
  modifyInstancesForEntity(entityName: string, instances: Instance[]): void {
    // this.store.dispatch(
    //   instanceSliceObject.actionCreators[instanceSliceObject.inputActionNames.UpdateInstancesForEntity]({
    //     instances: instances,
    //     entity: entityName,
    //   })
    // );
  }

  // ###############################################################################
  public *rootSaga(
  ) {
    console.log("ReduxStore rootSaga running", this.entityRemoteAccessReduxSaga, this.instanceRemoteAccessReduxSaga);
    yield all([
      this.entityRemoteAccessReduxSaga.entityRootSaga.bind(this.entityRemoteAccessReduxSaga)(),
      this.instanceRemoteAccessReduxSaga.instanceRootSaga.bind(this.instanceRemoteAccessReduxSaga)(),
    ]);
  }
}

  // ###############################################################################
  export default {};