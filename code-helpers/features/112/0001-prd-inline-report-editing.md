# Product Requirements Document: Inline Report Editing

## Introduction/Overview

Currently, when users spot a mistake in an application Report, they must navigate away from the Report view to find the corresponding Report definition in the list, modify it, and then browse back to see if the correction worked. This context-switching is inefficient and breaks the user's flow.

This feature introduces an inline editing mode that allows users to edit Report sections directly while viewing the rendered Report, eliminating unnecessary navigation and providing immediate visual feedback on changes.

## Goals

1. **Reduce editing friction**: Enable users to edit Report definitions without leaving the Report view
2. **Improve feedback loop**: Allow users to see rendered results immediately while editing
3. **Maintain consistency**: Use existing editing components (`ReportSectionEntityInstance`) for familiar UX
4. **Provide granular control**: Enable section-level editing with access to extractors, combiners, and runtime transformers
5. **Ensure safe editing**: Implement proper state management with cancel/save workflow

## User Stories

1. **As a Report designer**, I want to enable edit mode from the appBar so that I can quickly switch between viewing and editing modes.

2. **As a Report designer**, I want to see a pencil icon on each Report section when edit mode is enabled so that I know which sections are editable.

3. **As a Report designer**, I want to click on a section's pencil icon to edit that section's definition inline so that I can make changes while seeing the rendered output.

4. **As a Report designer**, I want to edit extractors, combiners, and runtimeTransformers within the section editor so that I can modify the complete query logic.

5. **As a Report designer**, I want to view the runtime environment (reportParameters) while editing so that I understand the context in which my Report executes.

6. **As a Report designer**, I want to save my changes locally before submitting so that I can review multiple edits before committing them.

7. **As a Report designer**, I want to cancel my edits and revert to the original Report definition so that I can discard unwanted changes.

8. **As a Report designer**, I want to submit all my changes with a single action so that the Report definition is updated in storage for all users.

## Functional Requirements

### FR1: Edit Mode Toggle in AppBar
- The system must add a boolean value `editMode` to the `ViewParams` state
- The system must display a pencil icon in the appBar to toggle `editMode`
- The pencil icon must be grey when `editMode` is `false`
- The pencil icon must be dark red when `editMode` is `true`
- Clicking the icon must toggle the `editMode` value

### FR2: Section-Level Edit Controls
- When `editMode` is `true`, the system must display a pencil icon in the top-right corner of each Report section
- Clicking the pencil icon must enable editing for that specific section
- The system must continue rendering the Report section based on the current (possibly edited) definition

### FR3: Section Definition Editor
- The system must use `ReportSectionEntityInstance` component (similar to the reportDetails Report in `ef57aada-6b77-4384-8007-12f13eddd337.json`) for editing section definitions. The edition of a particular section of a Report can be reached using the `zoomInPath` prop
- The editor must allow modification of all section properties
- The editor must support editing of `extractors` when they are defined
- The editor must support editing of `combiners` when they are defined  
- The editor must support editing of `runtimeTransformers` when they are defined
- The editor must support editing of `extractorTemplates` when they are defined
- The editor must support editing of `combinerTemplates` when they are defined
- The editor must support editing of `runStoredQueries` when they are defined

### FR4: Environment Display
- The system must provide an unfoldable item showing the execution environment
- The environment display must be read-only
- The environment display must show `reportParameters` if defined
- The environment display must show `reportParametersToFetchQueryParametersTransformer` if defined

### FR5: Local State Management  
- When a section is edited, changes must be stored in React component state (`useState`)
- Changes must only affect the current viewing session
- The system must render the Report section using the locally modified definition
- A save icon must appear next to the pencil icon when changes are made
- Clicking the save icon must finalize local (React component state) changes for that section

### FR6: Cancel Functionality
- The system must provide a "cancel" button for each section being edited
- Clicking "cancel" must revert the section to its original (React component state) definition
- Cancelled changes must not affect the rendered Report output

### FR7: Submit to Storage
- The system must provide a "submit" button at the top of the Report view
- The submit button must only be enabled when at least one section has local changes
- Clicking "submit" must send an Action to update the Report definition in storage
- The Action must follow the same pattern as `onEditValueObjectFormSubmit` in `ReportSectionEntityInstance`
- The submit operation must update the Report for all users

### FR8: Visual Feedback
- Sections in edit mode must have a visual indicator (border/background color change)
- The system must show validation errors inline using the existing validation behavior from `JzodElementEditor`
- Invalid JSON or schema violations must prevent saving (similar to `JzodElementEditor` behavior with `codeMirrorIsValidJson`)

## Non-Goals (Out of Scope)

1. **Concurrent editing conflict resolution**: Multiple users editing the same Report simultaneously is handled by "last save wins" pattern
2. **Edit history/undo beyond cancel**: No multi-step undo/redo functionality beyond the cancel button
3. **Permission granularity**: No per-section or per-Report permission system; `editMode` toggle availability is uniform
4. **Real-time collaboration**: No live multi-user editing or presence indicators
5. **Report structure changes**: No ability to add/remove sections, only edit existing sections
6. **Version control**: No built-in version history or rollback beyond the current session

## Design Considerations

### UI Components
- **Edit mode toggle**: Pencil icon in appBar (Material-UI icon: `Edit` or similar)
- **Section edit button**: Small pencil icon in top-right corner of each section
- **Section editor**: Reuse `ReportSectionEntityInstance` component from reportDetails Report
- **Environment viewer**: Expandable/collapsible panel showing read-only runtime context
- **Submit button**: Prominent button at top of Report, enabled only when changes exist

### Visual States
- **Edit mode disabled**: No pencil icons visible on sections
- **Edit mode enabled, no edits**: Grey pencil icons on sections
- **Section being edited**: Dark red pencil + save icon, section highlighted with border
- **Changes pending**: Submit button becomes prominent/enabled

### Interaction Pattern
1. User enables edit mode via appBar toggle
2. Pencil icons appear on all sections
3. User clicks pencil on a specific section
4. Editor opens inline, Report continues rendering with live updates
5. User makes changes, clicks save icon to finalize locally
6. User repeats for other sections as needed
7. User clicks submit button to persist all changes to storage

## Technical Considerations

### State Management
- Use React `useState` for managing local edited Report definition
- Store pending changes per section in component state
- Track which sections have been modified to enable/disable submit button

### Component Reuse
- Leverage `ReportSectionEntityInstance` for the editing interface
- Follow the same validation patterns as `JzodElementEditor` (e.g., `codeMirrorIsValidJson`, inline error display)
- Use existing Action submission pattern from `ReportSectionEntityInstance.onEditValueObjectFormSubmit`

### Integration Points
- `ViewParams`: Add `editMode: boolean` field
- AppBar: Add edit mode toggle icon
- Report rendering component: Add section edit controls when `editMode === true`
- Action system: Submit Report update action similar to entity instance updates

### Data Flow
```
ViewParams.editMode (appBar toggle)
  ↓
Section pencil icons visible
  ↓
User clicks pencil → Load section definition into local state
  ↓
ReportSectionEntityInstance editor modifies local state
  ↓
Report renders using local state (live preview)
  ↓
User clicks save → Finalize local changes for section
  ↓
User clicks submit → Send Action to update Report in storage
```

## Success Metrics

- **Reduction in navigation**: Measure time/clicks required to edit and verify Report changes (target: 50% reduction)
- **User adoption**: Track usage of inline editing feature vs. traditional navigation-based editing
- **Error reduction**: Monitor validation errors caught during inline editing vs. after-the-fact corrections
- **Edit completion rate**: Track ratio of started edits to successfully submitted changes

## Open Questions

None remaining - all clarifications received.

## Acceptance Criteria

1. ✅ Edit mode can be toggled from appBar with visual feedback (grey/dark red pencil icon)
2. ✅ Pencil icons appear on each section when edit mode is enabled
3. ✅ Clicking a section's pencil opens `ReportSectionEntityInstance` editor inline
4. ✅ Editor allows modification of extractors, combiners, runtimeTransformers, and other section properties
5. ✅ Report continues rendering with locally modified section definitions (live preview)
6. ✅ Environment context (reportParameters) is viewable in read-only unfoldable panel
7. ✅ Cancel button reverts section to original definition
8. ✅ Save icon finalizes local changes for a section
9. ✅ Submit button at top sends Action to persist all changes to storage
10. ✅ Validation errors are displayed inline following `JzodElementEditor` patterns
11. ✅ Invalid changes cannot be saved (submit button remains disabled)
12. ✅ After successful submit, all users see updated Report definition

## Implementation Notes

- Reference `packages/miroir-standalone-app/src/miroir-fwk/4_view/components/ValueObjectEditor/JzodElementEditor.tsx` for validation behavior patterns
- Reference Report definition format in `ef57aada-6b77-4384-8007-12f13eddd337.json` for reportDetails Report structure
- Follow existing Action patterns in `ReportSectionEntityInstance.onEditValueObjectFormSubmit` for storage updates
- Ensure proper cleanup of local state when edit mode is disabled or user navigates away
