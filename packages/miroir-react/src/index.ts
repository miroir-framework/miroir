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
