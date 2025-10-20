# Blob Display and Editing in Miroir

## Overview

The Miroir Framework provides built-in support for displaying and editing binary content (blobs) such as images, PDFs, and other file types within entity editors. This feature allows users to view blob previews, upload replacement files via drag-and-drop or click-to-upload, and manage blob metadata seamlessly.

## Enabling Blob Editing

To enable blob editing for an entity attribute, add the `isBlob: true` tag to the attribute's schema definition in your entity's Jzod schema.

### Entity Definition Example

```json
{
  "type": "object",
  "definition": {
    "uuid": {
      "type": "uuid",
      "tag": { "value": { "id": 1, "defaultLabel": "Uuid", "editable": false } }
    },
    "name": {
      "type": "string",
      "tag": { "value": { "defaultLabel": "Name", "editable": true } }
    },
    "filename": {
      "type": "string",
      "tag": { "value": { "defaultLabel": "Filename", "editable": true } }
    },
    "contents": {
      "type": "object",
      "optional": true,
      "tag": {
        "value": {
          "defaultLabel": "Contents",
          "editable": true,
          "isBlob": true
        }
      },
      "definition": {
        "encoding": {
          "type": "enum",
          "tag": { "value": { "defaultLabel": "Encoding", "editable": true } },
          "definition": ["base64", "data-uri"]
        },
        "mimeType": {
          "type": "enum",
          "tag": { "value": { "defaultLabel": "MIME Type", "editable": true } },
          "definition": [
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/svg+xml",
            "application/pdf",
            "application/zip",
            "text/plain",
            "application/json"
          ]
        },
        "data": {
          "type": "string",
          "tag": { "value": { "defaultLabel": "Data", "editable": true } }
        }
      }
    }
  }
}
```

### Key Requirements

1. **isBlob Tag**: Add `"isBlob": true` to the `tag.value` of the contents object
2. **Blob Structure**: The contents object must have three fields:
   - `encoding`: enum with values `["base64", "data-uri"]`
   - `mimeType`: enum with allowed MIME types
   - `data`: string containing the base64-encoded blob data
3. **Filename Field**: A separate `filename` field should exist at the parent level

## Supported MIME Types

The blob editor supports any MIME type you specify in the `mimeType` enum definition. Common MIME types include:

### Images
- `image/png` - PNG images
- `image/jpeg` - JPEG images
- `image/gif` - GIF images
- `image/svg+xml` - SVG images

### Documents
- `application/pdf` - PDF documents
- `text/plain` - Plain text files
- `application/json` - JSON files

### Archives
- `application/zip` - ZIP archives
- `application/x-zip-compressed` - ZIP archives (alternate)

### Custom Types
You can add any MIME type to the enum definition. The editor will display:
- **Image preview** for MIME types starting with `image/`
- **File icon with download button** for all other types

## File Size Limits

The blob editor enforces the following file size limits:

| Limit | Size | Behavior |
|-------|------|----------|
| **Warning Threshold** | 5 MB | Shows confirmation dialog before upload |
| **Maximum Size** | 10 MB | Hard limit - files larger than this are rejected |

### Warning Dialog

When uploading a file larger than 5 MB, users will see:

```
Warning: File size is 7.2 MB. Large files may impact performance. Continue?
```

Users can click "OK" to proceed or "Cancel" to abort the upload.

### Maximum Size Error

Files larger than 10 MB will show an error:

```
File size exceeds maximum allowed size of 10.0 MB
```

## Usage Guide

### Viewing Blobs

#### Image Preview
When a blob has a MIME type starting with `image/`, the editor displays:
- A preview thumbnail (200x200px max, maintains aspect ratio)
- Filename and MIME type metadata
- Click the preview to open a full-size lightbox modal

#### Non-Image Files
For other file types (PDF, ZIP, text, etc.), the editor displays:
- An appropriate file type icon
- Filename and MIME type metadata
- A download button to save the file locally

### Uploading Files

There are two ways to upload a file:

#### 1. Click-to-Upload
1. Click anywhere on the blob container
2. Select a file from the file picker dialog
3. The file will be automatically validated and uploaded

#### 2. Drag-and-Drop
1. Drag a file from your file system
2. Drop it onto the blob container
3. The file will be automatically validated and uploaded

### Upload Validation

The editor performs the following validations during upload:

1. **MIME Type Validation**: Only files matching the allowed MIME types (defined in the schema enum) are accepted
   - Invalid files show: `File type "video/mp4" is not allowed. Allowed types: image/png, image/jpeg, application/pdf`

2. **File Size Validation**: Files must be under 10 MB
   - Files 5-10 MB show a confirmation dialog
   - Files over 10 MB are rejected with an error message

3. **Single File Limit**: Only one file can be uploaded at a time
   - Dropping multiple files shows: `Only one file at a time`

### Upload Process

During file upload, the editor:
1. Shows a loading spinner overlay
2. Converts the file to base64 encoding
3. Extracts the filename and MIME type
4. Updates all blob fields atomically (filename, encoding, mimeType, data)
5. Displays the new blob preview or icon

### Read-Only Mode

In read-only mode:
- Upload interactions are disabled (no click-to-upload, no drag-and-drop)
- Download button remains available for non-image files
- Image preview and lightbox still work
- All metadata is displayed normally

## Error Handling

The blob editor handles various error conditions gracefully:

### Validation Errors

| Error | Message | Cause |
|-------|---------|-------|
| Invalid Encoding | `Invalid encoding: "xxx". Expected 'base64' or 'data-uri'` | Blob has unsupported encoding |
| Missing MIME Type | `MIME type is required` | Blob contents missing mimeType |
| Missing Data | `Blob data is missing` | Blob contents missing data field |
| Missing Encoding | `Encoding is required when contents are present` | Blob has data but no encoding |

### Upload Errors

| Error | Message | Resolution |
|-------|---------|----------|
| Invalid MIME Type | `File type "xxx" is not allowed...` | Choose a file with an allowed type |
| File Too Large | `File size exceeds maximum allowed size of 10.0 MB` | Reduce file size or compress |
| File Read Error | `Failed to read file: [error details]` | Try uploading again or use a different file |
| Multiple Files | `Only one file at a time` | Drop only one file |

## Best Practices

1. **Optimize Images**: Compress images before uploading to stay under the 5 MB warning threshold
2. **Use Appropriate MIME Types**: Define only the MIME types your application actually needs
3. **Provide Clear Labels**: Use descriptive `defaultLabel` values in tags for better UX
4. **Handle Empty States**: Design your UI to handle blobs with `contents: undefined`
5. **Test File Sizes**: Test the upload flow with files near the size limits
6. **Consider Performance**: Large base64 strings can impact form rendering and validation performance

## Accessibility

The blob editor includes the following accessibility features:
- Keyboard navigation support for file input
- Alt text on images using the filename
- ARIA labels on interactive elements
- Clear error messages for screen readers
- Visible focus indicators

## Browser Compatibility

The blob editor uses modern web APIs:
- **FileReader API**: Supported in all modern browsers
- **Drag and Drop API**: Supported in all modern browsers
- **Base64 encoding**: Native `atob()`/`btoa()` functions

Minimum browser versions:
- Chrome/Edge: 88+
- Firefox: 78+
- Safari: 14+

## Troubleshooting

### Preview Not Showing
- Verify the `mimeType` field is set correctly
- Check that `data` field contains valid base64 string
- Ensure `encoding` is set to `"base64"` or `"data-uri"`

### Upload Not Working
- Check browser console for errors
- Verify the file matches an allowed MIME type
- Ensure file is under 10 MB
- Check that the field is not in read-only mode

### Performance Issues
- Reduce image file sizes (compress before uploading)
- Limit the number of blob fields displayed simultaneously
- Consider lazy loading for pages with many blobs

## API Reference

See the developer documentation in `BlobEditorField.tsx` for:
- Component props
- Integration patterns
- Customization options
- Extension points
