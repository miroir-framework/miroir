import { RemoteStoreInterface, RemoteStoreActionReturnType } from "../../0_interfaces/4-services/remoteStore/RemoteStoreInterface";
import { ErrorLogServiceInterface, MError } from "../../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { EntityInstanceCollection } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export default {}

/**
 * convert errors to exceptions for controllers using store controllers, 
 * allowing them to interrupt their control flow without testing systematically for errors
 */ 
export async function throwExceptionIfError(
  errorLogService: ErrorLogServiceInterface,
  f: (...args: any) => Promise<RemoteStoreActionReturnType>,
  _this: RemoteStoreInterface,
  ...args: any[]
): Promise<EntityInstanceCollection | void> {
  const result: RemoteStoreActionReturnType = await f.bind(_this)(...args);
  if (result && result['status'] == "error") {
    //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
    // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
    const error: MError = { errorMessage: result.errorMessage };
    errorLogService.pushError(error);
    throw error;
  } else {
    // console.log("throwExceptionIfError ok", result);
    return result.instanceCollection?Promise.resolve(result.instanceCollection):Promise.resolve();
  }
}
