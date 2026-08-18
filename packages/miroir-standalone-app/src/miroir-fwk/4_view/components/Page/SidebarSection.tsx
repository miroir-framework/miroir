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
  getApplicationSection,
  getQueryRunnerParamsForReduxDeploymentsState,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  ReduxDeploymentsState,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunnerExtractorAndParams,
  Uuid,
  type ApplicationDeploymentMap,
  type Menu,
  type MiroirMenuItem,
} from "miroir-core";
import { getMemoizedReduxDeploymentsStateSelectorMap } from 'miroir-react';
import { ErrorBoundary } from 'react-error-boundary';
import { packageName } from '../../../../constants.js';
import { useMiroirContextService } from 'miroir-react';
import { useCurrentModel, useReduxDeploymentsStateQuerySelector } from '../../ReduxHooks.js';
import { ErrorFallbackComponent } from '../ErrorFallbackComponent.js';
import { JsonDisplayHelper } from 'miroir-react';
import { pageUrl, reportUrl } from '../../navigation.js';

import {
  entityMenu,
  menuApplicationModelScopeTemplate,
  selfApplicationMiroir,
} from "miroir-test-app_deployment-miroir";
import {
  isApplicationModelScopeInjectionActive,
  mergeApplicationModelScopeMenuItems,
  shouldShowAppMenuItem,
} from "./applicationModelScopeMenu.js";
const _miroirLoggerName = MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "Sidebar");
let log: LoggerInterface = MiroirLoggerFactory.getPreStartLogger(_miroirLoggerName);
MiroirLoggerFactory.registerLoggerToStart(_miroirLoggerName, "UI",
).then((logger: LoggerInterface) => {log = logger});

export const SidebarWidth = 200;

export interface ResponsiveAppBarProps {
  handleDrawerOpen: ()=>void,
  open: boolean,
  children:any,
}

const sideBarDefaultItems: MiroirMenuItem[] = [
  {
    miroirMenuItemType: "miroirMenuPageLink",
    label: "A Menu will be displayed here!",
    section: "model",
    targetRoot: "model",
    // selfApplication: "noApplicationSpecified",
    // reportUuid: "",
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
  switch (menuItem.miroirMenuItemType) {
    case "miroirMenuPageLink": {
      return (
        <ThemedListItem key={keyValue} disablePadding>
          <ThemedListItemButton
            sx={showPadding ? { padding: 0 } : undefined}
            component={Link}
            to={pageUrl(menuItem.targetRoot)}
          >
            <ThemedListMiroirIcon>
              <ThemedIcon icon={menuItem.icon} />
            </ThemedListMiroirIcon>
            <ThemedListItemText primary={menuItem.label} />
          </ThemedListItemButton>
        </ThemedListItem>
      )
    }
    case "miroirMenuReportLink": {
      return (
        <ThemedListItem key={keyValue} disablePadding>
          <ThemedListItemButton
            sx={showPadding ? { padding: 0 } : undefined}
            component={Link}
            to={reportUrl(
              menuItem.selfApplication,
              applicationDeploymentMap[menuItem.selfApplication] ?? "",
              menuItem.section,
              menuItem.reportUuid!,
              menuItem.instanceUuid ?? "xxxxxx"
            )}
            // to={`/report/${menuItem.selfApplication}/${
            //   applicationDeploymentMap[menuItem.selfApplication]
            // }/${menuItem.section}/${menuItem.reportUuid}/${menuItem.instanceUuid ?? "xxxxxx"}`}
          >
            <ThemedListMiroirIcon>
              <ThemedIcon icon={menuItem.icon} />
            </ThemedListMiroirIcon>
            <ThemedListItemText primary={menuItem.label} />
          </ThemedListItemButton>
        </ThemedListItem>
      )
    }
    case 'miroirMenuItemDivider': {
      return <ThemedDivider />;
    }
    default: {
      return "menu item type not supported: " + (menuItem as any).miroirMenuItemType
    }
  }

  // return menuItem.miroirMenuItemType == "miroirMenuReportLink" ? (
  //   <ThemedListItem key={keyValue} disablePadding>
  //     <ThemedListItemButton
  //       sx={showPadding ? { padding: 0 } : undefined}
  //       component={Link}
  //       to={`/report/${menuItem.selfApplication}/${
  //         applicationDeploymentMap[menuItem.selfApplication]
  //       }/${menuItem.section}/${menuItem.reportUuid}/${menuItem.instanceUuid ?? "xxxxxx"}`}
  //     >
  //       <ThemedListMiroirIcon>
  //         <ThemedIcon icon={menuItem.icon} />
  //       </ThemedListMiroirIcon>
  //       <ThemedListItemText primary={menuItem.label} />
  //     </ThemedListItemButton>
  //   </ThemedListItem>
  // ) : (
  //   <ThemedDivider />
  // );
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

  // const menuApplicationSection = getApplicationSection(props.applicationUuid, props.menuUuid);
  const menuApplicationSection = getApplicationSection(props.applicationUuid, entityMenu.uuid);
  const metaModelReady =
    (currentModel?.entities?.length ?? 0) > 0 || (currentModel?.menus?.length ?? 0) > 0;
  const fetchDeploymentMenusQueryParams: SyncQueryRunnerExtractorAndParams<ReduxDeploymentsState> =
    useMemo(
      () =>
        getQueryRunnerParamsForReduxDeploymentsState(
          metaModelReady
            ? {
                queryType: "boxedQueryWithExtractorCombinerTransformer",
                application: props.applicationUuid,
                extractors: {
                  menus: {
                    extractorOrCombinerType: "extractorByPrimaryKey",
                    parentName: "Menu",
                    applicationSection: menuApplicationSection,
                    parentUuid: entityMenu.uuid,
                    instanceUuid: props.menuUuid,
                  },
                },
              }
            : dummyDomainManyQueryWithDeploymentUuid,
          deploymentEntityStateSelectorMap,
        ),
      [deploymentEntityStateSelectorMap, metaModelReady, menuApplicationSection, props.applicationUuid, props.deploymentUuid, props.menuUuid],
    );

  // log.info("SidebarSection fetchDeploymentMenusQueryParams",fetchDeploymentMenusQueryParams)
  const miroirMenusDomainElementObject: Domain2QueryReturnType<
    Domain2QueryReturnType<Record<string, any>>
  > = useReduxDeploymentsStateQuerySelector(
    deploymentEntityStateSelectorMap.runQuery,
    fetchDeploymentMenusQueryParams,
    props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap,
  );

  const injectionActive = isApplicationModelScopeInjectionActive(
    context.viewParams.generalEditMode,
    props.applicationUuid,
  );

  const injectedItems = useMemo(
    () =>
      injectionActive
        ? mergeApplicationModelScopeMenuItems(
            menuApplicationModelScopeTemplate as Menu,
            props.applicationUuid,
          )
        : [],
    [injectionActive, props.applicationUuid],
  );

  const menuItemFilterCtx = useMemo(
    () => ({
      generalEditMode: context.viewParams.generalEditMode,
      showModelTools: context.showModelTools,
      sectionApplicationUuid: props.applicationUuid,
      injectionActive,
      adminSelfApplicationUuid: adminSelfApplication.uuid,
      miroirSelfApplicationUuid: selfApplicationMiroir.uuid,
    }),
    [
      context.viewParams.generalEditMode,
      context.showModelTools,
      props.applicationUuid,
      injectionActive,
    ],
  );

  const applicationDeploymentMap =
    props.applicationDeploymentMap ?? defaultSelfApplicationDeploymentMap;

  const isVisibleMenuItem = (curr: MiroirMenuItem) =>
    curr.miroirMenuItemType !== "miroirMenuPageLink" &&
    shouldShowAppMenuItem(curr, menuItemFilterCtx);

  const renderMenuItem = (item: MiroirMenuItem, keyValue: string, showPadding = false) => (
    <MenuItemDisplay
      key={keyValue}
      menuItem={item}
      applicationDeploymentMap={applicationDeploymentMap}
      keyValue={keyValue}
      showPadding={showPadding}
    />
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
                <JsonDisplayHelper debug={true}
                  componentName="SidebarSection"
                  elements={[
                    {
                      label: "miroirMenusDomainElementObject",
                      data: miroirMenusDomainElementObject,
                    },
                  ]}
                />
              </ThemedListItemButton>
            </ThemedListItem>
          </ThemedList>
        ) : (
          <>
            <JsonDisplayHelper debug={true}
              componentName="SidebarSection"
              elements={[
                {
                  label: "SidebarSection",
                  data: {
                    props,
                    menuApplicationSection,
                    currentModelLoaded: currentModel?.entities?.length > 0,
                    currentModel,
                    fetchDeploymentMenusQueryParams,
                    miroirMenusDomainElementObject,
                  },
                  useCodeBlock: true,
                },
              ]}
            />
            {!((miroirMenusDomainElementObject as any)?.menus as any)?.definition?.menuType ||
            ((miroirMenusDomainElementObject as any)?.menus as any)?.definition?.menuType ==
              "simpleMenu" ? (
              <ThemedList disablePadding dense>
                {injectedItems.map((item, index) =>
                  renderMenuItem(item, `injected-${item.label}-${index}`, true),
                )}
                {(
                  ((miroirMenusDomainElementObject as any)?.menus as any)?.definition?.definition ??
                  sideBarDefaultItems
                )
                  .filter(isVisibleMenuItem)
                  .map((i: MiroirMenuItem) => renderMenuItem(i, i.label, true))}
              </ThemedList>
            ) : (
              <ThemedList disablePadding dense>
                {injectedItems.map((item, index) =>
                  renderMenuItem(item, `injected-${item.label}-${index}`),
                )}
                {(
                  ((miroirMenusDomainElementObject as any)?.menus as any)?.definition?.definition ??
                  []
                ).flatMap((menuSection: any, index: number) =>
                  menuSection.items
                    .filter(isVisibleMenuItem)
                    .map((curr: MiroirMenuItem, itemIndex: number) =>
                      renderMenuItem(curr, curr.label + itemIndex),
                    )
                    .concat([<ThemedDivider key={menuSection.label + "Divider"} />]),
                )}
              </ThemedList>
            )}
          </>
        )}{" "}
      </ErrorBoundary>
    </>
  );
}

