import { EntityState } from '@reduxjs/toolkit';
import { EntityDefinition } from 'src/miroir-fwk/0_interfaces/1_core/Entity';

import entityEntity from "src/miroir-fwk/assets/entities/Entity.json";
import { Minstance } from 'src/miroir-fwk/0_interfaces/1_core/Instance';
import InstanceSlice, { actionsCreators, InstanceSliceState, mInstanceSliceInputActionNames, selectInstancesForEntity, InstanceActionPayload } from 'src/miroir-fwk/4_storage/local/InstanceSlice';

beforeAll(() => {
})

afterAll(async () => {
})

it(
  'add one Instance',
  async () => {
    const initialStore: InstanceSliceState = {};
    const expectedStore:any = {Entity:{ids:[entityEntity.uuid], entities: {[entityEntity.uuid]:entityEntity}}};
    console.log("expectedStore",expectedStore);
    const action:InstanceActionPayload = {entity:"Entity", instances:[entityEntity], };
    // instructions under test
    const modifiedStore:any = InstanceSlice.reducer(initialStore,actionsCreators[mInstanceSliceInputActionNames.AddInstancesForEntity](action));
    // testing result
    expect(modifiedStore).toStrictEqual(expectedStore);
  }
)

it(
  ('update one Instance'),
  async () => {
    const entityChanges = {description:"toto"};
    const modifiedEntity: EntityDefinition = Object.assign({},entityEntity,entityChanges);
    const addAction:InstanceActionPayload = {entity:"Entity", instances:[entityEntity], };
    const updateAction:InstanceActionPayload = {entity:"Entity", instances:[modifiedEntity], };
    const emptyStore: InstanceSliceState = {};
    const initialStore:any = InstanceSlice.reducer(emptyStore,actionsCreators[mInstanceSliceInputActionNames.AddInstancesForEntity](addAction));
    // instructions under test
    const modifiedStore:any = InstanceSlice.reducer(initialStore,actionsCreators[mInstanceSliceInputActionNames.UpdateInstancesForEntity](updateAction));
    const modifiedGlobalState = {presentModelSnapshot:{miroirInstances:modifiedStore}}; // to abstract from Redux implementation
    // console.log('modifiedStore',modifiedStore);
    const modifiedStoreSelector:EntityState<Minstance> = selectInstancesForEntity("Entity")(modifiedGlobalState);
    // console.log('modifiedStoreSelector',modifiedStoreSelector);
    // testing result
    expect(modifiedStoreSelector.entities[entityEntity.uuid]).toStrictEqual(modifiedEntity); //the two tests must be equivalent
  }
)