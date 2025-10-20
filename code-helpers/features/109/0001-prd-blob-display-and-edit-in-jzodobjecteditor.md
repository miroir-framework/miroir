# PRD: Blob Display and Editing in JzodObjectEditor

## Introduction/Overview

Currently, the `JzodObjectEditor` component displays all object attributes uniformly, including blob data (encoded binary content like images, PDFs, etc.) as plain text strings. This makes it difficult to work with binary content stored in the `contents` attribute of entities.

This feature will add specialized UI handling for attributes marked with `isBlob: true` in their Jzod schema tag. When this flag is present, the editor will provide an intuitive interface to view blob previews (especially for images) and allow users to upload replacement files directly from their local disk using drag-and-drop or click-to-upload interactions.

**Problem Solved:** Users can't effectively view or edit blob content (images, documents) within the Miroir framework's entity editor.

**Goal:** Provide a user-friendly way to display and update blob content in JzodObjectEditor when `isBlob: true` is set in the schema tag.

## Goals

1. Detect when a JzodObject attribute has `isBlob: true` in its schema tag
2. Render blob content with appropriate preview (images) or icons (other MIME types)
3. Enable users to upload new blob content via drag-and-drop or click-to-upload
4. Maintain data integrity by properly encoding uploaded files as base64
5. Validate uploaded files against the schema's allowed MIME types
6. Provide visual feedback for file size, type, and upload status
7. Support read-only mode where previews are shown but uploads are disabled
8. Handle empty/undefined blob states gracefully

## User Stories

1. **As a content editor**, I want to see a thumbnail preview of image blobs stored in an entity, so that I can quickly identify the current image without downloading or viewing raw base64 data.

2. **As a content editor**, I want to drag an image file from my desktop onto the blob field, so that I can quickly replace the existing image without navigating through file dialogs.

3. **As a content editor**, I want to click on an empty blob field to select a file from my computer, so that I can upload new content when no blob exists yet.

4. **As a content editor**, I want to see the filename and MIME type of the current blob, so that I understand what type of content is stored.

5. **As a content editor**, I want to receive a warning if I try to upload a file larger than 5MB, so that I'm aware of potential performance issues but can still proceed if necessary.

6. **As a content editor**, I want the system to validate that my uploaded file matches one of the allowed MIME types in the schema, so that I don't accidentally upload incompatible content.

7. **As a viewer with read-only access**, I want to see blob previews and download options without seeing upload controls, so that the interface clearly indicates I cannot modify the content.

8. **As a content editor working with non-image blobs** (PDFs, text files, JSON), I want to see an appropriate icon and download link, so that I can access the content even though it can't be previewed inline.

## Functional Requirements

### FR1: Blob Detection
1.1. The `JzodObjectEditor` must check if an attribute's resolved schema contains `tag.value.isBlob === true`  
1.2. When `isBlob` is true, the component must render a specialized `BlobEditor` component instead of the default object editor  
1.3. A proper error shall be displayed in the case the blob structure has a missing `encoding`, `mimeType`, or `data` field

### FR2: Image Preview Display
2.1. For MIME types starting with `image/`, the system must display a medium-sized preview thumbnail (approximately 200x200px)  
2.2. The preview must maintain aspect ratio and fit within the allocated space  
2.3. The preview must be generated from the base64 `data` field combined with the `mimeType`  
2.4. Clicking on the preview must open the image in a larger modal/lightbox view

### FR3: Non-Image Blob Display
3.1. For non-image MIME types (`application/pdf`, `application/zip`, `text/plain`, `application/json`), the system must display:
   - An appropriate icon representing the file type
   - The filename
   - A download/view link  
3.2. The download link must trigger a browser download with the correct MIME type and filename

### FR4: Empty State Display
4.1. When `contents` is `undefined`, `null`, or empty, the system must show:
   - A placeholder icon or dashed border box
   - Text reading "Upload file" or "No file uploaded"
   - Clear visual indication that the area is interactive  
4.2. The empty state must also support drag-and-drop and click-to-upload

### FR5: Metadata Display
5.1. The UI must display the `filename` field above or beside the preview  
5.2. The UI must display the `mimeType` field in a smaller, secondary text style  
5.3. The `encoding` field should not be displayed (internal technical detail)

### FR6: File Upload via Drag-and-Drop
6.1. The blob display area must be a valid drop zone for files  
6.2. When a file is dragged over the drop zone, the UI must show a visual highlight (e.g., border color change, background overlay)  
6.3. When a file is dropped, the system must read the file and update the `contents` object  
6.4. Multiple file drops must be rejected with an error message "Only one file at a time"

### FR7: File Upload via Click
7.1. Clicking anywhere on the blob display area must trigger the browser's native file picker  
7.2. The file picker must filter by the allowed MIME types defined in the schema enum (when possible)  
7.3. After file selection, the system must read the file and update the `contents` object

### FR8: File Processing
8.1. Upon file selection (drag or click), the system must:
   - Read the file using FileReader API
   - Convert the file to base64 encoding
   - Auto-detect the actual MIME type from the file
   - Extract the filename from the File object  
8.2. The system must update the Formik values for:
   - `[rootLessListKey].contents.data` = base64 string
   - `[rootLessListKey].contents.encoding` = "base64"
   - `[rootLessListKey].contents.mimeType` = detected MIME type
   - `[rootLessListKey].filename` = file.name

### FR9: MIME Type Validation
9.1. After file selection, the system must check if the detected MIME type matches one of the values in the schema's `mimeType` enum  
9.2. If the MIME type matches, proceed with upload  
9.3. If the MIME type doesn't match, show an error message: "File type [type] is not allowed. Allowed types: [list]" and reject the upload  
9.4. The system must auto-update the `mimeType` field in the `contents` object to match the detected type

### FR10: File Size Warning
10.1. After file selection, the system must check the file size  
10.2. If size > 5MB, display a warning message: "Warning: File size is [size]MB. Large files may impact performance. Continue?"  
10.3. User must confirm to proceed with upload  
10.4. If size ≤ 5MB, proceed without warning

### FR11: Encoding Handling
11.1. The system must default to `base64` encoding for all new uploads  
11.2. If an existing blob has `encoding: "data-uri"`, display it correctly but convert to base64 on any update  
11.3. The encoding dropdown/field should show both options but default to base64

### FR12: Read-Only Mode
12.1. When `props.readOnly === true`, the blob preview must still be displayed  
12.2. The upload functionality (drag-and-drop and click-to-upload) must be disabled  
12.3. Visual indicators (cursor, disabled overlay, or text) must show the field is read-only  
12.4. Download/view functionality must remain enabled in read-only mode

### FR13: Error Handling
13.1. If file reading fails, show error message: "Failed to read file: [error]"  
13.2. If the file is corrupted or unreadable, show error message: "File appears to be corrupted"  
13.3. All error messages must be displayed in the UI near the blob field  
13.4. Errors must not crash the component or Formik form

### FR14: Loading States
14.1. While a file is being read and encoded (especially for large files), show a loading spinner or progress indicator  
14.2. Disable further interactions until the current upload completes  
14.3. Show "Processing..." text during upload

### FR15: Integration with Existing Schema
15.1. The feature must work seamlessly with the existing `Blob` EntityDefinition structure (see `c3179f1d-10bd-4b0f-9a6b-f118d8eb2312.json`)  
15.2. Must support the optional `contents` field  
15.3. Must maintain compatibility with Formik form state management  
15.4. Must work within the existing `typeCheckKeyMap` and schema resolution system

## Non-Goals (Out of Scope)

1. **Image editing capabilities** - No cropping, resizing, filters, or manipulation tools (users must edit externally)
2. **Multi-file upload** - Only single file per blob field
3. **Cloud storage integration** - No direct upload to S3, Azure Blob Storage, etc.
4. **Video/audio playback** - No inline media players for video or audio files
5. **Backend changes** - This is purely a frontend/UI enhancement; backend blob storage remains unchanged
6. **Compression** - No automatic image compression or optimization
7. **Format conversion** - No converting between MIME types (e.g., PNG to JPEG)
8. **Version history** - No tracking of previous blob versions
9. **Batch operations** - No bulk upload or management of multiple blobs
10. **Advanced validation** - No virus scanning, content analysis, or advanced security checks beyond MIME type validation

## Design Considerations

### Component Structure
- Create a new `BlobEditorField` component to handle blob-specific rendering and interactions
- This component should be conditionally rendered in `JzodObjectEditor` when `isBlob: true` is detected
- Use Material-UI components consistent with the existing Miroir UI framework

### Visual Design
- **Themable components**: the added visual components shall follow the general design for theme, see for example `packages\miroir-standalone-app\src\miroir-fwk\4_view\components\Themes\BaseTypes.ts`
- **Preview area**: 200x200px box with border, background color consistent with theme
- **Drag-over state**: Dashed border with accent color, slight background tint
- **Empty state**: Light gray background, dashed border, centered icon and text
- **Metadata**: Display filename in regular weight, MIME type in lighter/smaller font
- **Icons**: Use Material-UI icons for file types (Image, PictureAsPdf, Description, FolderZip)

### Responsive Behavior
- On mobile/narrow screens, reduce preview size to 150x150px
- Ensure drag-and-drop works on touch devices (may require polyfill or fallback to click-only)

### Accessibility
- Add `aria-label` for upload areas: "Upload blob file"
- Ensure keyboard navigation works (Tab to focus, Enter to open file picker)
- Provide screen reader announcements for upload success/failure
- Ensure sufficient color contrast for text and borders

## Technical Considerations

### Dependencies
- Use existing `FileReader` API (built-in browser)
- Leverage Formik's `setFieldValue` for state updates
- Integrate with existing `useJzodElementEditorHooks` for context
- May need a utility function to detect MIME types accurately (use `File.type` property)

### Performance
- For large images, consider lazy loading or thumbnail generation
- Debounce file reading if multiple files are dropped accidentally
- Use `useMemo` to avoid re-rendering the base64 preview unnecessarily

### Browser Compatibility
- Target modern browsers (Chrome, Firefox, Safari, Edge) with FileReader support
- Ensure drag-and-drop works across browsers (test event handling differences)

### Code Location
- Create new file: `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/BlobEditorField.tsx`
- Modify existing: `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/JzodObjectEditor.tsx`
- Add utility functions: `packages/miroir-core/src/1_core/tools/blobUtils.ts` (for MIME detection, base64 conversion, etc.)

### Testing Strategy
- Unit tests for blob utility functions (base64 encoding, MIME type validation)
- Integration tests for JzodObjectEditor with `isBlob: true` schema
- Manual testing with various file types and sizes
- Test error cases (invalid MIME types, oversized files, corrupted files)

## Success Metrics

1. **Usability**: Users can successfully upload and view blobs without reading documentation (measured via user testing)
2. **Error Rate**: < 5% of blob uploads result in errors or failures
3. **Performance**: Blob preview rendering completes in < 500ms for typical image files (< 2MB)
4. **Adoption**: 80%+ of Blob entity instances use the new UI (vs. manual base64 editing)
5. **Feedback**: Positive user feedback regarding ease of use compared to manual base64 editing

## Open Questions

1. **Storage Backend**: Are there plans to move blob storage from JSON files to a dedicated blob storage service in the future? If so, this UI should be designed to accommodate that change easily.

No, keep it simple.

2. **Maximum File Size Hard Limit**: Should there be a hard upper limit (e.g., 10MB) beyond which uploads are rejected entirely, or is the 5MB warning sufficient?

Yes, allow an upper limit past which the file is rejected. make it a centralized constant that can be easily modified.

3. **Thumbnail Caching**: For frequently accessed blobs, should we implement any caching mechanism to avoid re-rendering base64 images on every render?

No, keep it simple.

4. **Lightbox Library**: Should we use an existing lightbox/modal library for full-size image viewing, or build a simple custom modal?

No, use the `packages\miroir-standalone-app\src\miroir-fwk\4_view\components\DraggableContainer.tsx` as a basis, it is used in `packages\miroir-standalone-app\src\miroir-fwk\4_view\components\PerformanceDisplayContainer.tsx` and `packages\miroir-standalone-app\src\miroir-fwk\4_view\components\EventTimelineContainer.tsx`, for example

5. **Data URI Support Timeline**: Is there a plan to deprecate `data-uri` encoding entirely in favor of `base64`, or should both remain supported long-term?
   
no, keep it that way for the moment

6. **Mobile Upload**: On mobile devices, should the file picker allow camera access for taking photos directly, or only file selection from the gallery?

file selection from the galery

7. **Undo/Redo**: How should blob uploads integrate with any existing undo/redo functionality in the form editor?

the undo/redo is dealt with at a completely different level. Focus on updating the JSON structure at hand.

8. **Concurrent Editing**: If multiple users edit the same entity, how should blob conflicts be resolved (last-write-wins, merge conflict, etc.)?

Do not address race conditions during edition.

---

**Document Version**: 1.0  
**Created**: 2025-10-20  
**Author**: AI Assistant  
**Status**: Reviewed.
