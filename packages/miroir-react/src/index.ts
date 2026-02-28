// Theme system
export { defaultTableTheme } from "./components/Themes/TableTheme.js";
export type { ResolvedTableTheme, TableTheme } from "./components/Themes/TableTheme.js";

export {
  compactMiroirTheme,
  darkMiroirTheme,
  defaultMiroirTheme,
  materialMiroirTheme,
} from "./components/Themes/MiroirTheme.js";
export type { DeepPartial, MiroirTheme, ResolvedMiroirTheme } from "./components/Themes/MiroirTheme.js";

export { resolveTableThemeColors, resolveThemeColors } from "./components/Themes/ThemeColorDefaults.js";

export { DebugHelper, type DebugElements } from "./components/helpers/DebugHelper.js";
export { ThemedOnScreenDebug, ThemedOnScreenHelper } from "./components/helpers/ThemedHelper.js";
export {
  errorLogService,
  logServerError,
  logStartupError,
  type ErrorLogEntry
} from "./components/logs/ErrorLogService.js";

export { CodeBlock_ReadOnly } from "./components/CodeBlock_ReadOnly.js";

// Context provider for global state and services
export {
  FoldedStateTree,
  formikPath_EntityInstanceSelectorPanel,
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
  MiroirThemeContextType, MiroirThemeOption, MiroirThemeProviderProps
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
  applyDomainStateJzodSchemaSelector,
  applyDomainStateQuerySelectorForCleanedResult,
  applyDomainStateQueryTemplateSelector,
  applyReduxDeploymentsStateJzodSchemaSelector,
  applyReduxDeploymentsStateJzodSchemaSelectorTemplate,
  applyReduxDeploymentsStateQuerySelector,
  applyReduxDeploymentsStateQuerySelectorForCleanedResult,
  applyReduxDeploymentsStateQueryTemplateSelector,
  applyReduxDeploymentsStateQueryTemplateSelectorForCleanedResult,
  selectCurrentTransaction,
  selectCurrentReduxDeploymentsStateFromReduxState,
  selectEntityInstanceUuidIndexFromLocalCache,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeploymentFromReduxState,
  getMemoizedReduxDeploymentsStateJzodSchemaSelectorMap,
  getMemoizedReduxDeploymentsStateJzodSchemaSelectorTemplateMap,
  getMemoizedReduxDeploymentsStateSelectorForTemplateMap,
  getMemoizedReduxDeploymentsStateSelectorMap,
  setupMiroirDomainController,
  useSelector,
} from "./miroir-localcache-imports.js"

export {
  ThemedComponentProps
} from "./components/helpers/BaseTypes.js";