// Theme system
export { defaultTableTheme } from "./components/Themes/TableTheme.js";
export type { ResolvedTableTheme, TableTheme } from "./components/Themes/TableTheme.js";

export {
  compactMiroirTheme,
  darkMiroirTheme,
  defaultMiroirTheme,
  materialMiroirTheme,
} from "./components/Themes/MiroirTheme.js";
export type {
  DeepPartial,
  MiroirTheme,
  ResolvedMiroirTheme,
} from "./components/Themes/MiroirTheme.js";

export {
  resolveTableThemeColors,
  resolveThemeColors,
} from "./components/Themes/ThemeColorDefaults.js";

export {
  JsonDisplayHelper,
  DebugHelper,
  type DebugElements,
  type JsonElementToDisplay,
} from "./components/helpers/DebugHelper.js";
export { ThemedOnScreenDebug, ThemedOnScreenHelper } from "./components/helpers/ThemedHelper.js";
export {
  errorLogService,
  logServerError,
  logStartupError,
  type ErrorLogEntry,
} from "./components/logs/ErrorLogService.js";

export { CodeBlock_ReadOnly } from "./components/CodeBlock_ReadOnly.js";

// Block editor colors (#498)
export {
  blockCategoryColor,
  defaultBlockEditorColors,
  type BlockEditorColors,
} from "./components/Themes/BlockEditorColors.js";

// Feedback glow (#438)
export {
  acquireFeedbackGlowStyles,
  attachFeedbackGlow,
  defaultFeedbackGlow,
  feedbackGlowAttribute,
  feedbackGlowClass,
  feedbackGlowColorProperty,
  feedbackGlowDurationBoundsMs,
  feedbackGlowDurationProperty,
  feedbackGlowIntensityBounds,
  feedbackGlowIntensityProperty,
  feedbackGlowOptOutAttribute,
  feedbackGlowStylesAttribute,
  feedbackGlowTargetSelector,
  type FeedbackGlowOptions,
} from "./components/FeedbackGlow/feedbackGlow.js";
export {
  FeedbackGlowBoundary,
  type FeedbackGlowBoundaryProps,
} from "./components/FeedbackGlow/FeedbackGlowBoundary.js";

// Context provider for global state and services
export {
  evaluateSchemaRevisionChange,
  resolveSchemaForDeploymentPolicy,
  type ApplySchemaRevisionInput,
  type ApplySchemaRevisionResult,
  type DeploymentSchemaRevisions,
} from "./contexts/schemaReloadPolicy.js";
export {
  FoldedStateTree,
  formikPath_EntityInstanceSelectorPanel,
  feedbackGlowStorageKey,
  MiroirContextReactProvider,
  MiroirContextReactTestProvider,
  MiroirReactContext,
  ToolsPageState,
  useApplicationDeploymentMap,
  useDomainControllerService,
  useErrorLogService,
  useLocalCacheTransactions,
  useMiroirContext,
  useMiroirContextformHelperState,
  useMiroirContextInnerFormOutput,
  useMiroirContextService,
  useMiroirEvents,
  useMiroirEventTrackingData,
  useSnackbar,
  useViewParams,
} from "./contexts/MiroirContextReactProvider.js";
// Theme context and hooks
export {
  MiroirThemeContext,
  MiroirThemeProvider,
  useMiroirColors,
  useMiroirComponents,
  useMiroirNestingBorderColor,
  useMiroirNestingColor,
  useMiroirSpacing,
  useMiroirTableTheme,
  useMiroirTheme,
  useMiroirTypography,
} from "./contexts/MiroirThemeContext.js";

export type {
  MiroirThemeContextType,
  MiroirThemeOption,
  MiroirThemeProviderProps,
} from "./contexts/MiroirThemeContext.js";

export {
  ReportSectionRenderersProvider,
  UnsupportedReportSection,
  useReportSectionRenderers,
} from "./contexts/ReportSectionRenderersContext.js";

export type {
  GraphReportSectionRendererProps,
  MiroirTestReportSectionRendererProps,
  ModelDiagramReportSectionRendererProps,
  ReportSectionRenderers,
  StoredRunnerRendererProps,
} from "./contexts/ReportSectionRenderersContext.js";

export {
  LocalCache,
  RestPersistenceClientAndRestClient,
  LocalCacheProvider,
  LocalCacheSliceState,
  LocalCacheSliceStateZone,
  PersistenceReduxSaga,
  ReduxStateChanges,
  ReduxStateWithUndoRedo,
  ReduxStoreWithUndoRedo,
  reduxStoreWithUndoRedoGetInitialState,
  applyDomainStateQuerySelectorForCleanedResult,
  applyDomainStateQueryTemplateSelector,
  applyReduxDeploymentsStateQuerySelector,
  applyReduxDeploymentsStateQuerySelectorForCleanedResult,
  applyReduxDeploymentsStateQueryTemplateSelector,
  applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult,
  selectCurrentTransaction,
  selectCurrentReduxDeploymentsStateFromReduxState,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeploymentFromReduxState,
  getMemoizedReduxDeploymentsStateSelectorForTemplateMap,
  getMemoizedReduxDeploymentsStateSelectorMap,
  setupMiroirDomainController,
  useSelector,
} from "./miroir-localcache-imports.js";

export { ThemedComponentProps } from "./components/helpers/BaseTypes.js";

// Moved from miroir-standalone-app/src/miroir-fwk/4_view (#592)
export * from "./components/CenteredSpinner.js";

// Moved from miroir-standalone-app/src/miroir-fwk/4_view (#592)
export * from "./components/DraggableContainer.js";
export * from "./components/Themes/BasicComponents.js";
export * from "./components/Themes/DisplayComponents.js";
export * from "./components/Themes/DrawerComponents.js";
export * from "./components/Themes/FileSelector.js";
export * from "./components/Themes/FormComponents.js";
export * from "./components/Themes/IconComponents.js";
export * from "./components/Themes/LayoutComponents.js";
export * from "./components/Themes/ListComponents.js";
export * from "./components/Themes/MUIComponents.js";
export * from "./components/Themes/MaterialSymbolWrappers.js";
export * from "./components/Themes/SvgWithLetter.js";
export * from "./components/Themes/SymbolWithLetter.js";
export * from "./components/Themes/TableStyleGenerators.js";
export * from "./components/Themes/ThemeUtils.js";
export * from "./components/Themes/UIComponents.js";
export * from "./components/Themes/resolveMiroirIconColor.js";
export * from "./components/Themes/spinner.js";
export * from "./tools/PortalContainerContext.js";
export * from "./tools/emptyObject.js";
export * from "./tools/localCacheMonitorConfig.js";
export * from "./tools/localCacheMonitorGate.js";
export * from "./tools/localCacheMonitorIndicators.js";
export * from "./tools/localCacheMonitorRegistry.js";
export * from "./tools/localCacheMonitorSession.js";
export * from "./tools/performanceConfig.js";
export * from "./tools/performanceDisplayGate.js";
export * from "./tools/progressiveRevealScheduler.js";
export * from "./tools/renderInsightChrome.js";
export * from "./tools/renderInsightMaxDepth.js";
export * from "./tools/renderInsightRegistry.js";
export * from "./tools/renderInsightSummarize.js";
export * from "./tools/renderPerformanceMeasure.js";
export * from "./utils/foreignKeyAttributeAnalyzer.js";

// Moved from miroir-standalone-app/src/miroir-fwk/4_view (#592)
export * from "./ErrorPage.js";
export * from "./adaptiveColumnWidths.js";
export * from "./auth/authSession.js";
export * from "./auth/useApplicationAccess.js";
export * from "./components/BlockEditor/BlockEditing.js";
export * from "./components/BlockEditor/BlockEndpointAction.js";
export * from "./components/BlockEditor/BlockFields.js";
export * from "./components/BlockEditor/BlockResult.js";
export * from "./components/BlockEditor/BlockVariablePath.js";
export * from "./components/BlockEditor/BlockViewMode.js";
export * from "./components/ChangeValueTypeSelect.js";
export * from "./components/ErrorFallbackComponent.js";
export * from "./components/EventLogComponent.js";
export * from "./components/Graph/GraphInterfaces.js";
export * from "./components/Grids/EntityInstanceGridInterface.js";
export * from "./components/Grids/GlideDataGridFilterComponent.js";
export * from "./components/Grids/GridContextProvider.js";
export * from "./components/Grids/GridPaginationToolbar.js";
export * from "./components/Grids/GridSizingDebugProbe.js";
export * from "./components/Grids/GridTools.js";
export * from "./components/Grids/TableActionButtonComponents.js";
export * from "./components/Grids/TableActionButtons.js";
export * from "./components/Grids/ValueObjectGridInterface.js";
export * from "./components/Grids/gridPagination.js";
export * from "./components/IconExtractionDemo.js";
export * from "./components/MaterialIconCanvasRenderer.js";
export * from "./components/MiroirEventTimeline.js";
export * from "./components/MiroirThemeSelector.js";
export * from "./components/Page/GlobalFeedbackGlow.js";
export * from "./components/Page/PageContainer.js";
export * from "./components/Page/appBarReportNavigation.js";
export * from "./components/Page/applicationModelScopeMenu.js";
export * from "./components/Page/deploymentReportsEntitiesMapping.js";
export * from "./components/PerformanceDisplayContainer.js";
export * from "./components/ReportInstanceLink.js";
export * from "./components/Reports/ExpectedOutputTypeChooser.js";
export * from "./components/Reports/ExportFailedTestLogsButton.js";
export * from "./components/Reports/FoldedStateTreeDebug.js";
export * from "./components/Reports/FoldedStateTreeUtils.js";
export * from "./components/Reports/FormikValueObjectContext.js";
export * from "./components/Reports/ListSectionTransformerControls.js";
export * from "./components/Reports/MarkdownEditorModal.js";
export * from "./components/Reports/RenderMeasurementTable.js";
export * from "./components/Reports/ReportFormSubmitContext.js";
export * from "./components/Reports/ReportPageContext.js";
export * from "./components/Reports/TransformerRunner.js";
export * from "./components/Reports/listDisplayByTransformer.js";
export * from "./components/Reports/miroirTestSuiteKey.js";
export * from "./components/Reports/reportInputApplication.js";
export * from "./components/Reports/resolveApiCallReportSectionSchema.js";
export * from "./components/Reports/unitTestKindUi.js";
export * from "./components/Reports/useEnsureReportQueryLoaded.js";
export * from "./components/Reports/useReportQueryLoadService.js";
export * from "./components/Reports/useYamlParserStatus.js";
export * from "./components/Runners/RunnerInterface.js";
export * from "./components/Runners/buildCreateApplicationStorageSchema.js";
export * from "./components/Runners/runnerDefinitionApplication.js";
export * from "./components/TransformerEditor/TransformerDefinitionSave.js";
export * from "./components/TransformerEditor/TransformerEditorInterface.js";
export * from "./components/ValueObjectEditor/BlobEditorField.js";
export * from "./components/ValueObjectEditor/EditorRootHistory.js";
export * from "./components/ValueObjectEditor/FieldValidationContext.js";
export * from "./components/ValueObjectEditor/FieldValidationError.js";
export * from "./components/ValueObjectEditor/InstanceEditorOutlineContext.js";
export * from "./components/ValueObjectEditor/TransformerNodeActions.js";
export * from "./components/ValueObjectEditor/ValueHistory.js";
export * from "./components/ValueObjectEditor/ValueHistoryButtons.js";
export * from "./components/ValueObjectEditor/ValueHistoryProvider.js";
export * from "./components/ValueObjectEditor/renderedValueMarkers.js";
export * from "./components/ValueObjectEditor/unionDiscriminatorField.js";
export * from "./components/ViewParamsUpdateQueue.js";
export * from "./components/ViewParamsUpdateQueueTestUtils.js";
export * from "./components/saveInstanceFromUI.js";
export * from "./navigation.js";
export * from "./scripts.js";

// Report URL parameters, moved from miroir-standalone-app/src/constants.ts (#600)
export * from "./reportUrlParams.js";

// Moved from miroir-standalone-app/src/miroir-fwk/4_view (#592)
export * from "./components/LocalCacheMonitorSummary.js";
export * from "./components/Page/ActionButtonWithSnackbar.js";
export * from "./components/RenderInsightHeader.js";
export * from "./components/RenderInsightSummary.js";
export * from "./components/Reports/OpenApiEndpointSyncButton.js";
export * from "./components/Reports/UnitTestExecutionSummary.js";
export * from "./tools/renderCountTracker.js";
export * from "./tools/useRenderInsight.js";
export * from "./tools/useTrackedRender.js";

// Moved from miroir-standalone-app/src/miroir-fwk/4_view (#592)
export * from "./ModelEnvironmentSync.js";
export * from "./ReduxHooks.js";
export * from "./auth/UserAccountMenu.js";
export * from "./auth/useDesignerToolsVisibility.js";
export * from "./components/BlockEditor/BlockEditorDisplay.js";
export * from "./components/Buttons/testResultReport.js";
export * from "./components/EntityInstanceLink.js";
export * from "./components/JsonObjectDeleteFormDialog.js";
export * from "./components/Page/SidebarSection.js";
export * from "./components/Reports/MultistepReportHost.js";
export * from "./components/Reports/OpenReportLaunch.js";
export * from "./components/Reports/ReportHooks.js";
export * from "./components/Reports/ReportSectionMarkdown.js";
export * from "./components/Reports/TransformerTestResults.js";
export * from "./components/Reports/testSelectionUtils.js";
export * from "./components/TransformerEditor/TransformerTypesDisplay.js";
export * from "./components/ValueObjectEditor/MlEditorButton.js";
export * from "./components/ValueObjectEditor/MlElementEditorHooks.js";
export * from "./components/useAdminViewParams.js";
export * from "./tools/hookPerformanceMeasure.js";

// Moved from miroir-standalone-app/src/miroir-fwk/4_view (#604)
export * from "./components/BlockEditor/BlockDefineHeader.js";
export * from "./components/BlockEditor/BlockDragDrop.js";
export * from "./components/BlockEditor/BlockEditorView.js";
export * from "./components/BlockEditor/BlockInsertTargets.js";
export * from "./components/BlockEditor/BlockPalette.js";
export * from "./components/BlockEditor/BlockRunnerHat.js";
export * from "./components/BlockEditor/BlockViewSwitch.js";
export * from "./components/Page/Sidebar.js";
export * from "./components/Reports/InlineReportEditor.js";
export * from "./components/Reports/ReportInputSection.js";
export * from "./components/Reports/ReportSectionEntityInstance.js";
export * from "./components/Reports/ReportTools.js";
export * from "./components/Reports/TransformerTypeAnnotation.js";
export * from "./components/Reports/TypedValueObjectEditor.js";
export * from "./components/Reports/TypedValueObjectEditorWithFormik.js";
export * from "./components/Runners/InnerRunnerView.js";
export * from "./components/TransformerEditor/EntityInstanceSelectorPanel.js";
export * from "./components/TransformerEditor/TransformationResultPanel.js";
export * from "./components/TransformerEditor/TransformerEditor.js";
export * from "./components/TransformerEditor/TransformerEventsPanel.js";
export * from "./components/ValueObjectEditor/MlAnyEditor.js";
export * from "./components/ValueObjectEditor/MlArrayEditor.js";
export * from "./components/ValueObjectEditor/MlElementEditor.js";
export * from "./components/ValueObjectEditor/MlElementEditorInterface.js";
export * from "./components/ValueObjectEditor/MlElementEditorReactCodeMirror.js";
export * from "./components/ValueObjectEditor/MlElementStringEditor.js";
export * from "./components/ValueObjectEditor/MlEnumEditor.js";
export * from "./components/ValueObjectEditor/MlLiteralEditor.js";
export * from "./components/ValueObjectEditor/MlObjectEditor.js";
export * from "./components/interactive/ApplicationSelector.js";
export * from "./tools/ComponentTestModeContext.js";
export * from "./tools/progressiveRenderConfig.js";
export * from "./tools/useViewportReveal.js";
export { lastSubmitButtonClicked } from "./viewConstants.js";
