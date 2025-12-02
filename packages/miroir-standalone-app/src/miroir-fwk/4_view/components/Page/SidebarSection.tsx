import { useTheme } from '@mui/material/styles';
import { FC, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { cleanLevel } from "../../constants.js";
import {
  ThemedDivider,
  ThemedIcon,
  ThemedList,
  ThemedListItem,
  ThemedListItemButton,
  ThemedListItemText,
  ThemedListMiroirIcon
} from "../Themes/index";


import {
  adminConfigurationDeploymentAdmin,
  adminConfigurationDeploymentMiroir,
  Domain2QueryReturnType,
  dummyDomainManyQueryWithDeploymentUuid,
  entityMenu,
  getApplicationSection,
  getQueryRunnerParamsForReduxDeploymentsState,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerParams,
  Uuid,
  type MiroirMenuItem
} from "miroir-core";
import { getMemoizedReduxDeploymentsStateSelectorMap } from 'miroir-localcache-redux';
import { packageName } from '../../../../constants.js';
import { useCurrentModel, useReduxDeploymentsStateQuerySelector } from '../../ReduxHooks.js';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallbackComponent } from '../ErrorFallbackComponent.js';
import { useMiroirContextService } from '../../MiroirContextReactProvider.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Sidebar"), "UI",
).then((logger: LoggerInterface) => {log = logger});


export const SidebarWidth = 200;

export interface ResponsiveAppBarProps {
  handleDrawerOpen: ()=>void,
  open: boolean,
  children:any,
}

const sideBarDefaultItems: MiroirMenuItem[] = [
  {
    label: "A Menu will be displayed here!",
    section: "model",
    selfApplication: adminConfigurationDeploymentMiroir.uuid,
    reportUuid: "",
    "icon": "south",
  },
];

let count = 0;
// ################################################################################################
export interface SidebarSectionProps {deploymentUuid: Uuid, menuUuid: Uuid, open:boolean, setOpen: (v:boolean)=>void};
export const SidebarSection:FC<SidebarSectionProps> = (props: SidebarSectionProps) => {
  count++;
  const theme = useTheme();
  const context = useMiroirContextService();

  // const domainController: DomainControllerInterface = useDomainControllerService();
  // const miroirConfig = context.getMiroirConfig();
  // const context = useMiroirContext();
  const currentModel: MetaModel = useCurrentModel(
    adminConfigurationDeploymentAdmin.uuid
  );

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> = useMemo(
    () => getMemoizedReduxDeploymentsStateSelectorMap(),
    []
  )

  const fetchDeploymentMenusQueryParams: SyncQueryRunnerParams<ReduxDeploymentsState> = useMemo(
    () =>
      getQueryRunnerParamsForReduxDeploymentsState(
        currentModel?.entities?.length > 0? 
        {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              deploymentUuid: props.deploymentUuid,
              pageParams: {},
              queryParams: {},
              contextResults: {},
              extractors: {
                menus: {
                  extractorOrCombinerType: "extractorForObjectByDirectReference",
                  parentName: "Menu",
                  applicationSection: getApplicationSection(props.deploymentUuid, entityMenu.uuid),
                  parentUuid: entityMenu.uuid,
                  instanceUuid: props.menuUuid,
                },
              },
            }
          : dummyDomainManyQueryWithDeploymentUuid
          ,
        deploymentEntityStateSelectorMap
      ),
    [deploymentEntityStateSelectorMap, currentModel, props.deploymentUuid, props.menuUuid]
  );

  // log.info("SidebarSection fetchDeploymentMenusQueryParams",fetchDeploymentMenusQueryParams)
  const miroirMenusDomainElementObject: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useReduxDeploymentsStateQuerySelector(
    deploymentEntityStateSelectorMap.runQuery,
    fetchDeploymentMenusQueryParams
  );

  // log.info("SidebarSection deploymentEntityStateDomainElementObject",miroirMenusDomainElementObject)
  // console.log(
  //   "SidebarSection refresh",
  //   count++,
  //   "props.deploymentUuid",
  //   props.deploymentUuid,
  //   "props.menuUuid",
  //   props.menuUuid,
  //   "found miroir menu miroirMenusDomainElementObject result",
  //   miroirMenusDomainElementObject.elementType == "failure",
  //   miroirMenusDomainElementObject,
  //   // miroirMenusDomainElementObject?.elementValue
  // );
  // const drawerSx = useMemo(()=>({flexDirection:'column'}),[])
  return (
    <>
      <ErrorBoundary
        FallbackComponent={({ error, resetErrorBoundary }) => (
          <ErrorFallbackComponent
            error={error}
            resetErrorBoundary={resetErrorBoundary}
            context={{
              origin: "SidebarSection",
              objectType: "root_editor",
              rootLessListKey: "ROOT",
              // currentValue: zoomedInValueObject_DEFUNCT,
              // formikValues: undefined,
              // rawJzodSchema: zoomedInDisplaySchema,
              // localResolvedElementJzodSchemaBasedOnValue:
              //   jzodTypeCheckResult?.status == "ok"
              //     ? jzodTypeCheckResult.resolvedSchema
              //     : undefined,
            }}
          />
        )}
      >
        {miroirMenusDomainElementObject.elementType == "failure" ? (
          <ThemedList disablePadding dense>
            <ThemedListItem key={"failed"} disablePadding>
              <ThemedListItemButton>
                <ThemedListMiroirIcon>
                  {/* {index % 2 === 0 ? <InboxIcon /> : <MailIcon />} */}
                  <ThemedIcon icon="error" />
                </ThemedListMiroirIcon>
                <ThemedListItemText primary="Failed to load menu" />
              </ThemedListItemButton>
            </ThemedListItem>
          </ThemedList>
        ) : (
          <>
            {!((miroirMenusDomainElementObject as any)?.menus as any)?.definition?.menuType ||
            ((miroirMenusDomainElementObject as any)?.menus as any)?.definition?.menuType ==
              "simpleMenu" ? (
              <ThemedList disablePadding dense>
                {(
                  ((miroirMenusDomainElementObject as any)?.menus as any)?.definition?.definition ??
                  sideBarDefaultItems
                )
                  .filter(
                    (curr: MiroirMenuItem) =>
                      !curr.menuItemScope || curr.menuItemScope == "data" || context.showModelTools
                  )
                  .map((i: any, index: number) => (
                    <ThemedListItem key={i.label} disablePadding>
                      <ThemedListItemButton
                        sx={{ padding: 0 }}
                        component={Link}
                        to={`/report/${i.selfApplication}/${i.section}/${i.reportUuid}/xxxxxx`}
                      >
                        <ThemedListMiroirIcon>
                          {/* {index % 2 === 0 ? <InboxIcon /> : <MailIcon />} */}
                          <ThemedIcon icon={i.icon} />
                        </ThemedListMiroirIcon>
                        <ThemedListItemText primary={i.label} />
                      </ThemedListItemButton>
                    </ThemedListItem>
                  ))}
              </ThemedList>
            ) : (
              <ThemedList disablePadding dense>
                {(
                  ((miroirMenusDomainElementObject as any)?.menus as any)?.definition?.definition ??
                  []
                ).flatMap((menuSection: any, index: number) =>
                  menuSection.items
                    .filter(
                      (curr: MiroirMenuItem) =>
                      !curr.menuItemScope || curr.menuItemScope == "data" || context.showModelTools
                    )
                    .map((curr: any, index: number) => (
                      <ThemedListItem key={curr.label + index} disablePadding>
                        <ThemedListItemButton
                          component={Link}
                          to={`/report/${curr.selfApplication}/${curr.section}/${curr.reportUuid}/xxxxxx`}
                        >
                          <ThemedListMiroirIcon>
                            {/* {index % 2 === 0 ? <InboxIcon /> : <MailIcon />} */}
                            <ThemedIcon icon={curr.icon} />
                          </ThemedListMiroirIcon>
                          <ThemedListItemText primary={curr.label} />
                        </ThemedListItemButton>
                      </ThemedListItem>
                    ))
                    .concat([<ThemedDivider key={menuSection.label + "Divider"} />])
                )}
              </ThemedList>
            )}
          </>
        )}{" "}
      </ErrorBoundary>
    </>
  );
}

