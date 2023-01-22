import { InstanceCollection } from 'miroir-core';
import { StoreReturnType } from 'miroir-core';
import { MError } from 'miroir-core';


/**
 * convert errors to exceptions for controllers using store controllers, 
 * allowing them to interrupt their control flow without testing systematically for errors
 */ 
// export async function unwrap<T extends Instance | InstanceCollection>(f:(...args)=>Promise<StoreReturnType>,_this,...args):Promise<T[]> {
export async function throwExceptionIfError(pushError:(MError)=>void,f:(...args)=>Promise<StoreReturnType>,_this,...args):Promise<InstanceCollection[]> {
  const result: StoreReturnType = await f.bind(_this)(...args);
  // console.log("unwrap",result);
  if (result.status == "error") {
    //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
    // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
    const error:MError = {errorMessage:result.errorMessage};
    pushError(error);
    throw error;
  } else {
    console.log("throwExceptionIfError",result);
    return result.instances;
  }
}
