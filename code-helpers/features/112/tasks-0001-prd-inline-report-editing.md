# Task List: Inline Report Editing

Generated from PRD: `0001-prd-inline-report-editing.md`

## Current State Assessment

### Existing Infrastructure
- **ViewParams**: Currently manages `sidebarIsOpen`, `sidebarWidth`, `gridType`, `appTheme`, and `toolsPage` state
- **AppBar**: Already has toggle buttons for grid type, performance display, and action timeline
- **ReportSectionEntityInstance**: Uses `TypedValueObjectEditor` component with `zoomInPath` support for editing entity instances
- **ReportView/ReportSectionView**: Renders reports with various section types (objectListReportSection, objectInstanceReportSection, etc.)
- **State Management**: Mix of React context (MiroirContextReactProvider), Redux for domain state, and React hooks
- **Action Pattern**: Existing `onEditValueObjectFormSubmit` pattern for persisting entity changes to storage

### Key Files Identified
- ViewParams EntityDefinition: `packages\miroir-core\src\assets\admin_model\54b9c72f-d4f3-4db9-9e0e-0dc840b530bd\4cb43523-350f-49bd-813e-ab7d5cef78b2.json` (use `devBuild` when modified)
- ViewParams definition: `packages/miroir-core/src/0_interfaces/4-views/ViewParams.ts`
- AppBar component: `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx`
- ReportView: `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportView.tsx`
- ReportSectionView: `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionView.tsx`
- ReportSectionEntityInstance: `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionEntityInstance.tsx`
- TypedValueObjectEditor: `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/TypedValueObjectEditor.tsx`
- Report entity definition: `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json`

## Relevant Files

- `packages/miroir-core/src/0_interfaces/4-views/ViewParams.ts` - Add `generalEditMode` boolean field to ViewParams interface and class
- `packages/miroir-core/src/0_interfaces/4-views/ViewParams.test.ts` - Tests for ViewParams with generalEditMode
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx` - Add edit mode toggle button
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx` - New component wrapping ReportView with editing capabilities
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.tsx` - New component wrapping ReportSectionView with section-level editing controls
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.test.tsx` - Integration tests for section editing
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportView.tsx` - Minimal modifications to integrate with ReportViewWithEditor
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionView.tsx` - Minimal modifications to integrate with ReportSectionViewWithEditor
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ReportPage.tsx` - Update to use ReportViewWithEditor when generalEditMode is enabled
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/MiroirContextReactProvider.tsx` - Integrate generalEditMode into ViewParams context updates
- `packages/miroir-standalone-app/tests/4_view/ReportInlineEditing.integ.test.tsx` - Integration tests for complete inline editing flow

### Notes

- Integration tests are preferred over unit tests following the Miroir Framework convention
- Tests use Vitest with single-thread execution for reliability
- Test environment configuration via `VITE_MIROIR_TEST_CONFIG_FILENAME` and `VITE_MIROIR_LOG_CONFIG_FILENAME`
- New components (`ReportViewWithEditor`, `ReportSectionViewWithEditor`) should be created rather than heavily modifying existing ones to maintain backward compatibility
- Follow existing patterns from `TransformerEditor` component for state persistence via `ViewParams.toolsPage`

## Tasks

Never commit after you've checked your work, just stop short of commiting, leave that to me.

- [x] 1.0 Add generalEditMode to ViewParams and AppBar Toggle
  - [x] 1.1 Update ViewParams EntityDefinition Jzod schema to include `generalEditMode` boolean field in `packages/miroir-core/src/assets/admin_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/4cb43523-350f-49bd-813e-ab7d5cef78b2.json`
  - [x] 1.2 Run `npm run devBuild -w miroir-core` to regenerate TypeScript types from updated Jzod schema
  - [x] 1.3 Add `generalEditMode` boolean field to `ViewParamsData` interface in `packages/miroir-core/src/0_interfaces/4-views/ViewParams.ts`
  - [x] 1.4 Add `_editMode` private field and getter/setter to `ViewParams` class in `packages/miroir-core/src/0_interfaces/4-views/ViewParams.ts`
  - [x] 1.5 Update `ViewParams` constructor to accept `initialEditMode` parameter (default: false)
  - [x] 1.6 Add `updateEditMode(enabled: boolean)` method to `ViewParams` class following pattern of `updateSidebarIsOpen`
  - [x] 1.7 Add edit mode toggle button to AppBar component in `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx` (use Edit/EditOff Material-UI icons, grey when false, dark red when true)
  - [x] 1.8 Wire AppBar toggle to call `viewParams.updateEditMode()` and trigger ViewParams persistence via `ViewParamsUpdateQueue`
  - [x] 1.9 Update `MiroirContextReactProvider` in `packages/miroir-standalone-app/src/miroir-fwk/4_view/MiroirContextReactProvider.tsx` to include `generalEditMode` in ViewParams initialization
  - [x] 1.10 Write integration test in `packages/miroir-core/tests/4_views/ViewParams.integ.test.ts` to verify generalEditMode persistence and retrieval
  - [x] 1.11 Run test: `npm run testByFile -w miroir-core -- ViewParams.integ`

- [x] 2.0 Create ReportViewWithEditor Component with State Management
  - [x] 2.1 Create new file `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx`
  - [x] 2.2 Define `ReportViewWithEditorProps` interface extending `ReportViewProps` (no additional props needed initially)
  - [x] 2.3 Implement `ReportViewWithEditor` component that wraps `ReportView` and reads `generalEditMode` from ViewParams context
  - [x] 2.4 Add React `useState` hook to manage edited Report definition (type: `Report | undefined`), initialized to `undefined` (no changes)
  - [x] 2.5 Add React `useState` hook to track which sections have been modified (type: `Set<string>`, where string is section path like "section.definition[0]")
  - [x] 2.6 Create `handleSectionEdit` callback that updates local Report definition state when a section is edited
  - [x] 2.7 Create `handleSectionCancel` callback that reverts a specific section to original definition
  - [x] 2.8 Add "Submit" button at the top of report (only visible when `generalEditMode === true` and `modifiedSections.size > 0`)
  - [x] 2.9 Style Submit button to be prominent (use ThemedButton with success color from theme)
  - [x] 2.10 Pass down `generalEditMode`, `editedReportDefinition`, `onSectionEdit`, and `onSectionCancel` as props to child components
  - [x] 2.11 Ensure ReportView continues to use original Report definition for rendering until section is explicitly saved locally

- [x] 3.0 Create ReportSectionViewWithEditor Component with Section-Level Controls
  - [x] 3.1 Create new file `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.tsx`
  - [x] 3.2 Define `ReportSectionViewWithEditorProps` interface extending `ReportSectionViewProps` with additional fields: `generalEditMode: boolean`, `sectionPath: string`, `onSectionEdit: (path: string, newDefinition: any) => void`, `onSectionCancel: (path: string) => void`, `isSectionModified: boolean`
  - [x] 3.3 Implement `ReportSectionViewWithEditor` component that wraps `ReportSectionView`
  - [x] 3.4 Add React `useState` hook to track if current section is being edited (type: `boolean`)
  - [x] 3.5 When `generalEditMode === true`, render pencil icon (Edit icon from Material-UI) in top-right corner of each section container (use absolute positioning)
  - [x] 3.6 Style pencil icon to be grey by default, dark red when `isSectionModified === true`
  - [x] 3.7 When pencil is clicked, set `isEditing` state to true and render section editor inline
  - [x] 3.8 When section is being edited, show save icon (Save icon from Material-UI) next to pencil icon
  - [x] 3.9 Wire save icon click to call `onSectionEdit` callback with updated section definition, then set `isEditing` to false
  - [x] 3.10 Add cancel button (Close icon) that calls `onSectionCancel` and sets `isEditing` to false
  - [x] 3.11 Recursively propagate editor props down to nested ReportSectionView components (for "list" and "grid" section types)
  - [x] 3.12 Ensure section continues rendering with current definition while being edited (live preview)
  - [x] 3.13 create non-regression test `ReportPage.integ.test` that checks that existing Reports can be properly displayed using `ReportSectionViewWithEditor` as they could be using `ReportSectionView`
  - [x] iterate running `npm run testByFile -w miroir-standalone-app -- ReportPage.integ.test` until non-regression is ensured.

- [x] 4.0 Implement Section Editor with TypedValueObjectEditor Integration
  - [x] 4.1 In `ReportSectionViewWithEditor`, when `isEditing === true`, render `TypedValueObjectEditor` component below the section content
  - [x] 4.2 Pass the current section's Report definition as `valueObject` prop to `TypedValueObjectEditor`
  - [x] 4.3 Calculate appropriate `zoomInPath` based on section type (e.g., "definition.section.definition[0]" for first section in list)
  - [x] 4.4 Pass Report entity's Jzod schema as `valueObjectMMLSchema` (fetch from `packages/miroir-core/src/assets/miroir_model/54b9c72f-d4f3-4db9-9e0e-0dc840b530bd/3f2baa83-3ef7-45ce-82ea-6a43f7a8c916.json` via model)
  - [x] 4.5 Set `readonly={false}` to enable editing
  - [x] 4.6 Set `maxRenderDepth={Infinity}` to allow full depth editing of nested structures (extractors, combiners, runtimeTransformers)
  - [x] 4.7 Use `TypedValueObjectEditor`'s built-in validation (it already uses `JzodElementEditor` patterns)
  - [x] 4.8 Create expandable/collapsible panel to show runtime environment (reportParameters) in read-only mode
  - [x] 4.9 Use `TypedValueObjectEditor` in readonly mode to display reportParameters (if defined in Report)
  - [x] 4.10 Handle `onSubmit` callback from `TypedValueObjectEditor` - this will be the save action that updates local state
  - [x] 4.11 Ensure validation errors from `TypedValueObjectEditor` prevent saving (save button should be disabled when errors exist)
  - [x] 4.12 Enhance `ReportPage.integ.test` to test editing functionality for all section-level properties: extractors, combiners, runtimeTransformers, extractorTemplates, combinerTemplates, runStoredQueries.
  - [x] 4.13 iterate on running `npm run testByFile -w miroir-standalone-app -- ReportPage.integ.test` until edition functionalities are properly working.

- [ ] 5.0 Implement Submit Action and Storage Persistence
  - [ ] 5.1 In `ReportViewWithEditor`, implement `handleSubmit` callback for the Submit button
  - [ ] 5.2 Create Action payload following pattern from `ReportSectionEntityInstance.onEditValueObjectFormSubmit` (use `updateInstance` action type)
  - [ ] 5.3 Set action's `applicationSection` to "model" (Reports are model-level entities)
  - [ ] 5.4 Build complete updated Report instance with all locally modified sections merged into original Report definition
  - [ ] 5.5 Use `domainController.handleAction()` to send the update action (similar to pattern in `ReportSectionEntityInstance`)
  - [ ] 5.6 Handle action result - on success, clear local edited state and show success snackbar message
  - [ ] 5.7 Handle action result - on error, show error snackbar with error message, keep local state for retry
  - [ ] 5.8 Disable Submit button while action is in progress (add loading state)
  - [ ] 5.9 Update `ReportPage` component in `packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ReportPage.tsx` to use `ReportViewWithEditor` instead of `ReportView`
  - [ ] 5.10 Write integration test in `packages/miroir-standalone-app/tests/4_view/ReportInlineEditing.integ.test.tsx` to verify full editing flow: enable generalEditMode, edit section, save locally, submit to storage, verify persistence
  - [ ] 5.11 Test with filesystem storage: `VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-filesystem npm run testByFile -w miroir-standalone-app -- ReportInlineEditing.integ`
  - [ ] 5.12 Test with IndexedDB storage: `VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-indexedDb npm run testByFile -w miroir-standalone-app -- ReportInlineEditing.integ`
  - [ ] 5.13 Test with PostgreSQL storage: `VITE_MIROIR_TEST_CONFIG_FILENAME=./packages/miroir-standalone-app/tests/miroirConfig.test-emulatedServer-sql npm run testByFile -w miroir-standalone-app -- ReportInlineEditing.integ`
