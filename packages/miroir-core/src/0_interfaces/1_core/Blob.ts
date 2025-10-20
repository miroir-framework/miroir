/**
 * Blob-related interfaces for handling binary content in Miroir
 */

/**
 * Structure of blob contents stored in entity instances
 */
export interface BlobContents {
  /** Encoding format: base64 or data-uri */
  encoding: 'base64' | 'data-uri';
  /** MIME type of the blob (e.g., 'image/png', 'application/pdf') */
  mimeType: string;
  /** The actual blob data encoded according to the encoding field */
  data: string;
}

/**
 * Result of blob MIME type validation
 */
export interface BlobValidationResult {
  /** Whether the MIME type is valid */
  isValid: boolean;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Result of a blob upload operation
 */
export interface BlobUploadResult {
  /** Whether the upload was successful */
  success: boolean;
  /** The blob contents if successful */
  contents?: BlobContents;
  /** Filename of the uploaded blob */
  filename?: string;
  /** Error message if upload failed */
  error?: string;
}

export default {};
