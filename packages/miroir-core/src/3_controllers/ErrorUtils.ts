import { RemoteStoreCRUDActionReturnType } from "../0_interfaces/4-services/remoteStore/RemoteDataStoreInterface";
import { EntityInstanceCollection } from "../0_interfaces/1_core/Instance";
import { ErrorLogServiceInterface, MError } from "../0_interfaces/3_controllers/ErrorLogServiceInterface";
// import { RemoteStoreCRUDActionReturnType } from "../0_interfaces/4-services/localStore/LocalCacheInterface";

export default {}

/**
 * convert errors to exceptions for controllers using store controllers, 
 * allowing them to interrupt their control flow without testing systematically for errors
 */ 
export async function throwExceptionIfError(
  errorLogService: ErrorLogServiceInterface,
  f: (...args) => Promise<RemoteStoreCRUDActionReturnType>,
  _this,
  ...args
): Promise<EntityInstanceCollection> {
  const result: RemoteStoreCRUDActionReturnType = await f.bind(_this)(...args);
  // console.log("unwrap",result);
  if (result && result['status'] == "error") {
    //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
    // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
    const error: MError = { errorMessage: result.errorMessage };
    errorLogService.pushError(error);
    throw error;
  } else {
    console.log("throwExceptionIfError ok", result);
    return result.instanceCollection;
  }
}
