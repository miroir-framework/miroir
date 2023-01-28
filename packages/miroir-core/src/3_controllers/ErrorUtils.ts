import { InstanceCollection } from "../0_interfaces/1_core/Instance";
import { ErrorLogServiceInterface, MError } from "../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { StoreReturnType } from "../0_interfaces/4-services/localStore/LocalStoreInterface";

export default {}

/**
 * convert errors to exceptions for controllers using store controllers, 
 * allowing them to interrupt their control flow without testing systematically for errors
 */ 
export async function throwExceptionIfError(errorLogService:ErrorLogServiceInterface,f:(...args)=>Promise<StoreReturnType>,_this,...args):Promise<InstanceCollection[]> {
  const result: StoreReturnType = await f.bind(_this)(...args);
  // console.log("unwrap",result);
  if (result.status == "error") {
    //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
    // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
    const error:MError = {errorMessage:result.errorMessage};
    errorLogService.pushError(error);
    throw error;
  } else {
    console.log("throwExceptionIfError",result);
    return result.instances;
  }
}
