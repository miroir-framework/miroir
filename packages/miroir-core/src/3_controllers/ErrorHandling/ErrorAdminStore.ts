import { AdminStoreInterface } from "../../0_interfaces/4-services/StoreControllerInterface";

export class ErrorAdminStore implements AdminStoreInterface {
  constructor() {
    
  }

  createStore(): Promise<void> {
    throw new Error("Method not implemented.");
  }
  deleteStore(): Promise<void> {
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