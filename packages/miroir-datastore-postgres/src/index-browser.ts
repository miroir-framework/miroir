import { StoreFacadeInterface } from "miroir-core";

/**
 * Empty implementation, intended for use (of the miroir-datastore-postgres package) in the browser.
 * IT DOES NOTHING!
 * @param connectionString 
 * @returns 
 */
export async function createSqlServerProxy (
  connectionString:string,
):Promise<StoreFacadeInterface | undefined> {
  return Promise.resolve(undefined);
}
