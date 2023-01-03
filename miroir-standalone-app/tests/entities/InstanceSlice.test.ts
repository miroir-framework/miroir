import { EntityState, PayloadAction, Update } from '@reduxjs/toolkit';
import { MiroirEntity } from 'src/miroir-fwk/entities/Entity';
import EntitySlice, { mEntityActionsCreators, mEntityAdapter, mEntitySliceStoreActionNames } from 'src/miroir-fwk/entities/EntitySlice';

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json";
import entityReport from "src/miroir-fwk/assets/entities/Report.json";
import { Minstance, MinstanceWithName } from 'src/miroir-fwk/entities/Instance';
import InstanceSlice, { MinstanceActionsCreators, MinstanceSliceState, mInstanceSliceStoreActionNames, selectInstancesForEntity } from 'src/miroir-fwk/entities/InstanceSlice';
import { MinstanceAction } from 'src/miroir-fwk/entities/Mslice';
// import reportEntityList from "src/miroir-fwk/assets/reports/entityList.json"

// const delay = (time:number) => new Promise((resolve) => {
//   setTimeout(resolve, time);
// });

// const miroirEntitiesActions = {
//   fetchMiroirEntities:"entities/fetchMiroirEntities"
// }
// const initialStore: EntityState<MiroirEntityInstanceWithName> = mEntityAdapter.addMany<EntityState<MiroirEntity>>(
//   mEntityAdapter.getInitialState(),
//   [
//     entityReport,
//     entityEntity,
//   ]
// );

beforeAll(() => {
})

afterAll(async () => {
})

it(
  'add one Instance',
  async () => {
    const initialStore: MinstanceSliceState = {};
    const expectedStore:any = {Entity:{ids:[entityEntity.uuid], entities: {[entityEntity.uuid]:entityEntity}}};
    console.log("expectedStore",expectedStore);
    const action:MinstanceAction = {entity:"Entity", instances:[entityEntity], };
    // instructions under test
    const modifiedStore:any = InstanceSlice.reducer(initialStore,MinstanceActionsCreators[mInstanceSliceStoreActionNames.addEntityInstances](action));
    // testing result
    expect(modifiedStore).toStrictEqual(expectedStore);
  }
)

it(
  ('update one Instance'),
  async () => {
    const entityChanges = {description:"toto"};
    const modifiedEntity: MiroirEntity = Object.assign({},entityEntity,entityChanges);
    const addAction:MinstanceAction = {entity:"Entity", instances:[entityEntity], };
    const updateAction:MinstanceAction = {entity:"Entity", instances:[modifiedEntity], };
    const emptyStore: MinstanceSliceState = {};
    const initialStore:any = InstanceSlice.reducer(emptyStore,MinstanceActionsCreators[mInstanceSliceStoreActionNames.addEntityInstances](addAction));
    // instructions under test
    const modifiedStore:any = InstanceSlice.reducer(initialStore,MinstanceActionsCreators[mInstanceSliceStoreActionNames.updateEntityInstances](updateAction));
    const modifiedGlobalState = {presentModelSnapshot:{miroirInstances:modifiedStore}}; // to abstract from Redux implementation
    // console.log('modifiedStore',modifiedStore);
    const modifiedStoreSelector:EntityState<Minstance> = selectInstancesForEntity("Entity")(modifiedGlobalState);
    // console.log('modifiedStoreSelector',modifiedStoreSelector);
    // testing result
    expect(modifiedStoreSelector.entities[entityEntity.uuid]).toStrictEqual(modifiedEntity); //the two tests must be equivalent
  }
)