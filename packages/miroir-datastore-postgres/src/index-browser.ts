import { StoreControllerInterface } from "miroir-core";

/**
 * Empty implementation, intended for use (of the miroir-datastore-postgres package) in the browser.
 * IT DOES NOTHING!
 * @param connectionString 
 * @returns 
 */
export async function SqlStoreControllerFactory (
  connectionString:string,
):Promise<StoreControllerInterface | undefined> {
  return Promise.resolve(undefined);
}
