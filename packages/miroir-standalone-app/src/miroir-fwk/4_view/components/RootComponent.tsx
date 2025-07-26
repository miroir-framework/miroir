import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Snackbar,
  Alert,
  Toolbar,
  Switch,
  FormControlLabel,
  Typography
} from "@mui/material";
import { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';

import { v4 as uuidv4 } from 'uuid';


import {
  Action2Error,
  Action2ReturnType,
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentLibrary,
  adminConfigurationDeploymentMiroir,
  BoxedQueryTemplateWithExtractorCombinerTransformer,
  defaultMiroirMetaModel,
  Domain2ElementFailed,
  Domain2QueryReturnType,
  DomainControllerInterface,
  entityDeployment,
  LoggerInterface,
  miroirFundamentalJzodSchema,
  MiroirLoggerFactory,
  StoreOrBundleAction,
  StoreUnitConfiguration
} from "miroir-core";
import { ReduxStateChanges } from "miroir-localcache-redux";

import {
  useDomainControllerService,
  useLocalCacheTransactions,
  useMiroirContextService,
  useViewParams,
} from "../MiroirContextReactProvider.js";
import AppBar from './AppBar.js';

import { deployments, packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import { Sidebar } from "./Sidebar.js";
import { SidebarWidth } from "./SidebarSection.js";
import { InstanceEditorOutline } from './InstanceEditorOutline.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "RootComponent")
).then((logger: LoggerInterface) => {log = logger});


const MuiBox: any = Box;

export const emptyDomainElementObject: Domain2QueryReturnType<Record<string,any>> = {}

// Document Outline Context
export interface DocumentOutlineContextType {
  isOutlineOpen: boolean;
  outlineWidth: number;
  outlineData: any;
  outlineTitle: string;
  onToggleOutline: () => void;
  onNavigateToPath: (path: string[]) => void;
  setOutlineData: (data: any) => void;
  setOutlineTitle: (title: string) => void;
}

const DocumentOutlineContext = createContext<DocumentOutlineContextType | null>(null);

export const useDocumentOutlineContext = () => {
  const context = useContext(DocumentOutlineContext);
  if (!context) {
    throw new Error('useDocumentOutlineContext must be used within a DocumentOutlineProvider');
  }
  return context;
};

export interface RootComponentProps {
  // store:any;
  // reportName: string;
}


const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  // display: "inline-block",
  p: 3,
  padding: theme.spacing(3),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  // marginLeft: `-${SidebarWidth}px`,
  // marginLeft: `${SidebarWidth}px`,
  // marginLeft: `24px`,
  // ...(open && {
  //   transition: theme.transitions.create('margin', {
  //     easing: theme.transitions.easing.easeOut,
  //     duration: theme.transitions.duration.enteringScreen,
  //   }),
  //   marginLeft: 0,
  // }),
}));

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const StyledMain =
styled(
  Main, 
  {shouldForwardProp: (prop) => prop !== "open" && prop !== "width" && prop !== "outlineOpen" && prop !== "outlineWidth"}
)<{
  open?: boolean;
  width?: number;
  outlineOpen?: boolean;
  outlineWidth?: number;
}>(
  ({ theme, open, width = SidebarWidth, outlineOpen, outlineWidth = 300 }) => ({
    ...(
      open && {
        width: `calc(100% - ${width}px - ${outlineOpen ? outlineWidth : 0}px)`,
        marginLeft: `${width}px`,
        marginRight: outlineOpen ? `${outlineWidth}px` : 0,
        transition: theme.transitions.create(
          ["margin", "width"], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }
        ),
      }
    ),
    ...(!open && outlineOpen && {
      width: `calc(100% - ${outlineWidth}px)`,
      marginRight: `${outlineWidth}px`,
      transition: theme.transitions.create(
        ["margin", "width"], {
          easing: theme.transitions.easing.easeOut,
          duration: theme.transitions.duration.enteringScreen,
        }
      ),
    }),
  })
);

const boxParams = { display: 'flex', flexGrow: 1, flexDirection:"column" };

let count = 0;
export const RootComponent = (props: RootComponentProps) => {
  // const params = useParams<any>() as Readonly<Params<ReportUrlParamKeys>>;
  count++;
  const [drawerIsOpen, setDrawerIsOpen] = useState(true);
  
  // Use ViewParams for sidebar width management
  const viewParams = useViewParams();
  const [sidebarWidth, setSidebarWidth] = useState(viewParams?.sidebarWidth ?? SidebarWidth);
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info">("info");
  
  // InstanceEditorOutline state
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [outlineWidth, setOutlineWidth] = useState(300);
  const [outlineData, setOutlineData] = useState<any>(null);
  const [outlineTitle, setOutlineTitle] = useState<string>("Document Structure");
  // Remember sidebar state before outline was opened
  const [sidebarStateBeforeOutline, setSidebarStateBeforeOutline] = useState<boolean | null>(null);
  
  log.info(
    "##################################### rendering root component",
    "count",
    count,
  );

  const domainController: DomainControllerInterface = useDomainControllerService();
  const context = useMiroirContextService();
  const transactions: ReduxStateChanges[] = useLocalCacheTransactions();
  const miroirConfig = context.miroirContext.getMiroirConfig();

  if (miroirConfig && miroirConfig.miroirConfigType != "client") {
    throw new Error("RootComponent: miroirConfig.miroirConfigType != 'client' " + JSON.stringify(miroirConfig));
  }

  // ##############################################################################################
  // TODO: are these useMemo needed? This is dubious use, direct from a useMiroirContextService() call
  const displayedDeploymentUuid = useMemo(() => context.deploymentUuid, [context]);
  const setDisplayedDeploymentUuid = useMemo(() => context.setDeploymentUuid, [context]);
  // const displayedApplicationSection = useMemo(() => context.applicationSection, [context]);
  const setDisplayedApplicationSection = useMemo(() => context.setApplicationSection, [context]);

  // ###############################################################################################
  useEffect(() => context.setMiroirFundamentalJzodSchema(miroirFundamentalJzodSchema as any));
  // ###############################################################################################

  const handleDrawerOpen = useMemo(() => () => {
    setDrawerIsOpen(true);
    // If opening sidebar, close outline
    if (isOutlineOpen) {
      setIsOutlineOpen(false);
    }
  }, [setDrawerIsOpen, isOutlineOpen]);

  const handleDrawerClose = useMemo(() => () => {
    setDrawerIsOpen(false);
    // Note: When closing sidebar, we don't automatically open outline
    // The user can manually open it if needed
  }, [setDrawerIsOpen]);

  // Coordinated drawer state handler for sidebar
  const handleDrawerStateChange = useMemo(() => (isOpen: boolean) => {
    if (isOpen) {
      handleDrawerOpen();
    } else {
      handleDrawerClose();
    }
  }, [handleDrawerOpen, handleDrawerClose]);

  const handleChangeDisplayedDeployment = useMemo(() => (event: SelectChangeEvent) => {
    event.stopPropagation();
    log.info('handleChangeDisplayedDeployment',event);
    setDisplayedDeploymentUuid(event.target.value);
    log.info('handleChangeDisplayedDeployment',displayedDeploymentUuid);
    setDisplayedApplicationSection('data');
    // setDisplayedReportUuid("");
  }, [setDisplayedDeploymentUuid, setDisplayedApplicationSection]);

  const handleSidebarWidthChange = useMemo(() => (width: number) => {
    setSidebarWidth(width);
    // Keep ViewParams in sync with sidebar width changes
    viewParams?.updateSidebarWidth(width);
  }, [setSidebarWidth, viewParams]);

  // InstanceEditorOutline handlers with sidebar coordination
  const handleToggleOutline = useCallback(() => {
    setIsOutlineOpen(prev => {
      const newOutlineState = !prev;
      
      if (newOutlineState) {
        // Opening outline: remember current sidebar state and close it
        setSidebarStateBeforeOutline(drawerIsOpen);
        if (drawerIsOpen) {
          setDrawerIsOpen(false);
        }
      } else {
        // Closing outline: restore sidebar to its previous state
        if (sidebarStateBeforeOutline !== null) {
          setDrawerIsOpen(sidebarStateBeforeOutline);
          setSidebarStateBeforeOutline(null);
        }
      }
      
      return newOutlineState;
    });
  }, [drawerIsOpen, sidebarStateBeforeOutline]);

  const handleNavigateToPath = useCallback((path: string[]) => {
    const rootLessListKey = path.join('.');
    
    console.log('Attempting to navigate to path:', path, 'rootLessListKey:', rootLessListKey);
    
    // Helper function to escape CSS selectors
    const escapeCSS = (str: string) => {
      return str.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~\s]/g, '\\$&');
    };
    
    // Try multiple strategies to find the element
    let targetElement: HTMLElement | null = null;
    
    // Strategy 1: Direct ID match
    targetElement = document.getElementById(rootLessListKey);
    
    // Strategy 2: Try with escaped CSS selector
    if (!targetElement) {
      try {
        const escapedSelector = escapeCSS(rootLessListKey);
        targetElement = document.querySelector(`#${escapedSelector}`) as HTMLElement;
      } catch (e) {
        console.warn('CSS selector failed:', e);
      }
    }
    
    // Strategy 3: Try with data-testid
    if (!targetElement) {
      try {
        const escapedSelector = escapeCSS(rootLessListKey);
        targetElement = document.querySelector(`[data-testid="miroirInput"][id="${rootLessListKey}"]`) as HTMLElement;
      } catch (e) {
        // Ignore selector errors
      }
    }
    
    // Strategy 4: Try partial matches (contains)
    if (!targetElement) {
      // Split the path and try to find elements that contain parts of the path
      const pathParts = path.slice(-2); // Take last 2 parts for a more specific search
      const partialKey = pathParts.join('.');
      
      const candidates = Array.from(document.querySelectorAll('[id]'));
      for (const candidate of candidates) {
        const id = (candidate as HTMLElement).id;
        if (id && id.includes(partialKey)) {
          targetElement = candidate as HTMLElement;
          console.log('Found partial match:', id);
          break;
        }
      }
    }
    
    // Strategy 5: Try finding by the last part of the path
    if (!targetElement) {
      const lastPart = path[path.length - 1];
      const candidates = Array.from(document.querySelectorAll('[id]'));
      for (const candidate of candidates) {
        const id = (candidate as HTMLElement).id;
        if (id && id.endsWith(lastPart)) {
          targetElement = candidate as HTMLElement;
          console.log('Found by last part match:', id);
          break;
        }
      }
    }
    
    // Strategy 6: Fuzzy search through all IDs
    if (!targetElement) {
      console.log('Trying fuzzy search...');
      const allElementsWithIds = document.querySelectorAll('[id]');
      const ids = Array.from(allElementsWithIds).map(el => ({
        element: el as HTMLElement,
        id: el.id
      })).filter(item => item.id);
      
      // Look for elements that contain most of the path parts
      const pathWords = path.join(' ').toLowerCase().split(/\s+/);
      let bestMatch: { element: HTMLElement; score: number } | null = null;
      
      for (const {element, id} of ids) {
        const idWords = id.toLowerCase().replace(/[._-]/g, ' ').split(/\s+/);
        let score = 0;
        
        for (const pathWord of pathWords) {
          if (pathWord.length > 2) { // Only consider meaningful words
            for (const idWord of idWords) {
              if (idWord.includes(pathWord) || pathWord.includes(idWord)) {
                score++;
              }
            }
          }
        }
        
        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
          bestMatch = { element, score };
        }
      }
      
      if (bestMatch && bestMatch.score >= 2) { // Require at least 2 word matches
        targetElement = bestMatch.element;
        console.log('Found fuzzy match:', bestMatch.element.id, 'score:', bestMatch.score);
      }
    }
    
    if (targetElement) {
      console.log('Found target element:', targetElement.id);
      
      // Scroll the element into view with smooth behavior
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      });
      
      // Optional: Add a temporary highlight effect
      const originalBackgroundColor = targetElement.style.backgroundColor;
      const originalBorder = targetElement.style.border;
      const originalBorderRadius = targetElement.style.borderRadius;
      
      targetElement.style.backgroundColor = '#fff3cd';
      targetElement.style.border = '2px solid #ffc107';
      targetElement.style.borderRadius = '4px';
      targetElement.style.transition = 'all 0.3s ease';
      
      // Remove the highlight after 2 seconds
      setTimeout(() => {
        targetElement!.style.backgroundColor = originalBackgroundColor;
        targetElement!.style.border = originalBorder;
        targetElement!.style.borderRadius = originalBorderRadius;
        targetElement!.style.transition = '';
      }, 2000);
    } else {
      console.warn('Element not found for path:', path, 'rootLessListKey:', rootLessListKey);
      
      // List all elements with IDs to help with debugging
      const allElementsWithIds = document.querySelectorAll('[id]');
      const ids = Array.from(allElementsWithIds).map(el => el.id).filter(id => id);
      console.log('Available element IDs (first 20):', ids.slice(0, 20));
      console.log('Total elements with IDs:', ids.length);
      
      // Show IDs that might be related
      const relatedIds = ids.filter(id => {
        const pathStr = path.join('').toLowerCase();
        const idStr = id.toLowerCase();
        return pathStr.includes(idStr.slice(-10)) || idStr.includes(pathStr.slice(-10));
      });
      
      if (relatedIds.length > 0) {
        console.log('Potentially related IDs:', relatedIds);
      }
    }
  }, []);

  // Document outline context value
  const outlineContextValue: DocumentOutlineContextType = useMemo(
    () => ({
      isOutlineOpen,
      outlineWidth,
      outlineData,
      outlineTitle,
      onToggleOutline: handleToggleOutline,
      onNavigateToPath: handleNavigateToPath,
      setOutlineData,
      setOutlineTitle,
    }),
    [isOutlineOpen, outlineWidth, outlineData, outlineTitle, handleToggleOutline, handleNavigateToPath]
  );

  const showSnackbar = useMemo(() => (message: string, severity: "success" | "error" | "info" = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  }, []);

  const handleSnackbarClose = useMemo(() => () => {
    setSnackbarOpen(false);
  }, []);

  const handleAsyncAction = useMemo(() => async (action: () => Promise<any>, successMessage: string, actionName: string) => {
    try {
      await action();
      showSnackbar(successMessage, "success");
    } catch (error) {
      log.error(`Error in ${actionName}:`, error);
      showSnackbar(`Error in ${actionName}: ${error}`, "error");
    }
  }, [showSnackbar]);


  return (
    <DocumentOutlineContext.Provider value={outlineContextValue}>
      <div>
      {/* <PersistentDrawerLeft></PersistentDrawerLeft> */}
      {/* <Box sx={{ display: 'flex', flexDirection:"column", flexGrow: 1 }}> */}
      {/* Root loaded {loaded} */}
      {/* <p /> */}
      <MuiBox sx={boxParams}>
        {/* <CssBaseline /> */}
        <Grid container direction="column">
          <Grid item>
            <AppBar 
              handleDrawerOpen={handleDrawerOpen} 
              open={drawerIsOpen}
              width={sidebarWidth}
              onWidthChange={handleSidebarWidthChange}
              outlineOpen={isOutlineOpen}
              outlineWidth={outlineWidth}
              onOutlineToggle={handleToggleOutline}
            >
              Bar!
            </AppBar>
            <Toolbar />
          </Grid>
          <Grid item container>
            <Grid item>
              {/* <SidebarSection open={drawerIsOpen} setOpen={setDrawerIsOpen}></SidebarSection> */}
              <Sidebar 
                open={drawerIsOpen} 
                setOpen={handleDrawerStateChange} 
                width={sidebarWidth}
                onWidthChange={handleSidebarWidthChange}
              ></Sidebar>
            </Grid>
            <Grid item>
              <StyledMain 
                open={drawerIsOpen} 
                width={sidebarWidth}
                outlineOpen={isOutlineOpen}
                outlineWidth={outlineWidth}
              >
                <p />
                  <div>uuid: {uuidv4()}</div>
                  <div>transactions: {JSON.stringify(transactions)}</div>
                  <div>loaded: {count}</div>
                <p />
                <GridSwitchComponent />
                <div>
                  <FormControl fullWidth>
                    <InputLabel id="demo-simple-select-label">Chosen selfApplication Deployment</InputLabel>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      value={context.deploymentUuid}
                      label="displayedDeploymentUuid"
                      onChange={handleChangeDisplayedDeployment}
                    >
                      {deployments.map((deployment) => {
                        return (
                          <MenuItem key={deployment.name} value={deployment.uuid}>
                            {deployment.description}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </div>

                <span>
                  <button
                    onClick={() => handleAsyncAction(async () => {
                      log.info(
                        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ OPENSTORE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
                      );
                      if (!miroirConfig) {
                        throw new Error(
                          "no miroirConfig given, it has to be given on the command line starting the server!"
                        );
                      }
                      const configurations = miroirConfig.client.emulateServer
                        ? miroirConfig.client.deploymentStorageConfig
                        : miroirConfig.client.serverConfig.storeSectionConfiguration;
                      for (const c of Object.entries(configurations)) {
                        const openStoreAction: StoreOrBundleAction = {
                          // actionType: "storeManagementAction",
                          actionType: "storeManagementAction_openStore",
                          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
                          configuration: {
                            [c[0]]: c[1] as StoreUnitConfiguration,
                          },
                          deploymentUuid: c[0],
                        };
                        await domainController.handleAction(openStoreAction)
                      }
                      log.info(
                        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ OPENSTORE DONE @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
                      );
                    }, "Database opened successfully", "open database")}
                  >
                    Open database
                  </button>
                  <button
                    onClick={() => handleAsyncAction(async () => {
                      if (!miroirConfig) {
                        throw new Error(
                          "no miroirConfig given, it has to be given on the command line starting the server!"
                        );
                      }

                      log.info("fetching instances from datastore for deployment", adminConfigurationDeploymentMiroir);
                      // const localMiroirConfig = miroirConfig.client as MiroirConfigForRestClient;
                      const configurations = miroirConfig.client.emulateServer
                        ? miroirConfig.client.deploymentStorageConfig
                        : miroirConfig.client.serverConfig.storeSectionConfiguration;
                      // ADMIN ONLY!!

                      if (!configurations[adminConfigurationDeploymentAdmin.uuid]) {
                        throw new Error(
                          "no configuration for Admin selfApplication Deployment given, can not fetch data. Admin deployment uuid=" +
                            adminConfigurationDeploymentAdmin.uuid +
                            " configurations=" +
                            JSON.stringify(configurations, null, 2)
                        );
                      }
                      await domainController.handleAction({
                        // actionType: "modelAction",
                        actionType: "rollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                      }, defaultMiroirMetaModel);

                      const subQueryName = "deployments";
                      const adminDeploymentsQuery: BoxedQueryTemplateWithExtractorCombinerTransformer = {
                        queryType: "boxedQueryTemplateWithExtractorCombinerTransformer",
                        deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                        pageParams: {},
                        queryParams: {},
                        contextResults: {},
                        extractorTemplates: {
                          [subQueryName]: {
                            extractorTemplateType: "extractorTemplateForObjectListByEntity",
                            applicationSection: "data",
                            parentName: "Deployment",
                            parentUuid: {
                              transformerType: "constantUuid",
                              interpolation: "build",
                              value: entityDeployment.uuid,
                            },
                          },
                        },
                      };
                      const adminDeployments: Action2ReturnType = 
                        await domainController.handleQueryTemplateOrBoxedExtractorTemplateActionForServerONLY(
                          {
                            actionType: "runBoxedQueryTemplateOrBoxedExtractorTemplateAction",
                            actionName: "runQuery",
                            deploymentUuid:adminConfigurationDeploymentAdmin.uuid,
                            endpoint: "9e404b3c-368c-40cb-be8b-e3c28550c25e",
                            payload: {
                              applicationSection: "data",
                              query: adminDeploymentsQuery
                            }
                          }
                        )
                      ;
                      
                      if (adminDeployments instanceof Action2Error) {
                        throw new Error("found adminDeployments with error " + adminDeployments);
                      }
                      
                      if (adminDeployments.returnedDomainElement instanceof Domain2ElementFailed) {
                        throw new Error("found adminDeployments failed " + adminDeployments.returnedDomainElement);
                      }
                      if (typeof adminDeployments.returnedDomainElement != "object" ) {
                        throw new Error("found adminDeployments query result not an object as expected " + adminDeployments.returnedDomainElement);
                      }

                      if ( !adminDeployments.returnedDomainElement[subQueryName] ) {
                        throw new Error("found adminDeployments query result object does not have attribute " + subQueryName + " as expected " + adminDeployments.returnedDomainElement);
                      }
                     
                      const foundDeployments = adminDeployments.returnedDomainElement[subQueryName];

                      log.info("found adminDeployments", JSON.stringify(adminDeployments));
                  
                      // open and refresh found deployments
                      for (const c of Object.values(foundDeployments)) { // TODO: correct type of c
                        const openStoreAction: StoreOrBundleAction = {
                          // actionType: "storeManagementAction",
                          actionType: "storeManagementAction_openStore",
                          endpoint: "bbd08cbb-79ff-4539-b91f-7a14f15ac55f",
                          configuration: {
                            [(c as any).uuid]: (c as any /** Deployment */).configuration as StoreUnitConfiguration,
                          },
                          deploymentUuid: (c as any).uuid,
                        };
                        await domainController.handleAction(openStoreAction)

                        await domainController.handleAction({
                          // actionType: "modelAction",
                          actionType: "rollback",
                          endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                          deploymentUuid: (c as any).uuid,
                        }, defaultMiroirMetaModel);
                      }
                    }, "Miroir & App configurations fetched successfully", "fetch configurations")}
                  >
                    fetch Miroir & App configurations from database
                  </button>
                  <button
                    onClick={() => handleAsyncAction(async () => {
                      log.info("fetching instances from datastore for deployment", adminConfigurationDeploymentMiroir);
                      await domainController.handleAction({
                        // actionType: "modelAction",
                        actionType: "rollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: adminConfigurationDeploymentAdmin.uuid,
                      }, defaultMiroirMetaModel);
                    }, "Admin configuration fetched successfully", "fetch admin configuration")}
                  >
                    fetch Admin configuration from database
                  </button>
                  <button
                    onClick={() => handleAsyncAction(async () => {
                      // await uploadBooksAndReports(domainController, defaultMiroirMetaModel);
                      await domainController.handleAction({
                        // actionType: "modelAction",
                        actionType: "remoteLocalCacheRollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                      }, defaultMiroirMetaModel);
                      await domainController.handleAction({
                        // actionType: "modelAction",
                        actionType: "remoteLocalCacheRollback",
                        endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                        deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                      }, defaultMiroirMetaModel);
                    }, "Server local cache loaded successfully", "load server local cache")}
                  >
                    Load server local cache
                  </button>
                  {/* commit miroir */}
                  <span>
                    <button
                      onClick={() => handleAsyncAction(async () => {
                        await domainController.handleAction(
                          {
                            // actionType: "modelAction",
                            actionType: "commit",
                            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                            deploymentUuid: adminConfigurationDeploymentMiroir.uuid,
                          },
                          defaultMiroirMetaModel
                        );
                      }, "Miroir committed successfully", "commit miroir")}
                    >
                      Commit Miroir
                    </button>
                  </span>
                  {/* Commit Library app */}
                  <span>
                    <button
                      onClick={() => handleAsyncAction(async () => {
                        await domainController.handleAction(
                          {
                            // actionType: "modelAction",
                            actionType: "commit",
                            endpoint: "7947ae40-eb34-4149-887b-15a9021e714e",
                            deploymentUuid: adminConfigurationDeploymentLibrary.uuid,
                          },
                          defaultMiroirMetaModel
                        );
                      }, "Library app committed successfully", "commit library app")}
                    >
                      Commit Library app
                    </button>
                  </span>

                </span>
                <p />
                <span>
                </span>
                <Outlet></Outlet>
              </StyledMain>
            </Grid>
          </Grid>
        </Grid>
      </MuiBox>

      {/* Document Outline - Full height on right side */}
      <InstanceEditorOutline
        isOpen={isOutlineOpen}
        onToggle={handleToggleOutline}
        data={outlineData}
        onNavigate={handleNavigateToPath}
        title={outlineTitle}
        width={outlineWidth}
        onWidthChange={setOutlineWidth}
      />
      
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
    </DocumentOutlineContext.Provider>
  );
};

// Grid Switch Component
const GridSwitchComponent: React.FC = () => {
  const viewParams = useViewParams();

  const handleGridTypeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    viewParams?.setGridType(event.target.checked ? 'glide-data-grid' : 'ag-grid');
  }, [viewParams]);

  return (
    <Box
      sx={{ mb: 2, p: 1, border: "1px solid #e0e0e0", borderRadius: 1, backgroundColor: "#f5f5f5" }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={viewParams?.gridType === "glide-data-grid"}
            onChange={handleGridTypeChange}
            name="gridType"
            color="primary"
          />
        }
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" color="textSecondary">
              Grid Type:
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {viewParams?.gridType === "ag-grid" ? "AG-Grid" : "Glide Data Grid"}
            </Typography>
          </Box>
        }
      />
    </Box>
  );
};
