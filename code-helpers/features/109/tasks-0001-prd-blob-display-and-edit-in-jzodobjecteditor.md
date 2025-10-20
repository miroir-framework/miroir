# Tasks: Blob Display and Editing in JzodObjectEditor

Based on PRD: `0001-prd-blob-display-and-edit-in-jzodobjecteditor.md`

## Relevant Files

- `packages/miroir-core/src/1_core/tools.ts` - Blob utility functions implemented (base64 conversion, MIME validation, file reading)
- `packages/miroir-core/src/1_core/constants.ts` - MAX_BLOB_FILE_SIZE and BLOB_SIZE_WARNING_THRESHOLD constants added
- `packages/miroir-core/tests/1_core/blobUtils.test.ts` - Unit tests for blob utility functions (created and passing)
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/BlobEditorField.tsx` - **UPDATED** Complete display functionality with lightbox modal, icon display, download, and read-only mode
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/JzodObjectEditor.tsx` - To be modified to detect `isBlob` tag and render BlobEditorField
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/DisplayComponents.tsx` - **UPDATED** Added 6 themed blob display components (ThemedBlobContainer, ThemedBlobPreview, ThemedBlobEmptyState, ThemedBlobMetadata, ThemedBlobIconDisplay, ThemedBlobDropZone) with responsive behavior
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/index.ts` - **UPDATED** Exported new themed blob components
- `packages/miroir-standalone-app/tests/4_view/BlobEditorField.integ.test.tsx` - **UPDATED** Integration tests (32 tests passing) including validation tests and comprehensive display mode tests

### Notes

- Unit tests should typically be placed alongside the code files they are testing
- Use `npm run test -w miroir-core -- ''` to run miroir-core tests
- Use `npm run testByFile -w miroir-standalone-app -- BlobEditorField.integ` for integration tests
- The existing `DraggableContainer` component will be used as a basis for the image lightbox modal

## Tasks

For each task, proceed in a "Test-driven"-like fashion, and create tests before or conjointly with the implementation, so that I can validate the implementation after each step. Each step will update both the code and the tests as needed.

- [ ] 1.0 Create blob utility functions and constants
  - [x] 1.1 Add `MAX_BLOB_FILE_SIZE` constant (10MB) and `BLOB_SIZE_WARNING_THRESHOLD` (5MB) to `packages/miroir-core/src/1_core/constants.ts`
  - [x] 1.2 Create test file `packages/miroir-core/tests/1_core/blobUtils.test.ts` with test cases for all utility functions
  - [x] 1.3 Add `fileToBase64` utility function in `packages/miroir-core/src/1_core/tools.ts` - converts File/Blob to base64 string using FileReader API
  - [x] 1.4 Add `base64ToBlob` utility function - converts base64 string and MIME type to Blob object
  - [x] 1.5 Add `validateMimeType` utility function - checks if detected MIME type matches allowed types from schema enum
  - [x] 1.6 Add `getBlobFileIcon` utility function - returns appropriate Material-UI icon name based on MIME type (Image, PictureAsPdf, Description, FolderZip, InsertDriveFile)
  - [x] 1.7 Add `formatFileSize` utility function - converts bytes to human-readable format (KB, MB)
  - [x] 1.8 Add TypeScript interfaces: `BlobContents`, `BlobValidationResult`, `BlobUploadResult` to `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts` or appropriate interface file
  - [x] 1.9 Run unit tests: `npm run testByFile -w miroir-core -- blobUtils`

- [x] 2.0 Create BlobEditorField component with basic structure and theming
  - [x] 2.1 Create themed components in `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/DisplayComponents.tsx`:
    - `ThemedBlobContainer` - main container for blob display (200x200px, themeable border)
    - `ThemedBlobPreview` - image preview container with aspect ratio preservation
    - `ThemedBlobEmptyState` - empty state with dashed border and upload prompt
    - `ThemedBlobMetadata` - container for filename and MIME type display
    - `ThemedBlobIconDisplay` - container for non-image file type icons
    - `ThemedBlobDropZone` - drag-and-drop active state overlay
  - [x] 2.2 Export new themed blob components in `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/index.ts`
  - [x] 2.3 Create `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/BlobEditorField.tsx` with:
    - Component interface `BlobEditorFieldProps` extending relevant JzodObjectEditor props
    - Logger setup following Miroir conventions
    - Basic component structure rendering `ThemedBlobContainer`
    - Props: `rootLessListKey`, `rootLessListKeyArray`, `currentValue`, `formik`, `readOnly`, `allowedMimeTypes`, `onError`
  - [x] 2.4 Add `useMemo` hook to parse and validate blob structure from `currentValue?.contents`
  - [x] 2.5 Create basic integration test skeleton `packages/miroir-standalone-app/tests/4_view/BlobEditorField.integ.test.tsx` with test setup and mock data

- [x] 3.0 Add validation of given blob object and display graceful error when it fails
  - [x] 3.1 Add validation logic in `BlobEditorField` to check blob structure has required fields (`encoding`, `mimeType`, `data`)
  - [x] 3.2 Create `BlobValidationError` component to display validation errors with clear messaging
  - [x] 3.3 Handle missing `contents` field (undefined/null) - should not show error, just empty state
  - [x] 3.4 Handle invalid `encoding` field - display error: "Invalid encoding: [encoding]. Expected 'base64' or 'data-uri'"
  - [x] 3.5 Handle missing `mimeType` field - display error: "MIME type is required"
  - [x] 3.6 Handle missing `data` field - display error: "Blob data is missing"
  - [x] 3.7 Add tests in `BlobEditorField.integ.test.tsx` for each validation error case
  - [x] 3.8 Ensure validation errors don't crash Formik form or parent JzodObjectEditor

- [x] 4.0 Implement blob display functionality (preview, metadata, icons)
  - [x] 4.1 Implement empty state display using `ThemedBlobEmptyState` when `contents` is undefined/null:
    - Show placeholder icon (CloudUpload or Image)
    - Display "Upload file" text
    - Make area visually interactive
  - [x] 4.2 Implement metadata display component:
    - Show `filename` in regular weight above preview
    - Show `mimeType` in smaller, secondary style below filename
    - Hide `encoding` field (internal detail)
  - [x] 4.3 Implement image preview for MIME types starting with `image/`:
    - Create base64 data URI from `mimeType` and `data` fields
    - Render in `ThemedBlobPreview` with max dimensions 200x200px
    - Maintain aspect ratio using CSS `object-fit: contain`
    - Add click handler to open lightbox (placeholder for now)
  - [x] 4.4 Implement non-image blob display for other MIME types:
    - Use `getBlobFileIcon` to get appropriate icon
    - Display icon in `ThemedBlobIconDisplay`
    - Show filename and MIME type
    - Add download button that creates temporary blob URL and triggers download
  - [x] 4.5 Create lightbox modal component based on `DraggableContainer`:
    - `BlobLightboxModal` that shows full-size image
    - Close on ESC key or click outside
    - Show filename in title bar
  - [x] 4.6 Implement read-only mode:
    - Show all previews and metadata normally
    - Disable upload interactions (no cursor change, no drag-drop)
    - Keep download functionality enabled
  - [x] 4.7 Add responsive behavior - reduce preview to 150x150px on narrow screens (< 768px)
  - [x] 4.8 Add tests for each display mode: empty state, image preview, non-image icon, read-only

- [ ] 5.0 Implement file upload functionality (drag-and-drop and click-to-upload)
  - [ ] 5.1 Implement click-to-upload:
    - Add hidden `<input type="file">` element with ref
    - Make entire `ThemedBlobContainer` clickable (except in read-only mode)
    - Trigger file input click on container click
    - Set `accept` attribute based on `allowedMimeTypes` from schema
  - [ ] 5.2 Implement drag-and-drop:
    - Add `onDragEnter`, `onDragOver`, `onDragLeave`, `onDrop` handlers
    - Track drag state with `useState` hook
    - Show `ThemedBlobDropZone` overlay when dragging over
    - Prevent default browser behavior for drag events
  - [ ] 5.3 Implement file processing after selection/drop:
    - Use `fileToBase64` utility to convert File to base64
    - Auto-detect MIME type from `file.type`
    - Extract filename from `file.name`
    - Set loading state during processing
  - [ ] 5.4 Implement MIME type validation (FR9):
    - Call `validateMimeType` with detected type and schema enum
    - If invalid, show error: "File type [type] is not allowed. Allowed types: [list]"
    - Reject upload and don't update Formik values
    - Auto-update `mimeType` field if valid
  - [ ] 5.5 Implement file size validation (FR10):
    - Check file size against `BLOB_SIZE_WARNING_THRESHOLD` (5MB)
    - If > 5MB, show warning dialog: "Warning: File size is [size]MB. Large files may impact performance. Continue?"
    - Require user confirmation to proceed
    - Check against `MAX_BLOB_FILE_SIZE` (10MB) hard limit
    - If > 10MB, reject with error: "File size exceeds maximum allowed size of 10MB"
  - [ ] 5.6 Update Formik values on successful upload:
    - `formik.setFieldValue([rootLessListKey].contents.data, base64String)`
    - `formik.setFieldValue([rootLessListKey].contents.encoding, "base64")`
    - `formik.setFieldValue([rootLessListKey].contents.mimeType, detectedMimeType)`
    - `formik.setFieldValue([rootLessListKey].filename, fileName)`
  - [ ] 5.7 Implement loading state during file processing:
    - Show spinner overlay with "Processing..." text
    - Disable all interactions during upload
  - [ ] 5.8 Implement error handling:
    - FileReader errors: "Failed to read file: [error]"
    - Multiple file drops: "Only one file at a time"
    - Display errors near blob field using themed error component
  - [ ] 5.9 Handle data-uri encoding conversion:
    - If existing blob has `encoding: "data-uri"`, display correctly
    - On any update, convert to base64
  - [ ] 5.10 Add tests for upload scenarios: valid upload, invalid MIME type, oversized file, file read error, drag-and-drop, click-to-upload

- [ ] 6.0 Integrate BlobEditorField into JzodObjectEditor
  - [ ] 6.1 Add blob detection logic in `JzodObjectEditor.tsx`:
    - Check if `currentTypeCheckKeyMap?.resolvedSchema?.tag?.value?.isBlob === true`
    - Extract allowed MIME types from `mimeType` enum in schema definition
  - [ ] 6.2 Import `BlobEditorField` component in `JzodObjectEditor.tsx`
  - [ ] 6.3 Add conditional rendering in `JzodObjectEditor`:
    - When `isBlob` is true, render `BlobEditorField` instead of regular object attributes
    - Pass all required props: `rootLessListKey`, `rootLessListKeyArray`, `currentValue`, `formik`, `readOnly`, `allowedMimeTypes`
    - Ensure proper indentation level is maintained
  - [ ] 6.4 Handle the case where blob structure (`contents` object) should still show underlying fields when `isBlob` is false
  - [ ] 6.5 Add error boundary around `BlobEditorField` to prevent crashes
  - [ ] 6.6 Test integration with existing Blob EntityDefinition (`c3179f1d-10bd-4b0f-9a6b-f118d8eb2312.json`)
  - [ ] 6.7 Create integration test that loads full JzodObjectEditor with blob field and validates rendering
  - [ ] 6.8 Test with Library application or create test blob entity instance

- [ ] 7.0 Wrap-up: clean tests to ensure future non-regression and provide high-level documentation
  - [ ] 7.1 Review and consolidate all unit tests in `packages/miroir-core/tests/1_core/blobUtils.test.ts`:
    - Ensure all utility functions have comprehensive test coverage
    - Add edge cases: empty files, corrupted base64, boundary file sizes
  - [ ] 7.2 Review and consolidate integration tests in `packages/miroir-standalone-app/tests/4_view/BlobEditorField.integ.test.tsx`:
    - Test all display modes (empty, image, non-image, read-only)
    - Test all upload scenarios (success, validation errors, size warnings)
    - Test error handling and recovery
  - [ ] 7.3 Add end-to-end test using the actual Blob entity:
    - Create test Blob instance with image data
    - Load in JzodObjectEditor
    - Upload new image
    - Verify Formik state updates correctly
  - [ ] 7.4 Create user-facing documentation in `packages/miroir-standalone-app/docs/BlobEditing.md`:
    - How to use isBlob tag in entity definitions
    - Supported MIME types and file size limits
    - Screenshots of blob editor in action
  - [ ] 7.5 Create developer documentation comment block in `BlobEditorField.tsx`:
    - Component purpose and usage
    - Props documentation
    - Integration with JzodObjectEditor
    - Customization options
  - [ ] 7.6 Update `rationale.md` or `works.md` with feature completion notes
  - [ ] 7.7 Run full test suite to ensure no regressions:
    - `npm run test -w miroir-core -- ''`
    - `npm run test -w miroir-standalone-app -- ''`
  - [ ] 7.8 Manual testing checklist:
    - Test with different image types (PNG, JPEG, GIF, SVG)
    - Test with different non-image types (PDF, ZIP, text, JSON)
    - Test file size warnings and limits
    - Test drag-and-drop on different browsers
    - Test read-only mode
    - Test error states and recovery
    - Test responsive behavior on mobile viewport

---

**Sub-tasks have been generated! Each task now includes detailed steps following a test-driven approach. You can start with Task 1.0 and work through sequentially, validating at each step.**
