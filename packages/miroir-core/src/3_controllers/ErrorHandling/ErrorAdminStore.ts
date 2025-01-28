import {
  StoreSectionConfiguration,
} from "../../0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.js";
import { Action2VoidReturnType } from "../../0_interfaces/2_domain/DomainElement.js";
import { PersistenceStoreAdminSectionInterface } from "../../0_interfaces/4-services/PersistenceStoreControllerInterface.js";

export class ErrorAdminStore implements PersistenceStoreAdminSectionInterface {
  constructor() {}

  createStore(config: StoreSectionConfiguration): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  deleteStore(config: StoreSectionConfiguration): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  getStoreName(): string {
    throw new Error("Method not implemented.");
  }
  open(): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
  close(): Promise<Action2VoidReturnType> {
    throw new Error("Method not implemented.");
  }
}
