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
adminSelfApplication,
} from "miroir-test-app_deployment-admin";
import {
  defaultSelfApplicationDeploymentMap,
  Domain2QueryReturnType,
  dummyDomainManyQueryWithDeploymentUuid,
  entityMenu,
  getApplicationSection,
  getQueryRunnerParamsForReduxDeploymentsState,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  selfApplicationDeploymentMiroir,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerExtractorAndParams,
  Uuid,
  type ApplicationDeploymentMap,
  type MiroirMenuItem
} from "miroir-core";
import { getMemoizedReduxDeploymentsStateSelectorMap } from '../../../miroir-localcache-imports.js';
import { ErrorBoundary } from 'react-error-boundary';
import { packageName } from '../../../../constants.js';
import { useMiroirContextService } from '../../MiroirContextReactProvider.js';
import { useCurrentModel, useReduxDeploymentsStateQuerySelector } from '../../ReduxHooks.js';
import { ErrorFallbackComponent } from '../ErrorFallbackComponent.js';
import { ThemedOnScreenDebug } from '../Themes/BasicComponents.js';

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
    miroirMenuItemType: "miroirMenuItemLink",
    label: "A Menu will be displayed here!",
    section: "model",
    selfApplication: "noApplicationSpecified",
    reportUuid: "",
    "icon": "south",
  },
];

// ################################################################################################
interface MenuItemProps {
  menuItem: MiroirMenuItem;
  applicationDeploymentMap: ApplicationDeploymentMap;
  keyValue: string;
  showPadding?: boolean;
}

const MenuItemDisplay: FC<MenuItemProps> = ({ menuItem, applicationDeploymentMap, keyValue, showPadding = false }) => {
  return menuItem.miroirMenuItemType == "miroirMenuItemLink" ? (
    <ThemedListItem key={keyValue} disablePadding>
      <ThemedListItemButton
        sx={showPadding ? { padding: 0 } : undefined}
        component={Link}
        to={`/report/${menuItem.selfApplication}/${
          applicationDeploymentMap[menuItem.selfApplication]
        }/${menuItem.section}/${menuItem.reportUuid}/${menuItem.instanceUuid ?? "xxxxxx"}`}
      >
        <ThemedListMiroirIcon>
          <ThemedIcon icon={menuItem.icon} />
        </ThemedListMiroirIcon>
        <ThemedListItemText primary={menuItem.label} />
      </ThemedListItemButton>
    </ThemedListItem>
  ) : (
    <ThemedDivider />
  );
};

let count = 0;
// ################################################################################################
export interface SidebarSectionProps {
  applicationUuid: Uuid,
  applicationDeploymentMap: ApplicationDeploymentMap | undefined,
  deploymentUuid: Uuid, menuUuid: Uuid, open:boolean, setOpen: (v:boolean)=>void};

// ################################################################################################
export const SidebarSection:FC<SidebarSectionProps> = (props: SidebarSectionProps) => {
  count++;
  const theme = useTheme();
  const context = useMiroirContextService();

  const currentModel: MetaModel = useCurrentModel(
    props.applicationUuid,
    props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
  );

  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<ReduxDeploymentsState> = useMemo(
    () => getMemoizedReduxDeploymentsStateSelectorMap(),
    []
  )

  const fetchDeploymentMenusQueryParams: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState> = useMemo(
    () =>
      getQueryRunnerParamsForReduxDeploymentsState(
        currentModel?.entities?.length > 0? 
        {
              queryType: "boxedQueryWithExtractorCombinerTransformer",
              application: props.applicationUuid,
              pageParams: {},
              queryParams: {},
              contextResults: {},
              extractors: {
                menus: {
                  extractorOrCombinerType: "extractorForObjectByDirectReference",
                  parentName: "Menu",
                  applicationSection: getApplicationSection(props.applicationUuid, entityMenu.uuid),
                  parentUuid: entityMenu.uuid,
                  instanceUuid: props.menuUuid,
                },
              },
            }
          : dummyDomainManyQueryWithDeploymentUuid
          , deploymentEntityStateSelectorMap
      ),
    [deploymentEntityStateSelectorMap, currentModel, props.deploymentUuid, props.menuUuid]
  );

  // log.info("SidebarSection fetchDeploymentMenusQueryParams",fetchDeploymentMenusQueryParams)
  const miroirMenusDomainElementObject: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useReduxDeploymentsStateQuerySelector(
    deploymentEntityStateSelectorMap.runQuery,
    fetchDeploymentMenusQueryParams,
    props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
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
                <ThemedOnScreenDebug
                  label='miroirMenusDomainElementObject'
                  data={miroirMenusDomainElementObject}
                />
              </ThemedListItemButton>
            </ThemedListItem>
          </ThemedList>
        ) : (
          <>
            <ThemedOnScreenDebug
              label='SidebarSection'
              data={{
                props,
                miroirMenusDomainElementObject,
              }}
              useCodeBlock={true}
              initiallyUnfolded={false}
            />
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
                      // context.viewParams.generalEditMode
                      (
                        (curr.selfApplication === adminSelfApplication.uuid || curr.selfApplication === selfApplicationDeploymentMiroir)
                        && context.showModelTools
                      ) 
                      ||
                      (
                        (curr.selfApplication !== adminSelfApplication.uuid && curr.selfApplication !== selfApplicationDeploymentMiroir)
                        && (!curr.menuItemScope || curr.menuItemScope == "data" || context.viewParams.generalEditMode)
                      ) 
                  )
                  .map((i: MiroirMenuItem, index: number) => <MenuItemDisplay
                      key={i.label}
                      menuItem={i}
                      applicationDeploymentMap={props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap}
                      keyValue={i.label}
                      showPadding={true}
                    />
                  )}
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
                      (
                        (curr.selfApplication === adminSelfApplication.uuid || curr.selfApplication === selfApplicationDeploymentMiroir)
                        && context.showModelTools
                      ) 
                      ||
                      (
                        (curr.selfApplication !== adminSelfApplication.uuid && curr.selfApplication !== selfApplicationDeploymentMiroir)
                        && (!curr.menuItemScope || curr.menuItemScope == "data" || context.viewParams.generalEditMode)
                      ) 
                    )
                    .map((curr: any, index: number) => (
                      <MenuItemDisplay
                        key={curr.label + index}
                        menuItem={curr}
                        applicationDeploymentMap={props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap}
                        keyValue={curr.label + index}
                      />
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

