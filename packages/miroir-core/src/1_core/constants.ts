import { Action2VoidSuccess } from "../0_interfaces/2_domain/DomainElement";

export const cleanLevel = "1";

export const ACTION_OK: Action2VoidSuccess = { status: "ok", returnedDomainElement: undefined }

// Blob file size limits
export const MAX_BLOB_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const BLOB_SIZE_WARNING_THRESHOLD = 5 * 1024 * 1024; // 5MB in bytes