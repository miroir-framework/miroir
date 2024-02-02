import { RemoteStoreInterface, RemoteStoreActionReturnType } from "../../0_interfaces/4-services/RemoteStoreInterface";
import { ErrorLogServiceInterface, MError } from "../../0_interfaces/3_controllers/ErrorLogServiceInterface";
import { ActionReturnType, DomainElementType, EntityInstanceCollection } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { LocalCacheInterface } from "../../0_interfaces/4-services/LocalCacheInterface";

export default {}

// ######################################################################################
/**
 * convert errors to exceptions for controllers using store controllers, 
 * allowing them to interrupt their control flow without testing systematically for errors
 */ 
export async function callSyncActionOLD(
  context: {[k:string]: any},
  continuation: {
    resultTransformation?: (action:ActionReturnType,context:{[k:string]: any}) => any,
    addResultToContextAsName?: string,
    expectedDomainElementType?: DomainElementType,
    expectedValue?: any,
  },
  errorLogService: ErrorLogServiceInterface,
  f: (...args: any) => ActionReturnType,
  _this: LocalCacheInterface,
  ...args: any[]
// ): Promise<RemoteStoreActionReturnType> {
): Promise<ActionReturnType> {
  const functionToCall = f.bind(_this);
  const result: ActionReturnType = functionToCall(...args);
  console.log("callSyncAction received result", result)
  if (result && result['status'] == "error") {
    //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
    // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
    const error: MError = { errorMessage: result.error.errorMessage };
    errorLogService.pushError(error);
    throw error;
  } else {
    // console.log("callAsyncAction ok", result);
    return Promise.resolve(result);
  }
}

// ######################################################################################
/**
 * convert errors to exceptions for controllers using store controllers, 
 * allowing them to interrupt their control flow without testing systematically for errors
 */ 
export async function callSyncAction(
  context: {[k:string]: any},
  continuation: {
    resultTransformation?: (action:ActionReturnType,context:{[k:string]: any}) => any,
    addResultToContextAsName?: string,
    expectedDomainElementType?: DomainElementType,
    expectedValue?: any,
  },
  errorLogService: ErrorLogServiceInterface,
  f: (...args: any) => ActionReturnType,
  _this: LocalCacheInterface,
  ...args: any[]
// ): Promise<RemoteStoreActionReturnType> {
// ): Promise<ActionReturnType> {
): Promise<Record<string, any>> {
  const functionToCall = f.bind(_this);
  const result: ActionReturnType = functionToCall(...args);
  console.log("callSyncAction received result", result)
  if (result && result['status'] == "error") {
    //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
    // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
    const error: MError = { errorMessage: result.error.errorMessage };
    errorLogService.pushError(error);
    throw error;
  } else {
    const transformedResult = continuation.resultTransformation? continuation.resultTransformation(result, context): result;

    if (continuation.addResultToContextAsName) {
      return {...context, [continuation.addResultToContextAsName]: transformedResult}
    } else {
      return context
    }
  }
}

// ######################################################################################
/**
 * convert errors to exceptions for controllers using store controllers, 
 * allowing them to interrupt their control flow without testing systematically for errors
 */ 
export async function callAsyncAction(
  context: {[k:string]: any},
  continuation: {
    resultTransformation?: (action:ActionReturnType,context:{[k:string]: any}) => any,
    addResultToContextAsName?: string,
    expectedDomainElementType?: DomainElementType,
    expectedValue?: any,
  },
  errorLogService: ErrorLogServiceInterface,
  f: (...args: any) => Promise<ActionReturnType>,
  _this: RemoteStoreInterface,
  ...args: any[]
// ): Promise<RemoteStoreActionReturnType> {
// ): Promise<ActionReturnType> {
): Promise<Record<string, any>> {
  const functionToCall = f.bind(_this);
  const result: ActionReturnType = await functionToCall(...args);
  console.log("callAsyncAction received result", result)
  if (result['status'] == "error") {
    //ensure the proper persistence of errors in the local storage, for it to be accessible by view components.
    // Problem: what if the local storage is not accessible? => store it in a in-memory effect.
    const error: MError = { errorMessage: result.error.errorMessage };
    errorLogService.pushError(error);
    throw error;
  } else {
    // console.log("callAsyncAction ok", result);
    const transformedResult = continuation.resultTransformation? continuation.resultTransformation(result, context): result;

    if (continuation.addResultToContextAsName) {
      return {...context, [continuation.addResultToContextAsName]: transformedResult}
    } else {
      return context
    }
  }
}

export async function callAsyncActionOLD(
  context: {[k:string]: any},
  continuation: {
    resultTransformation?: (action:ActionReturnType,context:{[k:string]: any}) => any,
    addResultToContextAsName?: string,
    expectedDomainElementType?: DomainElementType,
    expectedValue?: any,
  },
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
