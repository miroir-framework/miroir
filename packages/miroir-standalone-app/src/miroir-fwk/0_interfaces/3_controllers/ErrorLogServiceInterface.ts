
/**
 * belongs in 1_core?
 */
export interface MError {
  errorMessage?:string, 
  stack?: string[],
}

export interface ErrorLogServiceInterface {
  /**
   * Add an error to the current log
   * @param error 
   */
  pushError(error:MError);


  /**
   * React-hook-based interface, with automatic refresh. Can it be conveniently implemented / suitable in other environments?
   * This makes an implicit dependency to React, though the interface does not depend on the React library itself.
   */
  getErrorLog():MError[];
}