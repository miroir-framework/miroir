import { ResolvedMlSchemaReturnTypeError } from "../../0_interfaces/1_core/mlsTypeCheckInterface";

/**
 * Recursively finds the innermost (root cause) ResolvedMlSchemaReturnTypeError.
 * @param error The error object to search.
 * @returns The innermost ResolvedMlSchemaReturnTypeError.
 */
export function getInnermostTypeCheckError(
  error: ResolvedMlSchemaReturnTypeError
): ResolvedMlSchemaReturnTypeError {
  if (error.innerError) {
    if (
      typeof error.innerError === "object" &&
      error.innerError !== null
      // "innerError" in error.innerError
    ) {
      if (error.innerError.status === "error") {
        return getInnermostTypeCheckError(error.innerError as ResolvedMlSchemaReturnTypeError);
      }
      // record of ResolvedMlSchemaReturnTypeError, take the first one
      const firstError = Object.values(error.innerError)[0];
      return getInnermostTypeCheckError(firstError as ResolvedMlSchemaReturnTypeError);
    }
    // if (Array.isArray(error.innerError)) {
    //   // If innerError is an array, recursively check each error in the array
    //   return error.innerError.reduce((innermost, current) => {
    //     if (typeof current === "object") {
    //       return getInnermostMlsError(current);
    //     }
    //     return innermost;
    //   }, error);
    // }
  }
  return error;
}