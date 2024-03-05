import { ActionReturnType, ActionVoidReturnType, StoreSectionConfiguration } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { AdminStoreInterface } from "../../0_interfaces/4-services/PersistenceStoreControllerInterface";

export class ErrorAdminStore implements AdminStoreInterface {
  constructor() {
    
  }

  createStore(config: StoreSectionConfiguration): Promise<ActionVoidReturnType> {
    throw new Error("Method not implemented.");
  }
  deleteStore(config: StoreSectionConfiguration): Promise<ActionVoidReturnType> {
    throw new Error("Method not implemented.");
  }
  getStoreName(): string {
    throw new Error("Method not implemented.");
  }
  open(): Promise<ActionVoidReturnType> {
    throw new Error("Method not implemented.");
  }
  close(): Promise<ActionVoidReturnType> {
    throw new Error("Method not implemented.");
  }

}