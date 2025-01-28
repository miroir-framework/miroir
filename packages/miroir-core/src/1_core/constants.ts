import { Action2VoidSuccess } from "../0_interfaces/2_domain/DomainElement.js";

export const cleanLevel = "1";

// export const ACTION_OK: Action2VoidReturnType = { status: "ok", returnedDomainElement: { elementType: "void", elementValue: undefined } }
export const ACTION_OK: Action2VoidSuccess = { status: "ok", returnedDomainElement: undefined }