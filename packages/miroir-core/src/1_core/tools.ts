import equal from "fast-deep-equal"

export function pushIfUnique<T>(array: T[], item: T): void {
  // if (!array.includes(item)) {
  const isUnique = !array.some(existingItem => equal(existingItem, item));
  if (isUnique) {
    array.push(item);
  }
}

export function mergeIfUnique<T>(array: T[], items: T[]): void {
  // if (!array.includes(item)) {
  items.forEach(item => {
    pushIfUnique(array, item);
  });
}

// ################################################################################################
// Blob utility functions
// ################################################################################################

/**
 * Converts a File or Blob to a base64 encoded string
 * @param file - The File or Blob to convert
 * @returns Promise that resolves to base64 string (without data URI prefix)
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 data after the comma (remove data:*/*;base64, prefix)
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    
    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${reader.error?.message || 'Unknown error'}`));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a base64 string to a Blob object
 * @param base64 - The base64 encoded string
 * @param mimeType - The MIME type for the blob
 * @returns Blob object
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  if (!base64) {
    return new Blob([], { type: mimeType });
  }
  
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch (error) {
    throw new Error(`Failed to decode base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validation result for MIME type checking
 */
export interface BlobValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates if a MIME type is in the list of allowed types
 * @param mimeType - The MIME type to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result with isValid flag and optional error message
 */
export function validateMimeType(mimeType: string, allowedTypes: string[]): BlobValidationResult {
  if (!mimeType || mimeType.trim() === '') {
    return {
      isValid: false,
      error: 'MIME type is empty or missing'
    };
  }
  
  const isValid = allowedTypes.includes(mimeType);
  
  if (!isValid) {
    return {
      isValid: false,
      error: `File type "${mimeType}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  return { isValid: true };
}

/**
 * Returns the appropriate Material-UI icon name based on MIME type
 * @param mimeType - The MIME type to get icon for
 * @returns Material-UI icon name
 */
export function getBlobFileIcon(mimeType: string): string {
  if (!mimeType) {
    return 'InsertDriveFile';
  }
  
  // Image files
  if (mimeType.startsWith('image/')) {
    return 'Image';
  }
  
  // PDF files
  if (mimeType === 'application/pdf') {
    return 'PictureAsPdf';
  }
  
  // ZIP files
  if (mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') {
    return 'FolderZip';
  }
  
  // Text and JSON files
  if (mimeType.startsWith('text/') || mimeType === 'application/json') {
    return 'Description';
  }
  
  // Default for unknown types
  return 'InsertDriveFile';
}

/**
 * Formats file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB", "500 B")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 B';
  }
  
  const KB = 1024;
  const MB = KB * 1024;
  
  if (bytes < KB) {
    return `${bytes} B`;
  } else if (bytes < MB) {
    return `${(bytes / KB).toFixed(1)} KB`;
  } else {
    return `${(bytes / MB).toFixed(1)} MB`;
  }
}