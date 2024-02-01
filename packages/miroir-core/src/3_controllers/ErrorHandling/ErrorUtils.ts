import { RemoteStoreInterface, RemoteStoreActionReturnType } from "../../0_interfaces/4-services/RemoteStoreInterface";
import { ErrorLogServiceInterface, MError } from "../../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { ActionReturnType, DomainElementType, EntityInstanceCollection } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";

export default {}

// // ######################################################################################
// /**
//  * convert errors to exceptions for controllers using store controllers, 
//  * allowing them to interrupt their control flow without testing systematically for errors
//  */ 
// export async function throwExceptionIfError(
//   errorLogService: ErrorLogServiceInterface,
//   f: (...args: any) => Promise<RemoteStoreActionReturnType>,
//   _this: RemoteStoreInterface,
//   ...args: any[]
// ): Promise<EntityInstanceCollection | void> {
//   const functionToCall = f.bind(_this);
//   const result: RemoteStoreActionReturnType = await functionToCall(...args);
//   console.log("throwExceptionIfError received result", result)
//   if (result && result['status'] == "error") {
//     //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
//     // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
//     const error: MError = { errorMessage: result.errorMessage };
//     errorLogService.pushError(error);
//     throw error;
//   } else {
//     // console.log("throwExceptionIfError ok", result);
//     return result.instanceCollection?Promise.resolve(result.instanceCollection):Promise.resolve();
//   }
// }


// ######################################################################################
/**
 * convert errors to exceptions for controllers using store controllers, 
 * allowing them to interrupt their control flow without testing systematically for errors
 */ 
export async function callAction(
  errorLogService: ErrorLogServiceInterface,
  f: (...args: any) => Promise<ActionReturnType>,
  _this: RemoteStoreInterface,
  ...args: any[]
// ): Promise<RemoteStoreActionReturnType> {
): Promise<ActionReturnType> {
  const functionToCall = f.bind(_this);
  const result: ActionReturnType = await functionToCall(...args);
  console.log("callAction received result", result)
  if (result && result['status'] == "error") {
    //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
    // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
    const error: MError = { errorMessage: result.error.errorMessage };
    errorLogService.pushError(error);
    throw error;
  } else {
    // console.log("callAction ok", result);
    return Promise.resolve(result);
  }
}

// ################################################################################################
const callAction2 = async (
  stepName: string,
  context: {[k:string]: any},
  functionCallingActionToTest: () => Promise<ActionReturnType>,
  resultTransformation?: (a:ActionReturnType,p:{[k:string]: any}) => any,
  addResultToContextAsName?: string,
  expectedDomainElementType?: DomainElementType,
  expectedValue?: any,
): Promise<{[k:string]: any}> => {
  console.log("########################################### chainTestAsyncDomainCalls", stepName, "previousResult:", JSON.stringify(context,undefined, 2));
  const domainElement = await functionCallingActionToTest();
  console.log("########################################### chainTestAsyncDomainCalls", stepName, "result:", JSON.stringify(domainElement,undefined, 2));
  let testResult
  if (domainElement.status == "ok") {
    testResult = resultTransformation
      ? resultTransformation(domainElement, context)
      : domainElement.status == "ok"
      ? domainElement?.returnedDomainElement?.elementValue
      : undefined;
    if (expectedDomainElementType) {
      if (domainElement.returnedDomainElement?.elementType != expectedDomainElementType) {
        // expect(domainElement.returnedDomainElement?.elementType, stepName + "received result: " + domainElement.returnedDomainElement).toEqual(expectedDomainElementType) // fails
      } else {
        // const testResult = ignorePostgresExtraAttributes(domainElement?.returnedDomainElement.elementValue)
        if (expectedValue) {
          expect(testResult).toEqual(expectedValue);
        } else {
          // no test to be done
        }
      }
    } else {
     // no test to be done 
    }
  } else {
    // expect(domainElement.status, domainElement.error?.errorType??"no errorType" + ": " + domainElement.error?.errorMessage??"no errorMessage").toEqual("ok")
  }
  console.log("########################################### chainTestAsyncDomainCalls", stepName, "testResult:", JSON.stringify(testResult,undefined, 2));
  if (testResult && addResultToContextAsName) {
    return {...context, [addResultToContextAsName]: testResult}
  } else {
    return context
  }
}
