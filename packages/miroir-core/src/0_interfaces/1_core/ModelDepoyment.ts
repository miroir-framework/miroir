import { Datastore } from "src/0_interfaces/1_core/Datastore";

export interface Deployment {
  entityDatastoreMap:{[P:string]:Datastore}
}