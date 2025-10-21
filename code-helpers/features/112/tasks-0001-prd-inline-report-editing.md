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

- `packages/miroir-core/src/0_interfaces/4-views/ViewParams.ts` - Add `editMode` boolean field to ViewParams interface and class
- `packages/miroir-core/src/0_interfaces/4-views/ViewParams.test.ts` - Tests for ViewParams with editMode
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Page/AppBar.tsx` - Add edit mode toggle button
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportViewWithEditor.tsx` - New component wrapping ReportView with editing capabilities
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.tsx` - New component wrapping ReportSectionView with section-level editing controls
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionViewWithEditor.test.tsx` - Integration tests for section editing
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportView.tsx` - Minimal modifications to integrate with ReportViewWithEditor
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/Reports/ReportSectionView.tsx` - Minimal modifications to integrate with ReportSectionViewWithEditor
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/routes/ReportPage.tsx` - Update to use ReportViewWithEditor when editMode is enabled
- `packages/miroir-standalone-app/src/miroir-fwk/4_view/MiroirContextReactProvider.tsx` - Integrate editMode into ViewParams context updates
- `packages/miroir-standalone-app/tests/4_view/ReportInlineEditing.integ.test.tsx` - Integration tests for complete inline editing flow

### Notes

- Integration tests are preferred over unit tests following the Miroir Framework convention
- Tests use Vitest with single-thread execution for reliability
- Test environment configuration via `VITE_MIROIR_TEST_CONFIG_FILENAME` and `VITE_MIROIR_LOG_CONFIG_FILENAME`
- New components (`ReportViewWithEditor`, `ReportSectionViewWithEditor`) should be created rather than heavily modifying existing ones to maintain backward compatibility
- Follow existing patterns from `TransformerEditor` component for state persistence via `ViewParams.toolsPage`

## Tasks

- [ ] 1.0 Add editMode to ViewParams and AppBar Toggle
- [ ] 2.0 Create ReportViewWithEditor Component with State Management
- [ ] 3.0 Create ReportSectionViewWithEditor Component with Section-Level Controls
- [ ] 4.0 Implement Section Editor with TypedValueObjectEditor Integration
- [ ] 5.0 Implement Submit Action and Storage Persistence

---

I have generated the high-level tasks based on the PRD. Ready to generate the sub-tasks? Respond with 'Go' to proceed.
