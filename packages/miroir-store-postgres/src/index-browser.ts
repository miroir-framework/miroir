import { PersistenceStoreControllerInterface } from "miroir-core";

/**
 * Empty implementation, intended for use (of the miroir-store-postgres package) in the browser.
 * IT DOES NOTHING!
 * @param connectionString 
 * @returns 
 */
export async function SqlStoreFactory (
  connectionString:string,
):Promise<PersistenceStoreControllerInterface | undefined> {
  return Promise.resolve(undefined);
}
