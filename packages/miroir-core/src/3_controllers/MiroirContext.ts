import { ErrorLogServiceInterface, MError } from "src/0_interfaces/3_controllers/ErrorLogServiceInterface";

export interface MiroirContextInterface {
  errorLogService:ErrorLogServiceInterface,
  // getErrorLog:()=>MError[],
  // pushError:(error:MError)=>void,
}


export class MiroirContext implements MiroirContextInterface {

  constructor(
    public errorLogService:ErrorLogServiceInterface,
    // public getErrorLog:()=>MError[],
    // public pushError:(error:MError)=>void,
  ){

  }

}
