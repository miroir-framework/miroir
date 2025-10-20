# Product Requirements Document: Rich Text Report Section

## Introduction/Overview

Currently, Miroir Report Sections only support displaying Entity Instances, data grids, or graphs. This feature will extend Report Sections to support rich text content using Markdown format. Users will be able to view formatted text in read-only mode and edit it (when permissions allow) through an inline editor with real-time preview. This enables better documentation, explanatory content, and narrative context within Reports.

**Problem:** Report creators need to include formatted textual content (headings, lists, tables, code blocks) alongside data visualizations and entity displays, but the current Report Section types do not support this.

**Goal:** Enable Markdown-based rich text as a new Report Section type with real-time preview during editing.

## Goals

1. Allow Report Sections to display rich text content formatted with GitHub Flavored Markdown (GFM)
2. Provide an intuitive editing interface with live preview for users with edit permissions
3. Ensure XSS safety through content sanitization
4. Integrate seamlessly with existing Report Section architecture
5. Maintain performance and simplicity (lightweight solution)

## User Stories

1. **As a Report creator**, I want to add explanatory text sections to my Reports so that users can understand the context and purpose of the data being displayed.

2. **As a Report editor**, I want to edit Markdown content with a live preview so that I can see how my formatting will appear without switching modes or reloading.

3. **As a Report viewer**, I want to read nicely formatted text content (with headings, lists, tables, code blocks) so that Reports are easier to understand and more informative.

4. **As a system administrator**, I want rich text content to be stored safely and sanitized so that malicious scripts cannot be injected through Report Sections.

## Functional Requirements

1. **New Report Section Type**: The system must support a new Report Section type called "MarkdownSection" that stores and displays Markdown content.

2. **Markdown Storage**: The Markdown content must be stored as a base64 string field on the ReportSection entity instance in the database.

3. **Read-Only Rendering**: In read-only mode, the system must render Markdown content as formatted HTML using `react-markdown` with `remark-gfm` for GitHub Flavored Markdown support (tables, fenced code blocks, task lists, strikethrough).

4. **Edit Mode Indicator**: When the user has edit permissions and the Report is not in read-only mode, a pencil icon must appear next to or on the rich text section.

5. **Modal Editor**: Clicking the pencil icon must open a modal dialog containing:
   - A plain `<textarea>` for editing raw Markdown
   - A live preview panel showing the rendered Markdown (using `react-markdown`)
   - Save and Cancel buttons

6. **Real-Time Preview**: As the user types in the textarea, the preview panel must update in real-time to reflect the formatted output.

7. **Save Behavior**: Clicking the Save button must persist the Markdown content to the ReportSection entity instance and close the modal.

8. **Cancel Behavior**: Clicking Cancel must discard unsaved changes and close the modal without persisting.

9. **XSS Sanitization**: The system must use `rehype-sanitize` to sanitize rendered HTML and prevent XSS attacks.

10. **Permission Control**: Only users with Report edit permissions (determined by existing Miroir permission system) can see the pencil icon and access the editor.

11. **GFM Features**: The system must support the following Markdown features:
    - Headings (h1-h6)
    - Bold, italic, strikethrough
    - Ordered and unordered lists
    - Task lists (checkboxes)
    - Tables
    - Fenced code blocks with syntax highlighting (if `remark-gfm` supports)
    - Links (hyperlinks)
    - Blockquotes
    - Horizontal rules

12. **No Size Limit**: The system should not impose artificial size limits on Markdown content beyond database field defaults (use TEXT or equivalent column type).

13. **Accessibility**: The modal, textarea, and buttons must have proper ARIA labels and semantic HTML for screen reader compatibility.

## Non-Goals (Out of Scope)

1. **Collaborative real-time editing** (multiple users editing the same section simultaneously) is out of scope.
2. **WYSIWYG rich text editor** (what-you-see-is-what-you-get inline formatting toolbar) is out of scope—use plain Markdown textarea only.
3. **Image upload functionality** is out of scope—users may reference remote image URLs in Markdown, but the system will not host or upload images.
4. **Version history or rollback** is out of scope for this release—last save wins.
5. **Advanced Markdown features** such as footnotes, definition lists, or LaTeX math rendering are out of scope.
6. **Markdown-to-database indexing** (full-text search within Markdown content) is out of scope.
7. **Auto-save or debounced saves** are out of scope (explicit Save button only).
8. **Custom markdown syntax extensions** beyond GFM are out of scope.

## Design Considerations

### UI/UX Requirements

- **Read-only view**: Render Markdown as styled HTML inline within the Report Section. Use consistent typography matching the rest of the Miroir UI.
- **Pencil icon**: Display a small pencil/edit icon in the top-right corner of the section when in edit mode (similar to existing Miroir edit patterns).
- **Modal layout**: 
  - Two-column or stacked layout (textarea on left, preview on right, or textarea on top, preview on bottom)
  - Modal should be large enough for comfortable editing (e.g., 80% viewport width/height)
  - Responsive: on small screens, consider stacking textarea and preview vertically
- **Buttons**: Standard Miroir button styles for Save (primary) and Cancel (secondary).
- **Textarea styling**: Monospace font, line numbers optional, reasonable default size (e.g., 20 rows minimum).

### Component Structure

- Create a new React component: `RichTextReportSection.tsx` in `miroir-standalone-app` (per requirement 12B).
- Create a modal editor component: `MarkdownEditorModal.tsx`.
- modal windows are based on `DraggableContainer.tsx` (look for usage examples in the code) 
- Use existing Miroir modal/dialog component if available, or create a simple modal wrapper.

## Technical Considerations

In a general way, proceed in Test-driven way: a test shall be available for validation a the end of each Task. Favor integration tests to unit tests. Unit tests may make sense when mocking is not necessary or strictly limited to ancillary functions.

Perform integration of new code early, do not wait to have fully implemented a feature to integrate it with existing functionality. Make the new functionality co-evolve with the legacy ones.

### Dependencies

- packages `react-markdown`, `remark-gfm`, and `rehype-sanitize` are aldready installed, don't need to install them.

### Data Model Changes

- Update the `ReportSection` EntityDefinition (`packages\miroir-core\src\assets\miroir_model\54b9c72f-d4f3-4db9-9e0e-0dc840b530bd\952d2c65-4da2-45c2-9394-a0920ceedfb6.json`) to include a new union type or variant for "Markdown" sections. You'll need to use `npm run devBuild -w miroir-core` to re-generate types
- Add a `content` field (type: string) to store the Markdown text.
- the database schema (postgres) supports TEXT for potentially large Markdown content.

### Integration Points

- new React components must e themable (see `packages\miroir-standalone-app\src\miroir-fwk\4_view\components\Themes`)
- Integrate with existing Report rendering logic in `miroir-standalone-app`.
- Use existing Miroir permission system to check if user can edit the Report.
- Follow Miroir's Redux state management patterns if the Report Sections are managed in Redux (or use local React state for modal editing).

### Performance

- `react-markdown` is lightweight and should not cause performance issues for typical Markdown content sizes.
- If preview updates become sluggish for very large documents, consider adding a simple debounce for the preview render (not for saving—just for rendering). However, defer this optimization unless needed.

### Security

- Always use `rehype-sanitize` to strip dangerous HTML/scripts.
- Do not allow `dangerouslySetInnerHTML` without sanitization.
- Remote image URLs in Markdown (`![alt](https://example.com/image.png)`) will be rendered as `<img>` tags—ensure CSP (Content Security Policy) allows external images if needed, or document the limitation.

### Testing Strategy

- Write integration tests that:
  1. Create a Report with a Markdown section containing sample Markdown.
  2. Save the Report and verify the Markdown content is persisted correctly.
  3. Load the Report and verify the Markdown is rendered as expected HTML.
  4. Open the editor, modify content, save, and verify the update is persisted.
  5. Test permission logic: users without edit permissions should not see the pencil icon or be able to open the editor.
  6. Test XSS prevention: attempt to inject `<script>` tags in Markdown and verify they are sanitized out.

## Success Metrics

1. **Feature Adoption**: At least 30% of Reports created after launch include at least one RichText section within the first month.
2. **User Satisfaction**: Positive feedback from Report creators (via user interviews or support tickets) indicating the feature improves Report clarity and usability.
3. **Zero XSS Incidents**: No security issues reported related to Markdown rendering or script injection.
4. **Performance**: Markdown rendering and editing remain fast (<100ms render time for typical sections, <500ms for very large sections).
5. **Reduced Support Tickets**: Decrease in user requests for "how to add text/notes to Reports" by at least 50%.

## Open Questions

1. Should there be a character or size warning/limit in the UI (e.g., "Markdown content is very large—consider splitting into multiple sections")? If so, what threshold?

No

2. Should the modal editor support keyboard shortcuts beyond basic textarea behavior (e.g., Cmd/Ctrl+S to save, Esc to cancel)? (Per answer 10A, basic accessibility only—but can be added later.)

No


3. Should we provide a Markdown syntax help link or cheat sheet in the editor modal? (Nice-to-have—not required for MVP.)

yes

4. What should the default placeholder text be for an empty RichText section in read-only mode? (e.g., "No content", "Click edit to add content", or empty?)

"Click edit to add content"

5. Should we support dark mode styling for the Markdown editor and preview? (Follow existing Miroir theme if applicable.)

Yes, the added components shall be themable

---

**Document Version:** 1.0  
**Created:** October 20, 2025  
**Author:** AI Assistant (based on user input)
