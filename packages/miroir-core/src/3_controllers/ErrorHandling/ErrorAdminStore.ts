import { ActionReturnType, StoreSectionConfiguration } from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType";
import { AdminStoreInterface } from "../../0_interfaces/4-services/StoreControllerInterface";

export class ErrorAdminStore implements AdminStoreInterface {
  constructor() {
    
  }

  createStore(config: StoreSectionConfiguration): Promise<ActionReturnType> {
    throw new Error("Method not implemented.");
  }
  deleteStore(config: StoreSectionConfiguration): Promise<ActionReturnType> {
    throw new Error("Method not implemented.");
  }
  getStoreName(): string {
    throw new Error("Method not implemented.");
  }
  open(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  close(): Promise<void> {
    throw new Error("Method not implemented.");
  }

}