import { EntityState } from '@reduxjs/toolkit';
import { Mentity } from 'src/miroir-fwk/core/Entity';

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json";
import { Minstance } from 'src/miroir-fwk/core/Instance';
import InstanceSlice, { mInstanceSliceActionsCreators, MinstanceSliceState, mInstanceSliceInputActionNames, selectInstancesForEntity, MinstanceActionPayload } from 'src/miroir-fwk/core/InstanceSlice';

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
    const action:MinstanceActionPayload = {entity:"Entity", instances:[entityEntity], };
    // instructions under test
    const modifiedStore:any = InstanceSlice.reducer(initialStore,mInstanceSliceActionsCreators[mInstanceSliceInputActionNames.AddInstancesForEntity](action));
    // testing result
    expect(modifiedStore).toStrictEqual(expectedStore);
  }
)

it(
  ('update one Instance'),
  async () => {
    const entityChanges = {description:"toto"};
    const modifiedEntity: Mentity = Object.assign({},entityEntity,entityChanges);
    const addAction:MinstanceActionPayload = {entity:"Entity", instances:[entityEntity], };
    const updateAction:MinstanceActionPayload = {entity:"Entity", instances:[modifiedEntity], };
    const emptyStore: MinstanceSliceState = {};
    const initialStore:any = InstanceSlice.reducer(emptyStore,mInstanceSliceActionsCreators[mInstanceSliceInputActionNames.AddInstancesForEntity](addAction));
    // instructions under test
    const modifiedStore:any = InstanceSlice.reducer(initialStore,mInstanceSliceActionsCreators[mInstanceSliceInputActionNames.UpdateInstancesForEntity](updateAction));
    const modifiedGlobalState = {presentModelSnapshot:{miroirInstances:modifiedStore}}; // to abstract from Redux implementation
    // console.log('modifiedStore',modifiedStore);
    const modifiedStoreSelector:EntityState<Minstance> = selectInstancesForEntity("Entity")(modifiedGlobalState);
    // console.log('modifiedStoreSelector',modifiedStoreSelector);
    // testing result
    expect(modifiedStoreSelector.entities[entityEntity.uuid]).toStrictEqual(modifiedEntity); //the two tests must be equivalent
  }
)