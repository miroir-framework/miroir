import { z } from "zod";
import {
  ActionCreatorWithPayload, createEntityAdapter,
  createSelector,
  createSlice,
  EntityAdapter,
  EntityState,
  EntityId,
  PayloadAction,
  Slice
} from "@reduxjs/toolkit";
import { memoize as _memoize } from "lodash";
import {
  EntitiesDomainState,
  DomainStateSelector,
  EntityInstance,
  EntityInstanceCollection,
  DomainDataAction,
  DomainModelAction,
  ModelEntityUpdateConverter,
  EntityDefinition,
  DomainAction,
  entityDefinitionEntityDefinition,
  entityEntity,
  entityEntityDefinition,
  MetaEntity,
  Uuid,
  ZinstanceSchema,
  applicationDeploymentMiroir,
  Zinstance,
  DomainActionWithDeployment,
} from "miroir-core";
import { ReduxStateChanges, ReduxStateWithUndoRedo } from "./UndoRedoReducer";

export const localCacheSliceName:string = "localCache";
//#########################################################################################
// store actions are made visible to the outside world for potential interception by the transaction mechanism of undoableReducer
export const localCacheSliceInputActionNamesObject = {
  handleLocalCacheModelAction: "handleLocalCacheModelAction",
  handleLocalCacheDataAction: "handleLocalCacheDataAction",
  handleLocalCacheAction: "handleLocalCacheAction",
  // UpdateInstancesForEntity: "UpdateInstancesForEntity",
  // AddInstancesForEntity: "AddInstancesForEntity",
};
export type LocalCacheSliceInputActionNamesObjectTuple = typeof localCacheSliceInputActionNamesObject;
export type LocalCacheSliceInputActionNamesKey = keyof LocalCacheSliceInputActionNamesObjectTuple;
export const localCacheSliceInputActionNames = Object.values(localCacheSliceInputActionNamesObject);
export const localCacheSliceInputFullActionNames = Object.values(localCacheSliceInputActionNamesObject).map(n=>localCacheSliceName+'/'+n); // TODO: use map type?

export function getPromiseActionStoreActionNames(promiseActionNames:string[]):string[] {
  return promiseActionNames 
    .reduce(
      (acc:string[],curr) => acc.concat([curr,'saga-' + curr,curr+'/rejected']),[]
    )
  ;
}

export const localCacheSliceGeneratedActionNames = getPromiseActionStoreActionNames(localCacheSliceInputActionNames);

//#########################################################################################
//# DATA TYPES
//#########################################################################################
// export const ZLocalCacheEntitySliceState = z.record(z.string().uuid(),z.ZodType<EntityState<EntityInstance>>);

export const ZEntityId = z.union([z.number(),z.string()]);
export const ZDictionary = z.record(z.string().uuid(),ZinstanceSchema);
export type MiroirDictionary = z.infer<typeof ZDictionary>;
export const ZEntityState = z.object({ids:ZEntityId, entities:ZDictionary});
// export const ZLocalCacheEntitySliceState = z.record(z.string().uuid(),ZEntityState);
// export type LocalCacheEntitySliceState = {[entityUuid: Uuid]:z.infer<typeof ZEntityState>};
export type LocalCacheEntitySliceState = {[entityUuid: Uuid]:EntityState<Zinstance>};

// export const ZLocalCacheApplicationSliceState = z.object({model:ZLocalCacheEntitySliceState,data:ZLocalCacheEntitySliceState});
// export const ZLocalCacheDeploymentSliceState = z.record(z.string().uuid(),ZLocalCacheApplicationSliceState);
// export const ZLocalCacheDeploymentSliceState = z.record(z.string().uuid(),ZLocalCacheEntitySliceState);

// export const ZOldLocalCacheSliceState = z.record(z.string().uuid(),ZLocalCacheEntitySliceState);
// export const ZNewLocalCacheSliceState = z.object({new:ZLocalCacheDeploymentSliceState,});
// export type NewLocalCacheSliceState = z.infer<typeof ZLocalCacheDeploymentSliceState>;
export type NewLocalCacheSliceState = {[deploymentUuid: Uuid]: LocalCacheEntitySliceState};;

// instance slice state cannot really be defined statically, since it changes at run-time, depending on the set of defined instances
export interface LocalCacheSliceState {
  // "newFormat": z.infer<typeof ZLocalCacheDeploymentSliceState>,
  [parentUuid: Uuid]: EntityState<EntityInstance>
}


export interface titi {
  [deploymentUuid: string]: {[parentUuid: string]:string}
}

export const titiSchema = z.record(z.record(z.string()))
type TITI = z.infer<typeof titiSchema>
// export type DomainDataAction = PayloadAction<EntityInstanceCollection>;

//#########################################################################################
//# Entity Adapter
//#########################################################################################
// const getLocalCacheSliceDeploymentAdapter: (
//   // parentName: string
//   deploymentUuid: string
// ) => EntityAdapter<EntityInstance> = _memoize(
//   (deploymentUuid: string) => {
//     // console.log("getEntityAdapter creating EntityAdapter For entity", parentName);
//     const result = createEntityAdapter<EntityInstance>({
//       selectId: (entity) => entity.uuid,
//       // Keep the "all IDs" array sorted based on book titles
//       // sortComparer: (a, b) => a.name.localeCompare(b.name),
//     });

//     console.log("getEntityAdapter creating EntityAdapter For entity", deploymentUuid,"result",result);

//     return result;
//   }
// );

const getLocalCacheSliceEntityAdapter: (
  // parentName: string
  entityUuid: string
) => EntityAdapter<Zinstance> = _memoize(
// ) => EntityAdapter<EntityInstance> = _memoize(
  (entityUuid: string) => {
    // console.log("getEntityAdapter creating EntityAdapter For entity", parentName);
    // const result = createEntityAdapter<EntityInstance>({
    const result:EntityAdapter<Zinstance> = createEntityAdapter<Zinstance>({
      // Assume IDs are stored in a field other than `book.id`
      selectId: (entity) => entity.uuid,
      // Keep the "all IDs" array sorted based on book titles
      // sortComparer: (a, b) => a.name.localeCompare(b.name),
    });

    console.log("getEntityAdapter creating EntityAdapter For entity", entityUuid,"result",result);

    return result;
  }
);

//#########################################################################################
function getInitializedDeploymentEntityAdapter(deploymentUuid: string, entityUuid: string, state: NewLocalCacheSliceState) {
  // TODO: refactor so as to avoid side effects!
  const sliceEntityAdapter = getLocalCacheSliceEntityAdapter(entityUuid);
  if (!state) {
    console.log('getInitializedDeploymentEntityAdapter state is undefined, initializing state!',JSON.stringify(state),state == undefined);
    state = {[deploymentUuid]:{[entityUuid]: sliceEntityAdapter.getInitialState()}};
  } else {
    if (!state[deploymentUuid]) {
      console.log('getInitializedDeploymentEntityAdapter for deployment',deploymentUuid,'is undefined, initializing state!',JSON.stringify(state),state == undefined);
      
      state[deploymentUuid] = {[entityUuid]: sliceEntityAdapter.getInitialState()};
    } else {
      if (!state[deploymentUuid][entityUuid]) {
        console.log('getInitializedDeploymentEntityAdapter for deployment',deploymentUuid,'and entityUuid',entityUuid,'is undefined, initializing state!');
        
        state[deploymentUuid][entityUuid] = sliceEntityAdapter.getInitialState();
      }
    }
  }
  console.log('getInitializedDeploymentEntityAdapter state',JSON.stringify(state));
  return sliceEntityAdapter;
} 

// //#########################################################################################
// //TODO: does side effect! Depends on state structure!
// function getInitializedEntityAdapter(parentUuid: string, state: LocalCacheSliceState) {
//   // TODO: refactor so as to avoid side effects!
//   const sliceEntityAdapter = getLocalCacheSliceEntityAdapter(parentUuid);
//   if (state[parentUuid] == undefined) {
//     console.log('getInitializedEntityAdapter for',parentUuid,'initializing state!');
    
//     state[parentUuid] = sliceEntityAdapter.getInitialState();
//   }
//   return sliceEntityAdapter;
// } 

//#########################################################################################
//# REDUCER FUNCTION
//#########################################################################################
function ReplaceInstancesForDeploymentEntity(deploymentUuid: string, state: NewLocalCacheSliceState, action: PayloadAction<EntityInstanceCollection>) {
  const entity = state[deploymentUuid]?(state[deploymentUuid][entityEntity.uuid]?.entities[action.payload.parentUuid]):undefined;
  console.log('ReplaceInstancesForDeploymentEntity for deployment',deploymentUuid,'entity',(entity?entity['name']:'entity not found for deployment'),action.payload.parentUuid,action.payload.parentName,action.payload.instances);
  const sliceEntityAdapter = getInitializedDeploymentEntityAdapter(deploymentUuid,action.payload.parentUuid,state);

  state[deploymentUuid][action.payload.parentUuid] = sliceEntityAdapter.setAll(state[deploymentUuid][action.payload.parentUuid], action.payload.instances);
  console.log('ReplaceInstancesForDeploymentEntity for deployment',deploymentUuid, 'entity',action.payload.parentUuid,action.payload.parentName);
  
}

// function ReplaceInstancesForEntity(state: LocalCacheSliceState, action: PayloadAction<EntityInstanceCollection>) {
//   const entity = state[entityEntity.uuid]?.entities[action.payload.parentUuid]
//   console.log('ReplaceInstancesForEntity named', entity?entity['name']:'entity not found',action.payload.parentUuid,action.payload.instances);
//   const sliceEntityAdapter = getInitializedEntityAdapter(action.payload.parentUuid,state);

//   state[action.payload.parentUuid] = sliceEntityAdapter.setAll(state[action.payload.parentUuid], action.payload.instances);
// }


//#########################################################################################
function handleLocalCacheDataAction(state: NewLocalCacheSliceState, deploymentUuid: Uuid, action: DomainDataAction) {
  // const deploymentUuid = applicationDeploymentMiroir.uuid
  console.log('localCacheSliceObject', localCacheSliceInputActionNamesObject.handleLocalCacheDataAction, 'called', action);
  switch (action.actionName) {
    case 'create': {
      for (let instanceCollection of action.objects) {
        console.log('create for entity',instanceCollection.parentName, instanceCollection.parentUuid, 'instances', instanceCollection.instances, JSON.stringify(state));
        
        const sliceEntityAdapter = getInitializedDeploymentEntityAdapter(deploymentUuid, instanceCollection.parentUuid, state);
        console.log('localCacheSliceObject handleLocalCacheDataAction', instanceCollection.parentName, instanceCollection.parentUuid, 'state before insert',JSON.stringify(state));
        sliceEntityAdapter.addMany(state[deploymentUuid][instanceCollection.parentUuid], instanceCollection.instances);
        console.log('localCacheSliceObject handleLocalCacheDataAction', instanceCollection.parentName, instanceCollection.parentUuid, 'state after insert',JSON.stringify(state));
        if(instanceCollection.parentUuid == entityDefinitionEntityDefinition.uuid) {// TODO: does it work? How?
          console.log('localCacheSliceObject', localCacheSliceInputActionNamesObject.handleLocalCacheDataAction,'creating entityAdapter for Entities',instanceCollection.instances.map(i=>i['name']));
          
          instanceCollection.instances.forEach(i=>getInitializedDeploymentEntityAdapter(deploymentUuid, i['uuid'], state));
        }
        console.log('create done',JSON.stringify(state[deploymentUuid]));
      }
      break;
    }
    case 'delete': {
      for (let instanceCollection of action.objects) {
        console.log('localCacheSliceObject handleLocalCacheDataAction delete', instanceCollection);
        
        const sliceEntityAdapter = getInitializedDeploymentEntityAdapter(deploymentUuid,instanceCollection.parentUuid, state);
        console.log('localCacheSliceObject handleLocalCacheDataAction delete state before',JSON.stringify(state[deploymentUuid][instanceCollection.parentUuid]));
        
        sliceEntityAdapter.removeMany(state[deploymentUuid][instanceCollection.parentUuid], instanceCollection.instances.map(i => i.uuid));
        console.log('localCacheSliceObject handleLocalCacheDataAction delete state after',JSON.stringify(state[deploymentUuid][instanceCollection.parentUuid]));
      }
      break;
    }
    case 'update': {
      for (let instanceCollection of action.objects) {
        const sliceEntityAdapter = getInitializedDeploymentEntityAdapter(deploymentUuid,instanceCollection.parentUuid, state);
        sliceEntityAdapter.updateMany(state[deploymentUuid][instanceCollection.parentUuid], instanceCollection.instances.map(i => ({ id: i.uuid, changes: i })));
        // getSliceEntityAdapter(action.payload.parentName).updateOne(state[action.payload.parentName], entityUpdate);
      }
      break;
    }
    default:
      console.warn('localCacheSliceObject handleLocalCacheModelAction action could not be taken into account, unkown action', action.actionName);
  }
}

//#########################################################################################
function handleLocalCacheModelAction(state: NewLocalCacheSliceState, deploymentUuid: Uuid, action: DomainModelAction) {
  // const deploymentUuid = applicationDeploymentMiroir.uuid;
  console.log('localCacheSliceObject', localCacheSliceInputActionNamesObject.handleLocalCacheModelAction, 'called', action.actionName, action);
  switch (action.actionName) {
    case 'replace': {
      for (let instanceCollection of action.objects) {
        ReplaceInstancesForDeploymentEntity(deploymentUuid, state, { type: "ReplaceInstancesForEntity", payload: instanceCollection } as PayloadAction<EntityInstanceCollection>);
      }
      break;
    }
    case 'commit': {
      // reset transation contents
      // send ModelEntityUpdates to server for execution?
      // for (let instanceCollection of action.payload.objects) {
      //   ReplaceInstancesForEntity(state, { type: "ReplaceInstancesForEntity", payload: instanceCollection } as PayloadAction<EntityInstanceCollection>);
      // }
      break;
    }
    case "UpdateMetaModelInstance": {
      // not transactional??
      console.log('localCacheSliceObject UpdateMetaModelInstance',action);
      const domainDataAction:DomainDataAction = {
        actionType:"DomainDataAction",
        actionName:action.update.updateActionName,
        objects: action.update.objects
      }
      ;
      console.log('updateModel domainDataAction',domainDataAction);

      handleLocalCacheDataAction(state, deploymentUuid, domainDataAction);
      break;
    }
    case "updateEntity": {
      console.log('localCacheSliceObject updateModel',action, state[deploymentUuid][entityEntity.uuid],state[deploymentUuid][entityEntityDefinition.uuid]);
      // infer from ModelEntityUpdates the CUD actions to be performed on model Entities, Reports, etc.
      // send CUD actions to local cache
      // have undo / redo contain both(?) local cache CUD actions and ModelEntityUpdates
      const domainDataAction:DomainDataAction = 
        ModelEntityUpdateConverter.modelEntityUpdateToLocalCacheUpdate(
          Object.values(state[deploymentUuid][entityEntity.uuid].entities) as MetaEntity[],
          Object.values(state[deploymentUuid][entityEntityDefinition.uuid].entities) as EntityDefinition[],
          action.update.modelEntityUpdate
        )
      ;
      console.log('updateModel domainDataAction',domainDataAction);

      handleLocalCacheDataAction(state, deploymentUuid, domainDataAction);
      break;
    }
    default:
      console.warn('localCacheSliceObject handleLocalCacheModelAction action could not be taken into account, unkown action', action.actionName);
  }
}

//#########################################################################################
function handleLocalCacheAction(state: NewLocalCacheSliceState, deploymentUuid: Uuid, action: DomainAction) {
  console.log('localCacheSliceObject', localCacheSliceInputActionNamesObject.handleLocalCacheAction, 'actionType',action.actionType, 'called', action);
  switch (action.actionType) {
    case 'DomainDataAction': {
      handleLocalCacheDataAction(state, deploymentUuid, action);
      break;
    }
    case 'DomainModelAction': {
      handleLocalCacheModelAction(state, deploymentUuid, action);
      break;
    }
    default:
      console.warn('localCacheSliceObject handleLocalCacheAction action could not be taken into account, unkown action', action);
  }
}

//#########################################################################################
//# SLICE
//#########################################################################################
export const localCacheSliceObject: Slice<NewLocalCacheSliceState> = createSlice({
  name: localCacheSliceName,
  // initialState: { [entityDefinitionEntityDefinition.uuid]: getLocalCacheSliceEntityAdapter(entityDefinitionEntityDefinition.uuid).getInitialState() },
  initialState: {} as NewLocalCacheSliceState,
  reducers: {
    // [localCacheSliceInputActionNamesObject.handleLocalCacheAction](state: NewLocalCacheSliceState, action: PayloadAction<DomainAction>) {
    [localCacheSliceInputActionNamesObject.handleLocalCacheAction](state: NewLocalCacheSliceState, action: PayloadAction<DomainActionWithDeployment>) {
      // handleLocalCacheAction(state,applicationDeploymentMiroir.uuid,action.payload);
      handleLocalCacheAction(state,action.payload.deploymentUuid,action.payload.domainAction);
    },
  },
});



//#########################################################################################
//# ACTION CREATORS
//#########################################################################################
// export const mInstanceSliceActionsCreators:{[actionCreatorName:string]:any} = {
type LocalCacheSliceActionCreator<P> =
  | ActionCreatorWithPayload<P, `${string}/${string}`>
  // | ActionCreatorWithoutPayload<`${string}/${string}`>
;

const actionsCreators: {
  [actionCreatorName: string]: LocalCacheSliceActionCreator<any>;
} = {
  ...localCacheSliceObject.actions,
};

//#########################################################################################
//# SLICE OBJECT
//#########################################################################################
export const LocalCacheSlice = {
  reducer: localCacheSliceObject.reducer,
  actionCreators: actionsCreators,
  inputActionNames: localCacheSliceInputActionNamesObject,
};


//#########################################################################################
//# SELECTORS
//#########################################################################################
export const selectMiroirEntityInstances = createSelector(
  (state: LocalCacheSliceState) => state,
  (items) => items
);

//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it really memoize? Doen't this imply caching the whole value, which can be really large? Or is it juste the selector?
export const selectCurrentTransaction: () => ((state: ReduxStateWithUndoRedo) => ReduxStateChanges[]) = 
// _memoize(
  () => {
    return createSelector(
      (state: ReduxStateWithUndoRedo) => {
        return state.pastModelPatches;
      },
      (items: ReduxStateChanges[]) => items
    );
  }
// )
;

//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it really memoize? Doen't this imply caching the whole value, which can be really large? Or is it juste the selector?
export const selectInstancesForEntity: (entityUuid: string) => any = _memoize(
  (parentUuid: string) => {
    return createSelector(
      (state: ReduxStateWithUndoRedo) => {
        // return state.presentModelSnapshot.miroirInstances[parentUuid];
        const innerState = state.presentModelSnapshot.miroirInstances;
        const deployment = innerState?innerState[applicationDeploymentMiroir.uuid]:undefined;
        const instances = deployment?deployment[parentUuid]:[];
        return instances;
      },
      (items: any) => items
    );
  }
);

//#########################################################################################
// TODO: precise type for return value of selectInstancesForEntity. This is a Selector, which reselect considers a Dictionnary...
// TODO: should it really memoize? Doen't this imply caching the whole value, which can be really large? Or is it juste the selector?
export const selectInstancesForDeploymentEntity: (deploymentUuid:string, entityUuid: string) => any = 
// _memoize(
  (deploymentUuid:string, entityUuid: string) => {
    return createSelector(
      (state: ReduxStateWithUndoRedo) => {
        
        const innerState = state.presentModelSnapshot.miroirInstances;
        const deployment = innerState?innerState[deploymentUuid]:undefined;
        const instances = deployment?deployment[entityUuid]:[];
        // console.log('selectInstancesForDeploymentEntity deploymentUuid',deploymentUuid,'entityUuid', entityUuid,'state',state,'instances',instances);
        return instances;
      },
      (items: any) => items
    );
  }
// )
;

//#########################################################################################
export const selectInstancesFromDeploymentDomainSelector: 
  (deploymentUuid:string) => (selector: DomainStateSelector) => (state: ReduxStateWithUndoRedo) => EntityInstance[] =
  (deploymentUuid:string) => {
    return (selector: DomainStateSelector) => {
      return createSelector(
        (state: ReduxStateWithUndoRedo) => {
          const deployments = state?.presentModelSnapshot?.miroirInstances;
          // const deploymentInstances = deployments?deployments[applicationDeploymentMiroir.uuid]:undefined
          const deploymentInstances = deployments?deployments[deploymentUuid]:undefined
          if (deploymentInstances) {
            const domainState: EntitiesDomainState = Object.fromEntries(
              Object.entries(deploymentInstances).map((e) => {
                // console.log("selectInstancesFromDomainSelector miroirInstances", e);
                return [e[0], e[1].entities];
              })
            ) as EntitiesDomainState;
            // console.log("selectInstancesFromDomainSelector domainState",domainState)
            return selector(domainState);
          } else {
            return selector({} as EntitiesDomainState);
          }
        },
        (items: EntityInstance[]) => items
      );
    };
  }

//#########################################################################################
export const selectInstancesFromDomainSelector: (
  selector: DomainStateSelector
) => (state: ReduxStateWithUndoRedo) => EntityInstance[] =
  // _memoize(
  // (parentName: string) => {
  (selector: DomainStateSelector) => {
    return createSelector(
      (state: ReduxStateWithUndoRedo) => {
        const deployments = state?.presentModelSnapshot?.miroirInstances;
        const deploymentInstances = deployments?deployments[applicationDeploymentMiroir.uuid]:undefined
        if (deploymentInstances) {
          const domainState: EntitiesDomainState = Object.fromEntries(
            Object.entries(deploymentInstances).map((e) => {
              // console.log("selectInstancesFromDomainSelector miroirInstances", e);
              return [e[0], e[1].entities];
            })
          ) as EntitiesDomainState;
          // console.log("selectInstancesFromDomainSelector domainState",domainState)
          return selector(domainState);
        } else {
          return selector({} as EntitiesDomainState);
        }
      },
      (items: EntityInstance[]) => items
    );
  };
// }
// )

export default {};
