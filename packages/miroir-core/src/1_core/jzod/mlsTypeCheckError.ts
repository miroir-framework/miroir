import { ResolvedJzodSchemaReturnTypeError } from "../../0_interfaces/1_core/jzodTypeCheckInterface";

/**
 * Recursively finds the innermost (root cause) ResolvedJzodSchemaReturnTypeError.
 * @param error The error object to search.
 * @returns The innermost ResolvedJzodSchemaReturnTypeError.
 */
export function getInnermostTypeCheckError(
  error: ResolvedJzodSchemaReturnTypeError
): ResolvedJzodSchemaReturnTypeError {
  if (error.innerError) {
    if (
      typeof error.innerError === "object" &&
      error.innerError !== null
      // "innerError" in error.innerError
    ) {
      if (error.innerError.status === "error") {
        return getInnermostTypeCheckError(error.innerError as ResolvedJzodSchemaReturnTypeError);
      }
      // record of ResolvedJzodSchemaReturnTypeError, take the first one
      const firstError = Object.values(error.innerError)[0];
      return getInnermostTypeCheckError(firstError as ResolvedJzodSchemaReturnTypeError);
    }
    // if (Array.isArray(error.innerError)) {
    //   // If innerError is an array, recursively check each error in the array
    //   return error.innerError.reduce((innermost, current) => {
    //     if (typeof current === "object") {
    //       return getInnermostJzodError(current);
    //     }
    //     return innermost;
    //   }, error);
    // }
  }
  return error;
}