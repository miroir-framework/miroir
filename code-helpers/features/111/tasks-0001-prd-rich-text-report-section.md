## Relevant Files

### Core Data Model
- `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json` - Report EntityDefinition that defines all report section types. Added `markdownReportSection` type (✓ Task 1.0 complete).
- `packages/miroir-core/src/0_interfaces/1_core/bootstrapJzodSchemas/getMiroirFundamentalJzodSchema.ts` - TypeScript schema generator. Added "markdownReportSection" to filter array (✓ Task 1.0 complete).
- `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/miroirFundamentalType.ts` - Generated TypeScript types including `MarkdownReportSection` (✓ Task 1.0 complete).

### New Components (created)
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionMarkdown.tsx` - Main component for rendering Markdown in read-only mode with optional edit icon. Includes ReactMarkdown with GFM and sanitization plugins, themed styling, render tracking, and logger setup (✓ Task 2.0 complete).
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MarkdownEditorModal.tsx` - Modal dialog component for editing Markdown with live preview.
- `packages/miroir-standalone-app/tests/4_view/ReportSectionMarkdown.test.tsx` - Integration tests for Markdown report section.

### Files to Modify
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionView.tsx` - Add routing for new `markdownReportSection` type.
- `packages/miroir-standalone-app/package.json` - Verify `react-markdown`, `remark-gfm`, and `rehype-sanitize` dependencies (already installed per PRD).

### Reference Files
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/DraggableContainer.tsx` - Modal container pattern to follow.
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Themes/index.ts` - Theming system exports.
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Graph/GraphReportSectionView.tsx` - Example report section component.
- `packages/miroir-standalone-app/tests/4_view/GraphReportSectionView.test.tsx` - Test pattern reference.

### Notes

- Dependencies (`react-markdown`, `remark-gfm`, `rehype-sanitize`) are already installed per PRD.
- After modifying the Report EntityDefinition JSON, run `npm run devBuild -w miroir-core` to regenerate TypeScript types.
- Follow test-driven development: write/update tests before implementing features.
- Integration tests should cover the full workflow: create → save → load → edit → XSS prevention.
- Use `DraggableContainer` for the modal editor (see usage in `BlobEditorField.tsx` or `TestResultCellWithActualValue.tsx`).

## Tasks

- [ ] 1.0 Add Markdown Report Section to Data Model
  - [ ] 1.1 Open `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/952d2c65-4da2-45c2-9394-a0920ceedfb6.json` (Report EntityDefinition)
  - [ ] 1.2 Add `markdownReportSection` to the `context` object (around line 120-350), following the pattern of `objectInstanceReportSection` and `graphReportSection`. Define schema with fields: `type` (literal "markdownReportSection"), `definition` object containing `label` (optional string), `content` (string for Markdown content), `fetchedDataReference` (optional string)
  - [ ] 1.3 Add `markdownReportSection` schema reference to the `reportSection` union type definition (around line 576-610), inserting it in the discriminated union array alongside existing section types
  - [ ] 1.4 Run `npm run devBuild -w miroir-core` to regenerate TypeScript types from the updated Jzod schema
  - [ ] 1.5 Verify generated types in `packages/miroir-core/src/0_interfaces/1_core/preprocessor-generated/` include `MarkdownReportSection` type

- [x] 2.0 Create Markdown Report Section Renderer Component
  - [x] 2.1 Create `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionMarkdown.tsx`
  - [x] 2.2 Import required dependencies: `React`, `react-markdown`, `remark-gfm`, `rehype-sanitize`, `ApplicationSection`, `Uuid`, theming components from `../Themes/index`, logger setup
  - [x] 2.3 Define `ReportSectionMarkdownProps` interface with: `applicationSection: ApplicationSection`, `deploymentUuid: Uuid`, `markdownContent: string`, `label?: string`, `onEdit?: () => void`, `showPerformanceDisplay?: boolean`
  - [x] 2.4 Implement `ReportSectionMarkdown` functional component with render tracking (using `useRenderTracker` hook like other section components)
  - [x] 2.5 Add conditional rendering: if `onEdit` callback is provided (edit mode), display a pencil icon button (using `ThemedIconButton` or `ThemedSmallIconButton`) in top-right corner with hover tooltip "Edit Markdown"
  - [x] 2.6 Use `ReactMarkdown` component from `react-markdown` with `remarkPlugins={[remarkGfm]}` and `rehypePlugins={[rehypeSanitize]}` to render the markdown content safely
  - [x] 2.7 Wrap rendered markdown in `ThemedBox` or `ThemedContainer` for consistent theming and styling
  - [x] 2.8 Add optional label display at top if `label` prop is provided (using `ThemedLabel` or `ThemedTitle`)
  - [x] 2.9 Add logger setup following Miroir pattern (see reference components) with logger name "ReportSectionMarkdown"

- [ ] 3.0 Integrate Markdown Section into Report Routing
  - [ ] 3.1 Open `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionView.tsx`
  - [ ] 3.2 Import the new `ReportSectionMarkdown` component at top of file
  - [ ] 3.3 Add a new conditional block after the existing `graphReportSection` check (around line 273-295), checking `props.reportSection.type == "markdownReportSection"`
  - [ ] 3.4 Inside the conditional, extract markdown content from `props.reportData.reportData[props.reportSection.definition.fetchedDataReference]` or use `props.reportSection.definition.content` directly if no fetch reference
  - [ ] 3.5 Render `<ReportSectionMarkdown>` with appropriate props: `applicationSection`, `deploymentUuid`, `markdownContent`, `label`, `showPerformanceDisplay`
  - [ ] 3.6 For now, omit the `onEdit` prop (read-only mode) - this will be added in Task 5

- [ ] 4.0 Write Integration Tests for Markdown Report Section Display
  - [ ] 4.1 Create `packages/miroir-standalone-app/tests/4_view/ReportSectionMarkdown.test.tsx`
  - [ ] 4.2 Set up test file structure: import dependencies (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `MiroirThemeProvider`, logger setup), mock dependencies if needed
  - [ ] 4.3 Create test suite `describe('ReportSectionMarkdown Integration Tests')`
  - [ ] 4.4 Test 1: "renders simple markdown content" - render component with basic markdown (headings, paragraphs, lists), verify rendered HTML elements exist
  - [ ] 4.5 Test 2: "renders GFM features (tables, code blocks, strikethrough)" - render markdown with table syntax, fenced code block, ~~strikethrough~~, verify correct rendering
  - [ ] 4.6 Test 3: "sanitizes dangerous HTML/scripts (XSS prevention)" - render markdown containing `<script>alert('xss')</script>` and `<img src=x onerror=alert(1)>`, verify script tags are removed and dangerous attributes stripped
  - [ ] 4.7 Test 4: "displays edit icon when onEdit callback provided" - render with `onEdit` prop, verify pencil icon button is visible and clickable
  - [ ] 4.8 Test 5: "does not display edit icon when onEdit callback omitted (read-only mode)" - render without `onEdit` prop, verify no edit icon present
  - [ ] 4.9 Test 6: "displays optional label when provided" - render with `label` prop, verify label text is displayed
  - [ ] 4.10 Run tests: `npm run test -w miroir-standalone-app -- ReportSectionMarkdown`

- [ ] 5.0 Create Markdown Editor Modal Component
  - [ ] 5.1 Create `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/MarkdownEditorModal.tsx`
  - [ ] 5.2 Import dependencies: `React` (useState, useCallback, useEffect), `ReactMarkdown`, `remark-gfm`, `rehype-sanitize`, `DraggableContainer`, theming components, `DomainControllerInterface` hook, logger
  - [ ] 5.3 Define `MarkdownEditorModalProps` interface with: `isOpen: boolean`, `initialContent: string`, `onSave: (content: string) => void`, `onCancel: () => void`, `reportSectionInstance: any` (the ReportSection entity instance to update), `deploymentUuid: Uuid`, `applicationSection: ApplicationSection`
  - [ ] 5.4 Implement `MarkdownEditorModal` functional component with local state for `editedContent` (initialized from `initialContent`)
  - [ ] 5.5 Use `DraggableContainer` as the modal wrapper with props: `title="Edit Markdown"`, `onClose={onCancel}`, `storageKey="markdownEditorModal"`, `defaultSize={{ width: 900, height: 600 }}`
  - [ ] 5.6 Create two-panel layout inside modal: left panel with `<textarea>` (styled with monospace font, min 20 rows, full height), right panel with live preview using `<ReactMarkdown>`
  - [ ] 5.7 Add `onChange` handler to textarea that updates `editedContent` state on every keystroke (real-time preview)
  - [ ] 5.8 Add footer with two buttons: "Save" (primary, calls `onSave(editedContent)`) and "Cancel" (secondary, calls `onCancel`)
  - [ ] 5.9 Use `DomainControllerInterface` to handle save action: create `updateInstance` action to update the ReportSection instance with new markdown content (encode content as base64 per PRD requirement)
  - [ ] 5.10 Add optional "Markdown Help" link or tooltip with basic syntax cheat sheet (optional, nice-to-have per PRD)
  - [ ] 5.11 Apply theming to all components (textarea, buttons, panels) using themed components
  - [ ] 5.12 Update `ReportSectionMarkdown.tsx` to accept and use the modal: add `useState` for `isEditorOpen`, implement `handleEdit` to open modal, implement `handleSave` to update content and close modal, implement `handleCancel` to close modal without saving
  - [ ] 5.13 Integrate permission check: only show edit icon if user has edit permissions (check via context or props - follow pattern from `ReportSectionListDisplay` or `ReportSectionEntityInstance`)

- [ ] 6.0 Write Integration Tests for Markdown Report Section Edition
  - [ ] 6.1 Open `packages/miroir-standalone-app/tests/4_view/ReportSectionMarkdown.test.tsx` (or create if separate test suite)
  - [ ] 6.2 Add test suite `describe('MarkdownEditorModal Integration Tests')`
  - [ ] 6.3 Test 1: "opens modal when edit icon clicked" - render ReportSectionMarkdown with `onEdit`, click edit icon, verify modal is visible with correct initial content
  - [ ] 6.4 Test 2: "live preview updates as user types" - open editor, type in textarea, verify preview panel updates in real-time with rendered markdown
  - [ ] 6.5 Test 3: "saves updated content when Save clicked" - open editor, modify textarea content, click Save button, verify `onSave` callback is called with new content and modal closes
  - [ ] 6.6 Test 4: "discards changes when Cancel clicked" - open editor, modify textarea content, click Cancel button, verify original content unchanged and modal closes
  - [ ] 6.7 Test 5: "closes modal when ESC key pressed" - open editor, press ESC key, verify modal closes and changes discarded (relies on `DraggableContainer` ESC support)
  - [ ] 6.8 Test 6: "persists edited markdown to database" - create a mock ReportSection instance, render with edit capability, edit and save, verify `domainController.handleAction` was called with correct `updateInstance` action payload including base64-encoded content
  - [ ] 6.9 Test 7: "textarea has proper styling (monospace, sufficient height)" - verify textarea has monospace font family and adequate minimum rows
  - [ ] 6.10 Test 8: "modal is draggable and resizable" - verify `DraggableContainer` functionality works (may need to test positioning/size state)
  - [ ] 6.11 Run integration tests: `npm run test -w miroir-standalone-app -- ReportSectionMarkdown` (ensure all tests pass)
  - [ ] 6.12 Run end-to-end test scenario: manually test creating a Report with Markdown section → viewing → editing → saving → reloading → verify content persisted correctly
