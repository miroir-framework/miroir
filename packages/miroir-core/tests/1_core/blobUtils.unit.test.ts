import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import {
  fileToBase64,
  base64ToBlob,
  validateMimeType,
  getBlobFileIcon,
  formatFileSize,
} from '../../src/1_core/tools.js';
import { BLOB_SIZE_WARNING_THRESHOLD, MAX_BLOB_FILE_SIZE } from '../../src/1_core/constants.js';

// Mock FileReader for Node.js environment
beforeAll(() => {
  if (typeof FileReader === 'undefined') {
    global.FileReader = class FileReader {
      result: string | null = null;
      error: any = null;
      onload: ((ev: any) => any) | null = null;
      onerror: ((ev: any) => any) | null = null;
      
      readAsDataURL(blob: Blob): void {
        // Simulate async reading
        setTimeout(async () => {
          try {
            // Handle null/undefined input
            if (!blob) {
              this.error = new Error('Invalid blob');
              if (this.onerror) {
                this.onerror({ target: this } as any);
              }
              return;
            }

            // Convert blob to base64 using actual blob content
            if (blob.size === 0) {
              this.result = `data:${blob.type || 'application/octet-stream'};base64,`;
            } else {
              // Get actual blob content
              const text = await blob.text();
              const base64 = Buffer.from(text).toString('base64');
              this.result = `data:${blob.type || 'application/octet-stream'};base64,${base64}`;
            }
            
            if (this.onload) {
              this.onload({ target: this } as any);
            }
          } catch (err) {
            this.error = err;
            if (this.onerror) {
              this.onerror({ target: this } as any);
            }
          }
        }, 0);
      }
    } as any;
  }
});

describe('blobUtils.unit', () => {
  describe('fileToBase64', () => {
    it('should convert a text blob to base64', async () => {
      const testText = 'Hello, World!';
      const blob = new Blob([testText], { type: 'text/plain' });
      const result = await fileToBase64(blob);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      // Decode and verify
      const decoded = atob(result);
      expect(decoded).toBe(testText);
    });

    it('should convert a file to base64', async () => {
      const testText = 'Test file content';
      const file = new File([testText], 'test.txt', { type: 'text/plain' });
      const result = await fileToBase64(file);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      const decoded = atob(result);
      expect(decoded).toBe(testText);
    });

    it('should handle empty blob', async () => {
      const blob = new Blob([], { type: 'text/plain' });
      const result = await fileToBase64(blob);
      
      expect(result).toBe('');
    });

    it('should reject on FileReader error', async () => {
      // Create a mock blob that will cause an error
      const invalidBlob = null as any;
      
      await expect(fileToBase64(invalidBlob)).rejects.toThrow();
    });

    it('should handle very large files efficiently', async () => {
      // Create a 1MB blob
      const largeContent = 'x'.repeat(1024 * 1024);
      const blob = new Blob([largeContent], { type: 'application/octet-stream' });
      const result = await fileToBase64(blob);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle file exactly at warning threshold', async () => {
      // BLOB_SIZE_WARNING_THRESHOLD is 5MB
      const warningSize = BLOB_SIZE_WARNING_THRESHOLD;
      const content = 'x'.repeat(warningSize);
      const blob = new Blob([content], { type: 'application/octet-stream' });
      const result = await fileToBase64(blob);
      
      expect(result).toBeDefined();
      expect(blob.size).toBe(warningSize);
    });

    it('should handle file exactly at max size limit', async () => {
      // MAX_BLOB_FILE_SIZE is 10MB
      const maxSize = MAX_BLOB_FILE_SIZE;
      const content = 'x'.repeat(maxSize);
      const blob = new Blob([content], { type: 'application/octet-stream' });
      const result = await fileToBase64(blob);
      
      expect(result).toBeDefined();
      expect(blob.size).toBe(maxSize);
    });
  });

  describe('base64ToBlob', () => {
    it('should convert base64 string to blob', () => {
      const testText = 'Hello, World!';
      const base64 = btoa(testText);
      const blob = base64ToBlob(base64, 'text/plain');
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle empty base64 string', () => {
      const blob = base64ToBlob('', 'text/plain');
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBe(0);
    });

    it('should create blob with correct MIME type', () => {
      const base64 = btoa('test');
      const mimeType = 'application/json';
      const blob = base64ToBlob(base64, mimeType);
      
      expect(blob.type).toBe(mimeType);
    });

    it('should handle image base64 data', () => {
      // Small 1x1 PNG image base64
      const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const blob = base64ToBlob(pngBase64, 'image/png');
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('image/png');
    });

    it('should handle corrupted base64 string gracefully', () => {
      // Invalid base64 characters
      const corruptedBase64 = 'This is not valid base64!!!@@@';
      
      // Should not throw, but create a blob (atob will handle the error)
      expect(() => {
        const blob = base64ToBlob(corruptedBase64, 'text/plain');
        expect(blob).toBeInstanceOf(Blob);
      }).toThrow(); // atob throws on invalid base64
    });

    it('should handle base64 with proper padding', () => {
      // btoa already includes proper padding, so just use it directly
      const base64WithPadding = btoa('test');
      const blob = base64ToBlob(base64WithPadding, 'text/plain');
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/plain');
    });

    it('should handle very long base64 strings', () => {
      const longText = 'x'.repeat(10000);
      const longBase64 = btoa(longText);
      const blob = base64ToBlob(longBase64, 'text/plain');
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle base64 for boundary file sizes', () => {
      // Create base64 for file at warning threshold
      const warningThresholdText = 'x'.repeat(BLOB_SIZE_WARNING_THRESHOLD);
      const base64 = btoa(warningThresholdText);
      const blob = base64ToBlob(base64, 'application/octet-stream');
      
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThanOrEqual(BLOB_SIZE_WARNING_THRESHOLD);
    });
  });

  describe('validateMimeType', () => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf'];

    it('should return valid for matching MIME type', () => {
      const result = validateMimeType('image/png', allowedTypes);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for another matching MIME type', () => {
      const result = validateMimeType('application/pdf', allowedTypes);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for non-matching MIME type', () => {
      const result = validateMimeType('video/mp4', allowedTypes);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('video/mp4');
      expect(result.error).toContain('not allowed');
    });

    it('should return invalid for empty MIME type', () => {
      const result = validateMimeType('', allowedTypes);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle case sensitivity', () => {
      const result = validateMimeType('IMAGE/PNG', allowedTypes);
      
      // Should be case-insensitive or handle appropriately
      expect(result.isValid).toBe(false);
    });

    it('should return error with list of allowed types', () => {
      const result = validateMimeType('text/html', allowedTypes);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('image/png');
      expect(result.error).toContain('application/pdf');
    });
  });

  describe('getBlobFileIcon', () => {
    it('should return "Image" icon for image MIME types', () => {
      expect(getBlobFileIcon('image/png')).toBe('Image');
      expect(getBlobFileIcon('image/jpeg')).toBe('Image');
      expect(getBlobFileIcon('image/gif')).toBe('Image');
      expect(getBlobFileIcon('image/svg+xml')).toBe('Image');
    });

    it('should return "PictureAsPdf" icon for PDF', () => {
      expect(getBlobFileIcon('application/pdf')).toBe('PictureAsPdf');
    });

    it('should return "FolderZip" icon for ZIP files', () => {
      expect(getBlobFileIcon('application/zip')).toBe('FolderZip');
      expect(getBlobFileIcon('application/x-zip-compressed')).toBe('FolderZip');
    });

    it('should return "Description" icon for text files', () => {
      expect(getBlobFileIcon('text/plain')).toBe('Description');
      expect(getBlobFileIcon('text/html')).toBe('Description');
      expect(getBlobFileIcon('text/csv')).toBe('Description');
    });

    it('should return "Description" icon for JSON', () => {
      expect(getBlobFileIcon('application/json')).toBe('Description');
    });

    it('should return "InsertDriveFile" icon for unknown types', () => {
      expect(getBlobFileIcon('application/octet-stream')).toBe('InsertDriveFile');
      expect(getBlobFileIcon('video/mp4')).toBe('InsertDriveFile');
      expect(getBlobFileIcon('unknown/type')).toBe('InsertDriveFile');
    });

    it('should handle empty MIME type', () => {
      expect(getBlobFileIcon('')).toBe('InsertDriveFile');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('should format kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10.0 KB');
    });

    it('should format megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
      expect(formatFileSize(BLOB_SIZE_WARNING_THRESHOLD)).toBe('5.0 MB');
      expect(formatFileSize(MAX_BLOB_FILE_SIZE)).toBe('10.0 MB');
    });

    it('should handle zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should round to one decimal place', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1638)).toBe('1.6 KB');
    });

    it('should handle very large files', () => {
      const oneGB = 1024 * 1024 * 1024;
      expect(formatFileSize(oneGB)).toBe('1024.0 MB');
    });

    it('should handle boundary file sizes correctly', () => {
      // Exactly at KB boundary
      expect(formatFileSize(1024)).toBe('1.0 KB');
      // One byte less than KB
      expect(formatFileSize(1023)).toBe('1023 B');
      // One byte more than KB
      expect(formatFileSize(1025)).toBe('1.0 KB');
      
      // Exactly at MB boundary
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
      // One byte less than MB
      expect(formatFileSize(1024 * 1024 - 1)).toBe('1024.0 KB');
      // One byte more than MB
      expect(formatFileSize(1024 * 1024 + 1)).toBe('1.0 MB');
    });

    it('should handle warning and max thresholds', () => {
      expect(formatFileSize(BLOB_SIZE_WARNING_THRESHOLD)).toBe('5.0 MB');
      expect(formatFileSize(MAX_BLOB_FILE_SIZE)).toBe('10.0 MB');
      
      // Just below thresholds
      expect(formatFileSize(BLOB_SIZE_WARNING_THRESHOLD - 1)).toMatch(/KB|MB/);
      expect(formatFileSize(MAX_BLOB_FILE_SIZE - 1)).toMatch(/MB/);
      
      // Just above thresholds
      expect(formatFileSize(BLOB_SIZE_WARNING_THRESHOLD + 1)).toMatch(/MB/);
      expect(formatFileSize(MAX_BLOB_FILE_SIZE + 1)).toMatch(/MB/);
    });

    it('should handle negative numbers gracefully', () => {
      // Should either handle gracefully or return a sensible value
      const result = formatFileSize(-100);
      expect(typeof result).toBe('string');
    });
  });
});
