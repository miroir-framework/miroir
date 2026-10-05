import { Action2VoidSuccess } from "../0_interfaces/2_domain/DomainElement";

export const cleanLevel = "1";

export const ACTION_OK: Action2VoidSuccess = { status: "ok", returnedDomainElement: undefined }

// Blob file size limits
export const MAX_BLOB_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const BLOB_SIZE_WARNING_THRESHOLD = 5 * 1024 * 1024; // 5MB in bytes

/**
 * Miroir actions a remote client sends to the server as they are (`/action/<actionType>`),
 * because they need the server's secrets, persistence or principal (#284, #472).
 * The server answers with the action's own result, not ACTION_OK.
 */
export const SERVER_ROUTED_MIROIR_ACTION_TYPES: readonly string[] = [
  "probeExternalService",
  "setExternalServiceCredential",
];

export function isServerRoutedMiroirAction(action: unknown): boolean {
  const actionType = (action as { actionType?: unknown } | undefined)?.actionType;
  return typeof actionType === "string" && SERVER_ROUTED_MIROIR_ACTION_TYPES.includes(actionType);
}
