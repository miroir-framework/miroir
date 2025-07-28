import {
  CellClickedEvent,
  CellValueChangedEvent,
  ColDef,
  ColGroupDef,
  GridApi
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';


import {
  DeploymentEntityState,
  Domain2QueryReturnType,
  DomainElementSuccess,
  EntityDefinition,
  EntityInstance,
  EntityInstancesUuidIndex,
  JzodObject,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  SyncBoxedExtractorOrQueryRunnerMap,
  SyncQueryRunner,
  ViewParams,
  adminConfigurationDeploymentMiroir,
  defaultAdminViewParams,
  defaultViewParamsFromAdminStorageFetchQueryParams
} from "miroir-core";

import { packageName } from '../../../constants.js';
import EntityEditor from '../EntityEditor.js';
import {
  useMiroirContextInnerFormOutput,
  useMiroirContextService,
  // useViewParams
} from '../MiroirContextReactProvider.js';
import { useCurrentModel, useDeploymentEntityStateQuerySelectorForCleanedResult } from '../ReduxHooks.js';
import { cleanLevel } from '../constants.js';
import { calculateAdaptiveColumnWidths, ToolsColumnDefinition } from '../adaptiveColumnWidths.js';
import { ToolsCellRenderer } from './GenderCellRenderer.js';
import { GlideDataGridComponent } from './GlideDataGridComponent.js';
import { JsonObjectDeleteFormDialog } from './JsonObjectDeleteFormDialog.js';
import {
  JsonObjectEditFormDialog,
  JsonObjectEditFormDialogInputs,
} from "./JsonObjectEditFormDialog.js";
import {
  TableComponentProps,
  TableComponentRow,
  TableComponentTypeSchema,
} from "./MTableComponentInterface.js";
import { getMemoizedDeploymentEntityStateSelectorMap } from 'miroir-localcache-redux';
import { useMiroirTableTheme } from '../contexts/MiroirThemeContext.js';
import { TableTheme, DeepPartial, createTableTheme } from '../themes/TableTheme.js';
import { generateAgGridStyles, generateGlideTheme, getFilterToolbarStyles } from '../themes/TableStyleGenerators.js';

// ################################################################################################
// Unified Table Styling Configuration
// 
// This section provides a comprehensive theming system that works uniformly across both 
// AG-Grid and Glide Data Grid implementations. The theme system includes:
//
// 1. TableTheme interface - Defines all styling properties
// 2. defaultTableTheme - Default theme matching current display
// 3. Theme variants - Pre-built themes (dark, compact, material)
// 4. Helper functions - Generate grid-specific styles
//
// Usage Examples:
// 
// // Use default theme
// <MTableComponent {...props} />
//
// // Use a predefined theme variant
// <MTableComponent {...props} theme={darkTableTheme} />
//
// // Custom theme with overrides
// <MTableComponent {...props} theme={{
//   colors: { primary: '#ff0000' },
//   typography: { fontSize: '16px' }
// }} />
//
// // Create a completely custom theme
// const customTheme = createTableTheme({
//   colors: { primary: '#purple' },
//   components: { 
//     header: { background: '#lightgray' }
//   }
// });
// <MTableComponent {...props} theme={customTheme} />
//
// The system automatically generates appropriate styles for both grid types,
// ensuring visual consistency regardless of which grid implementation is used.
// ################################################################################################

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "MtableComponent")
).then((logger: LoggerInterface) => {log = logger});



let count=0
let prevProps:TableComponentProps;
const autoSizeStrategy = {
  type: 'fitGridWidth',
  defaultMinWidth: 100,
  columnLimits: [
      {
          colId: 'country',
          minWidth: 900
      }
  ]
};
// ################################################################################################
export const MTableComponent = (props: TableComponentProps & { theme?: DeepPartial<TableTheme> }) => {
  log.info(":::::::::::::::::::::::::: MTableComponent refreshing with props",props);
  
  // Get theme from context first, then allow prop overrides
  const contextTheme = useMiroirTableTheme();
  
  // Use the unified table theme with optional overrides
  const tableTheme = useMemo(() => {
    // Start with context theme, then apply any prop overrides
    return props.theme ? createTableTheme({
      ...contextTheme,
      ...props.theme,
    }) : contextTheme;
  }, [contextTheme, props.theme]);
  
  const filterToolbarStyles = useMemo(() => getFilterToolbarStyles(tableTheme), [tableTheme]);
  const agGridStyles = useMemo(() => generateAgGridStyles(tableTheme), [tableTheme]);
  const glideTheme = useMemo(() => generateGlideTheme(tableTheme), [tableTheme]);
  
  const navigate = useNavigate();
  const context = useMiroirContextService();
  const contextDeploymentUuid = context.deploymentUuid;
  const gridApiRef = useRef<GridApi | null>(null);


    // const viewParams = useViewParams();
  const deploymentEntityStateSelectorMap: SyncBoxedExtractorOrQueryRunnerMap<DeploymentEntityState> =
  useMemo(() => getMemoizedDeploymentEntityStateSelectorMap(), []);
    
  const defaultViewParamsFromAdminStorageFetchQueryResults: Record<string, EntityInstancesUuidIndex> =
    useDeploymentEntityStateQuerySelectorForCleanedResult(
      deploymentEntityStateSelectorMap.runQuery as SyncQueryRunner<
        DeploymentEntityState,
        Domain2QueryReturnType<DomainElementSuccess>
      >,
      defaultViewParamsFromAdminStorageFetchQueryParams(deploymentEntityStateSelectorMap)
    );
  
  const viewParams: ViewParams | undefined = defaultViewParamsFromAdminStorageFetchQueryResults?.[
    "viewParams"
  ] as any;

  // log.info("MTableComponent viewParams", viewParams, "defaultViewParamsFromAdminStorageFetchQueryResults", defaultViewParamsFromAdminStorageFetchQueryResults);
  const gridType = viewParams?.gridType || 'ag-grid';

  // ##############################################################################################
  const onGridReady = useCallback((params: any) => {
    gridApiRef.current = params.api;
    
    // Add custom filter icon click handler after grid is ready
    setTimeout(() => {
      // Function to update visibility of global clear icon and attach event listeners
      const updateFilterUI = () => {
        const filterModel = gridApiRef.current?.getFilterModel();
        const hasAnyFilterActive = filterModel && Object.keys(filterModel).length > 0;
        
        // Update state to trigger re-render of global clear icon
        setHasAnyFilter(!!hasAnyFilterActive);
        
        // Attach listeners to individual filter icons
        const filterIcons = document.querySelectorAll('#tata .ag-header-cell-filtered .ag-filter-icon, #tata .ag-header-cell-filtered .ag-icon-filter');
        filterIcons.forEach((icon) => {
          // Remove existing listeners to avoid duplicates
          const newIcon = icon.cloneNode(true);
          icon.parentNode?.replaceChild(newIcon, icon);
          
          // Add new click handler for individual column filter clear
          const clickHandler = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const headerCell = (e.target as HTMLElement).closest('.ag-header-cell');
            if (headerCell && gridApiRef.current) {
              const colId = headerCell.getAttribute('col-id');
              if (colId) {
                const currentFilterModel = gridApiRef.current.getFilterModel();
                if (currentFilterModel && currentFilterModel[colId]) {
                  delete currentFilterModel[colId];
                  gridApiRef.current.setFilterModel(currentFilterModel);
                  log.info(`Filter cleared for column: ${colId}`);
                }
              }
            }
            return false;
          };
          newIcon.addEventListener('click', clickHandler, true);
        });
        
        // Attach listener to global clear icon
        const globalIconForListener = document.querySelector('#tata .global-clear-filters');
        if (globalIconForListener) {
          // Remove existing listeners
          const newGlobalIcon = globalIconForListener.cloneNode(true);
          globalIconForListener.parentNode?.replaceChild(newGlobalIcon, globalIconForListener);
          
          newGlobalIcon.addEventListener('click', (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            if (gridApiRef.current) {
              gridApiRef.current.setFilterModel(null);
              log.info('All filters cleared via global icon click');
            }
            return false;
          }, true);
        }
      };
      
      // Initial update
      updateFilterUI();
      
      // Listen for filter changes to update UI
      if (gridApiRef.current) {
        gridApiRef.current.addEventListener('filterChanged', () => {
          setTimeout(updateFilterUI, 50);
        });
      }
    }, 100);
  }, []);

  // ##############################################################################################
  const handleFilterIconClick = useCallback((event: MouseEvent) => {
    // Check if the clicked element is a filter icon or its parent/child elements
    const target = event.target as HTMLElement;
    
    // Only handle clicks on filter icons in filtered columns
    const isFilterIcon = target.classList.contains('ag-filter-icon') || 
                         target.closest('.ag-filter-icon') || 
                         target.querySelector('.ag-filter-icon') ||
                         target.classList.contains('ag-icon-filter') ||
                         target.closest('.ag-icon-filter');
    
    // Check if the column is currently filtered
    const headerCell = target.closest('.ag-header-cell');
    const isFiltered = headerCell?.classList.contains('ag-header-cell-filtered');
    
    // Check if this is the global clear all filters icon
    const isGlobalClearIcon = target.classList.contains('mtable-global-clear-filters') || 
                          target.closest('.mtable-global-clear-filters');
                          
    if (isGlobalClearIcon) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      // Clear all filters
      if (gridApiRef.current) {
        gridApiRef.current.setFilterModel(null);
        log.info('All filters cleared');
      }
      return false;
    } else if (isFilterIcon && isFiltered && headerCell) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      
      // Clear filter for this specific column only
      if (gridApiRef.current) {
        const colId = headerCell.getAttribute('col-id');
        if (colId) {
          const currentFilterModel = gridApiRef.current.getFilterModel();
          if (currentFilterModel && currentFilterModel[colId]) {
            delete currentFilterModel[colId];
            gridApiRef.current.setFilterModel(currentFilterModel);
            log.info(`Filter cleared for column: ${colId}`);
          }
        }
      }
      return false;
    }
  }, []);

  // ##############################################################################################
  const handleGlobalClearAllFilters = useCallback(() => {
    if (gridApiRef.current) {
      gridApiRef.current.setFilterModel(null);
      log.info('All filters cleared');
    }
  }, []);

  // ##############################################################################################
  // Attach event listener for filter icon clicks
  useEffect(() => {
    const gridContainer = document.getElementById('tata');
    if (gridContainer) {
      // Use capture phase to intercept before other handlers
      gridContainer.addEventListener('click', handleFilterIconClick, true);
      gridContainer.addEventListener('mousedown', handleFilterIconClick, true);
      return () => {
        gridContainer.removeEventListener('click', handleFilterIconClick, true);
        gridContainer.removeEventListener('mousedown', handleFilterIconClick, true);
      };
    }
  }, [handleFilterIconClick]);



  // TODO: redundant?
  const [dialogOuterFormObject, setdialogOuterFormObject] = useMiroirContextInnerFormOutput();
  const [dialogFormObject, setdialogFormObject] = useState<undefined | any>(undefined);
  const [hasAnyFilter, setHasAnyFilter] = useState(false);

  // TODO: redundant?
  const [addObjectdialogFormIsOpen, setAddObjectdialogFormIsOpen] = useState(false);
  const [editDialogFormIsOpen, setEditDialogFormIsOpen] = useState(false);

  const [deleteDialogFormIsOpen, setDeleteDialogFormIsOpen] = useState(false);
  
  // log.info("MTableComponent refreshing with dialogFormObject",dialogFormObject);


  const miroirMetaModel: MetaModel = useCurrentModel(adminConfigurationDeploymentMiroir.uuid);
  const currentModel: MetaModel = useCurrentModel(contextDeploymentUuid);
  // log.info("MTableComponent currentModel", currentModel);

  const tableComponentRows: { tableComponentRowUuidIndexSchema: TableComponentRow[] } = useMemo(
    // always use object, not array, to ensure correct refresh!
    () => ({
      tableComponentRowUuidIndexSchema: Object.values(props.instancesToDisplay ?? {})
        .sort((a: EntityInstance, b: EntityInstance) => // initial sort, to be enhanced! (issue #22)
          props.sortByAttribute
            ? (a as any)[props.sortByAttribute] > (b as any)[props.sortByAttribute]
              ? 1
              : (a as any)[props.sortByAttribute] < (b as any)[props.sortByAttribute]
              ? -1
              : 0
            : 0
        )
        .map((i: EntityInstance) => ({
          deploymentUuid: contextDeploymentUuid,
          rawValue: i,
          foreignKeyObjects: props.foreignKeyObjects,
          jzodSchema:
            props.type == TableComponentTypeSchema.enum.EntityInstance
              ? props.currentEntityDefinition.jzodSchema.definition
              : {},
          displayedValue: Object.fromEntries(
            Object.entries(i).map((e) => {
              const currentAttributeDefinition =
                props.type == TableComponentTypeSchema.enum.EntityInstance
                  ? Object.entries(props.currentEntityDefinition?.jzodSchema.definition ?? {}).find((a) => a[0] == e[0])
                  : undefined;
              return [
                e[0],
                Array.isArray(currentAttributeDefinition) &&
                currentAttributeDefinition.length > 1 &&
                (currentAttributeDefinition[1] as any).type == "object"
                  ? JSON.stringify(e[1])
                  : e[1],
              ];
            })
          ),
        })),
    }),
    [props.instancesToDisplay,props.sortByAttribute]
  );
  // log.info("MTableComponent tableComponentRows", tableComponentRows);

  // ##############################################################################################
  const onCellValueChanged = useCallback(async (event:CellValueChangedEvent) => {
    // event?.stopPropagation();
    log.warn("onCellValueChanged",event, 'contextDeploymentUuid',contextDeploymentUuid)
    // if (props.reportSection.definition.parentUuid == entityEntity.uuid) {
    //   const entity = e.data as MetaEntity;
    //   // sending ModelUpdates
    //   await domainController.handleDomainTransactionalInstanceAction(
    //     contextDeploymentUuid,
    //     {
    //       actionType: "DomainTransactionalInstanceAction",
    //       actionName: "modelActionUpdateEntity",
    //       update: {
    //         actionName:"WrappedTransactionalModelActionEntityUpdate",
    //         modelEntityUpdate:{
    //           actionType:"ModelActionEntityUpdate",
    //           actionName: "renameEntity",
    //           entityName: e.oldValue,
    //           entityUuid: entity.uuid,
    //           targetValue: e.newValue,
    //         },
    //       }
    //     },
    //     currentModel
    //   );
        
    // } else {
    //   log.info("onCellValueChanged on instance of entity",props.reportSection.definition.parentName, props.reportSection.definition.parentUuid,'updating object',e.data)
    //   // sending DataUpdates
    //   await domainController.handleAction(
    //     contextDeploymentUuid,
    //     {
    //       actionType: "DomainNonTransactionalInstanceAction",
    //       actionName: "update",
    //       objects: [
    //         {
    //           parentUuid: props.reportSection.definition.parentUuid,
    //           applicationSection:'data',
    //           instances:[
    //             // Object.assign({},e.data,{[e.column.getColId()]:e.data.value})
    //             e.data
    //           ]
    //         }
    //       ]
    //     },
    //     currentModel
    //   );
    // }
  },[props,currentModel,])

  // ##############################################################################################
  // TODO: looks like prop drilling... pass onRowEdit directly?
  const onEditDialogFormSubmit: (data:JsonObjectEditFormDialogInputs)=>void = useCallback(async (data) => {
    log.info('onEditDialogFormSubmit called with data',data);
    
    if (props.type == 'EntityInstance' && props?.onRowEdit) {
      await props.onRowEdit(data);
    } else {
      log.error('onEditDialogFormSubmit called for not EntityInstance');
    }
    handleEditDialogFormClose('');
  },[props])

  // ##############################################################################################
  const onDeleteDialogFormSubmit: (data:JsonObjectEditFormDialogInputs)=>void = useCallback(async (data) => {
    log.info('onEditDialogFormSubmit called with data',data);
    
    if (props.type == 'EntityInstance' && props?.onRowDelete) {
      await props.onRowDelete(data);
    } else {
      log.error('onEditDialogFormSubmit called for not EntityInstance');
    }
    handleEditDialogFormClose('');
  },[props])

  // ##############################################################################################
  const handleEditDialogFormOpen = useCallback((a?:TableComponentRow,event?:any) => {
    // event?.stopPropagation();
    log.info('handleEditDialogFormOpen called with props',props);
    log.info('handleEditDialogFormOpen called dialogFormObject',dialogFormObject, "event value", a);
    
    if (a) {
      setdialogFormObject(a.rawValue);
      setdialogOuterFormObject(a.rawValue)
      log.info('handleEditDialogFormOpen parameter is defined dialogFormObject',dialogFormObject);
    } else {
      setdialogFormObject(undefined);
      log.info('handleEditDialogFormOpen parameter is undefined, no value is passed to form. dialogFormObject',dialogFormObject);
    }
    setEditDialogFormIsOpen(true);
  },[props.instancesToDisplay]);

  // ##############################################################################################
  const handleEditDialogFormClose = useCallback((value?: string, event?:any) => {
    // event?.stopPropagation();
    log.info('handleEditDialogFormClose',value);
    
    setEditDialogFormIsOpen(false);
  },[]);

  // ##############################################################################################
  const handleDeleteDialogFormOpen = useCallback((a?:TableComponentRow,event?:any) => {
    // event?.stopPropagation();
    log.info('handleDeleteDialogFormOpen called with props',props);
    log.info('handleDeleteDialogFormOpen called dialogFormObject',dialogFormObject, "event value", a);
    
    if (a) {
      setdialogFormObject(a.rawValue);
      setdialogOuterFormObject(a.rawValue)
      log.info('handleDeleteDialogFormOpen parameter is defined dialogFormObject',dialogFormObject);
    } else {
      // setdialogFormObject(Object.assign({},dialogFormObject?dialogFormObject:{},{[label]:undefined}));
      setdialogFormObject(undefined);
      log.info('handleDeleteDialogFormOpen parameter is undefined, no value is passed to form. dialogFormObject',dialogFormObject);
    }
    setDeleteDialogFormIsOpen(true);
  },[props.instancesToDisplay]);

  // ##############################################################################################
  const handleDuplicateDialogFormOpen = useCallback((a?:TableComponentRow,event?:any) => {
    // event?.stopPropagation();
    log.info('handleDuplicateDialogFormOpen called with props',props);
    log.info('handleDuplicateDialogFormOpen called dialogFormObject',dialogFormObject, "event value", a);
    
    if (a) {
      // Create a duplicate with a new random UUID
      const duplicatedObject = {
        ...a.rawValue,
        uuid: crypto.randomUUID()
      };
      setdialogFormObject(duplicatedObject);
      setdialogOuterFormObject(duplicatedObject);
      log.info('handleDuplicateDialogFormOpen parameter is defined, created duplicate with new UUID',duplicatedObject);
    } else {
      setdialogFormObject(undefined);
      log.info('handleDuplicateDialogFormOpen parameter is undefined, no value is passed to form. dialogFormObject',dialogFormObject);
    }
    setEditDialogFormIsOpen(true);
  },[props.instancesToDisplay]);
  
  // Container width tracking for adaptive column sizing
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1200);

  // Monitor container width changes for dynamic table width calculation
  useEffect(() => {
    let updateTimer: NodeJS.Timeout;
    
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        // Ensure we have a meaningful width before setting it
        // Add hysteresis to prevent constant re-calculations on small changes
        if (width > 0 && Math.abs(width - containerWidth) > 10) {
          setContainerWidth(width);
          log.debug("MTableComponent container width updated:", width);
        }
      }
    };

    // Debounced update function to prevent excessive calculations
    const debouncedUpdateWidth = () => {
      clearTimeout(updateTimer);
      updateTimer = setTimeout(updateWidth, 150);
    };

    // Initial measurement with a slight delay to ensure layout is complete
    const initialTimer = setTimeout(updateWidth, 100);

    // Set up ResizeObserver for more reliable width tracking
    let resizeObserver: ResizeObserver | undefined;
    
    if (containerRef.current && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const width = entry.contentRect.width;
          // Add hysteresis and debouncing to prevent feedback loops
          if (width > 0 && Math.abs(width - containerWidth) > 10) {
            debouncedUpdateWidth();
          }
        }
      });
      
      resizeObserver.observe(containerRef.current);
    }

    // Fallback to window resize listener with debouncing
    window.addEventListener('resize', debouncedUpdateWidth);
    
    return () => {
      clearTimeout(initialTimer);
      clearTimeout(updateTimer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', debouncedUpdateWidth);
    };
  }, [containerWidth]);
  
  // ##############################################################################################
  const defaultColDef:ColDef | ColGroupDef = useMemo(()=>({
    editable: true,
    sortable: true,
    filter: true,
    resizable: true,
    cellEditor: EntityEditor,
    // Disable floating filter to save space - filters are still accessible via column menu
    floatingFilter: false,
    // Set minimum width for better column sizing
    minWidth: 100,
    // Enable flexible filter options
    filterParams: {
      filterOptions: ['contains', 'startsWith', 'endsWith', 'equals', 'notEqual'],
      defaultOption: 'contains',
      suppressAndOrCondition: false,
      trimInput: true,
      debounceMs: 300,
    },
    // Customize header to handle filter icon clicks
    headerComponentParams: {
      onFilterClick: () => {
        if (gridApiRef.current) {
          gridApiRef.current.setFilterModel(null);
          log.info('Filters cleared via header component');
        }
      }
    }
  }),[]);

  // Define tools column configuration once to ensure consistency across grid types
  const toolsColumnDefinition: ToolsColumnDefinition = useMemo(() => ({
    field: "",
    headerName: "Actions", 
    width: 120
  }), []);

  // Calculate adaptive column widths once and reuse for both AgGrid and GlideDataGrid
  const calculatedColumnWidths = useMemo(() => {
    // Always calculate widths, even with empty data to ensure components receive proper specs
    // Use a stable width calculation that doesn't create feedback loops
    const rowCount = tableComponentRows.tableComponentRowUuidIndexSchema.length;
    const needsVerticalScrollbar = rowCount > 15; // Estimate based on typical visible rows
    const scrollbarWidth = needsVerticalScrollbar ? 17 : 0;
    const borderWidth = 2; // Container border
    
    // Use the container width directly, but cap it at a reasonable maximum
    // This prevents the calculation from being too dependent on container size changes
    const stableWidth = Math.min(Math.max(containerWidth - scrollbarWidth - borderWidth, 300), 1800);
    
    const jzodSchema =
      props.type === TableComponentTypeSchema.enum.EntityInstance &&
      (props as any).currentEntityDefinition?.jzodSchema?.definition
        ? (props as any).currentEntityDefinition.jzodSchema.definition
        : undefined;

    const widthSpecs = calculateAdaptiveColumnWidths(
      props.columnDefs.columnDefs, // Pass the original column defs without tools column
      tableComponentRows.tableComponentRowUuidIndexSchema,
      stableWidth,
      toolsColumnDefinition, // Pass the tools column definition
      jzodSchema,
    );
    
    // Log the calculated widths for debugging
    log.info("MTableComponent calculated column widths", {
      containerWidth,
      stableWidth,
      rowCount,
      totalCalculatedWidth: widthSpecs.reduce((sum, spec) => sum + spec.calculatedWidth, 0),
      columnWidths: widthSpecs.map(spec => ({
        field: spec.field || 'tools',
        type: spec.type,
        minWidth: spec.minWidth,
        maxWidth: spec.maxWidth,
        calculatedWidth: spec.calculatedWidth
      }))
    });
    
    return widthSpecs;
  }, [props.columnDefs, tableComponentRows, props.type, (props as any).currentEntityDefinition, toolsColumnDefinition, containerWidth]);


  const columnDefs: (ColDef | ColGroupDef)[] = useMemo(() => {
    // Start with the base column definitions using the shared tools column definition
    const baseColumnDefs = [
      {
        field: toolsColumnDefinition.field,
        headerName: toolsColumnDefinition.headerName,
        cellRenderer: ToolsCellRenderer,
        editable: false,
        sortable: false,
        filter: false,
        resizable: false,
        width: toolsColumnDefinition.width,
        cellRendererParams: {
          onClickEdit: handleEditDialogFormOpen,
          onClickDuplicate: handleDuplicateDialogFormOpen,
          onClickDelete: handleDeleteDialogFormOpen,
        },
      },
    ].concat(
      // Transform the column definitions to work with the nested data structure
      props.columnDefs.columnDefs.map((colDef: any) => ({
        ...colDef,
        // Add value getter to access the correct data path
        valueGetter: (params: any) => {
          if (!params.data || !colDef.field) return "";

          // Check if this is a foreign key column
          const isFK = colDef.cellRendererParams?.isFK;
          const entityUuid = colDef.cellRendererParams?.entityUuid;

          if (isFK && entityUuid && params.data?.foreignKeyObjects?.[entityUuid]) {
            // For foreign key columns, return the name of the referenced entity
            const foreignKeyUuid = params.data.rawValue?.[colDef.field];
            if (foreignKeyUuid && params.data.foreignKeyObjects[entityUuid][foreignKeyUuid]) {
              return params.data.foreignKeyObjects[entityUuid][foreignKeyUuid].name || "";
            }
            return ""; // No foreign key object found
          }

          // For regular columns, use displayedValue or rawValue
          return (
            params.data.displayedValue?.[colDef.field] ?? params.data.rawValue?.[colDef.field] ?? ""
          );
        },
        // Add value setter for editable cells
        valueSetter: (params: any) => {
          if (!params.data || !colDef.field) return false;
          // Update both displayedValue and rawValue
          if (params.data.displayedValue) {
            params.data.displayedValue[colDef.field] = params.newValue;
          }
          if (params.data.rawValue) {
            params.data.rawValue[colDef.field] = params.newValue;
          }
          return true;
        },
        // Override filter value getter to ensure filtering works on the correct data
        filterValueGetter: (params: any) => {
          if (!params.data || !colDef.field) return "";

          // Check if this is a foreign key column
          const isFK = colDef.cellRendererParams?.isFK;
          const entityUuid = colDef.cellRendererParams?.entityUuid;

          if (isFK && entityUuid && params.data?.foreignKeyObjects?.[entityUuid]) {
            // For foreign key columns, return the name of the referenced entity
            const foreignKeyUuid = params.data.rawValue?.[colDef.field];
            if (foreignKeyUuid && params.data.foreignKeyObjects[entityUuid][foreignKeyUuid]) {
              return params.data.foreignKeyObjects[entityUuid][foreignKeyUuid].name || "";
            }
            return ""; // No foreign key object found
          }

          // For regular columns, use displayedValue or rawValue
          return (
            params.data.displayedValue?.[colDef.field] ?? params.data.rawValue?.[colDef.field] ?? ""
          );
        },
        // Enable specific filter types based on data type
        filter: true,
        filterParams: {
          filterOptions: ["contains", "startsWith", "endsWith", "equals", "notEqual"],
          defaultOption: "contains",
          suppressAndOrCondition: false,
        },
      }))
    );

    // Apply adaptive widths if we have calculated them
    if (calculatedColumnWidths) {
      log.info("MTableComponent applying calculated widths to AgGrid columns");
      
      // Apply calculated widths to the base column definitions
      baseColumnDefs.forEach((colDef: any, index) => {
        if (index === 0) {
          // Tools column - use the calculated tools width
          const toolsSpec = calculatedColumnWidths.find((spec) => spec.type === "tools");
          if (toolsSpec) {
            colDef.width = Math.round(toolsSpec.calculatedWidth);
            colDef.minWidth = Math.round(toolsSpec.minWidth);
            colDef.maxWidth = Math.round(toolsSpec.maxWidth);
            // Prevent AgGrid from auto-sizing this column
            colDef.suppressSizeToFit = true;
            colDef.suppressAutoSize = true;
          }
        } else {
          // Data columns - find matching width spec
          const widthSpec = calculatedColumnWidths.find((spec) => spec.field === colDef.field);
          if (widthSpec) {
            colDef.width = Math.round(widthSpec.calculatedWidth);
            colDef.minWidth = Math.round(widthSpec.minWidth);
            colDef.maxWidth = Math.round(widthSpec.maxWidth);
            // Prevent AgGrid from auto-sizing these columns too
            colDef.suppressSizeToFit = true;
            colDef.suppressAutoSize = true;
            
            log.debug(`Applied width to column ${colDef.field}:`, {
              calculated: widthSpec.calculatedWidth,
              min: widthSpec.minWidth,
              max: widthSpec.maxWidth,
              type: widthSpec.type
            });
          }
        }
      });
    }

    return baseColumnDefs;
  }, [
    props.columnDefs,
    handleEditDialogFormOpen,
    handleDuplicateDialogFormOpen,
    handleDeleteDialogFormOpen,
    calculatedColumnWidths,
    toolsColumnDefinition,
  ]);
  
  // log.info(
  //   "MTableComponent started count",
  //   count++,
  //   "with props",
  //   props,
  //   props === prevProps,
  //   "columnDefs",
  //   columnDefs,
  //   "rowData changed:",
  //   props?.instancesToDisplay === prevProps?.instancesToDisplay
  // );
  prevProps = props;

  // ##############################################################################################
  // ##############################################################################################
  const onGlideGridCellClicked = useCallback(
    (cell: any, event: any) => {
      const [col, row] = cell;
      const rowData = tableComponentRows.tableComponentRowUuidIndexSchema[row];
      
      // Get the field name from the Glide grid column structure
      // Note: In GlideDataGridComponent, columns[0] is tools, columns[1+] are data columns
      let fieldName: string | undefined;
      if (col === 0) {
        fieldName = "tools";
      } else {
        // Find the data column by index (col - 1 because tools is at index 0)
        const dataColumnIndex = col - 1;
        const dataColumns = props.columnDefs.columnDefs.filter((cd: any) => cd.field && cd.field !== 'tools');
        if (dataColumnIndex >= 0 && dataColumnIndex < dataColumns.length) {
          fieldName = dataColumns[dataColumnIndex].field;
        }
      }
      
      // Early return for non-navigable clicks
      if (
        props.type !== "EntityInstance" ||
        !fieldName ||
        fieldName === "tools"
      ) {
        return;
      }

      log.warn("onGlideGridCellClicked fieldName", fieldName, "cell", cell, "event", event, "props", props);

      // Use setTimeout to defer navigation and prevent blocking the UI thread
      setTimeout(() => {
        if (["name", "uuid"].includes(fieldName)) {
          // display current Entity Details for Entity Instance
          const applicationSection = ["MetaModel", "model"].includes(
            props.currentEntityDefinition.conceptLevel as any
          )
            ? "model"
            : context.applicationSection;

          navigate(
            `/report/${contextDeploymentUuid}/${applicationSection}/${props.currentEntityDefinition?.defaultInstanceDetailsReportUuid}/${rowData.rawValue.uuid}`
          );
        } else {
          // Cache schema definition lookup
          const schemaDefinition = props.currentEntityDefinition?.jzodSchema.definition ?? {};
          const columnDefinitionAttribute = schemaDefinition[fieldName];

          if (
            columnDefinitionAttribute &&
            (columnDefinitionAttribute as any).type === "uuid" &&
            (columnDefinitionAttribute as any).tag?.value?.targetEntity
          ) {
            // Find the column definition to get the target entity UUID
            const columnDef = props.columnDefs.columnDefs.find((cd: any) => cd.field === fieldName);
            const targetEntityUuid = columnDef?.cellRendererParams?.entityUuid;
            
            const targetEntityDefinition: EntityDefinition | undefined =
              currentModel.entityDefinitions.find(
                (e) => e.entityUuid === targetEntityUuid
              );

            const targetApplicationSection =
              (columnDefinitionAttribute as any)?.tag?.value?.targetEntityApplicationSection ||
              context.applicationSection;

            navigate(
              `/report/${contextDeploymentUuid}/${targetApplicationSection}/${targetEntityDefinition?.defaultInstanceDetailsReportUuid}/${(rowData.rawValue as any)[fieldName]}`
            );
          } else {
            log.info(
              "onGlideGridCellClicked cell is not an Entity Instance uuid, no navigation occurs.",
              columnDefinitionAttribute
            );
          }
        }
      }, 0);
    },
    [
      props.type,
      (props as any).currentEntityDefinition,
      contextDeploymentUuid,
      context.applicationSection,
      currentModel.entityDefinitions,
      navigate,
      columnDefs,
      tableComponentRows,
      props.columnDefs,
    ]
  );

  const onCellClicked = useCallback(
    (event: CellClickedEvent) => {
      // Early return for non-navigable clicks
      if (
        props.type !== "EntityInstance" ||
        !event.colDef.field ||
        event.colDef.field === "tools"
      ) {
        return;
      }

      const fieldName = event.colDef.field;
      log.warn("onCellClicked event.colDef.field", fieldName, "event", event, "props", props);

      // Use setTimeout to defer navigation and prevent blocking the UI thread
      setTimeout(() => {
        if (["name", "uuid"].includes(fieldName)) {
          // display current Entity Details for Entity Instance
          const applicationSection = ["MetaModel", "model"].includes(
            props.currentEntityDefinition.conceptLevel as any
          )
            ? "model"
            : context.applicationSection;

          navigate(
            `/report/${contextDeploymentUuid}/${applicationSection}/${props.currentEntityDefinition?.defaultInstanceDetailsReportUuid}/${event.data.rawValue.uuid}`
          );
        } else {
          // Cache schema definition lookup
          const schemaDefinition = props.currentEntityDefinition?.jzodSchema.definition ?? {};
          const columnDefinitionAttribute = schemaDefinition[fieldName];

          if (
            columnDefinitionAttribute &&
            (columnDefinitionAttribute as any).type === "uuid" &&
            (columnDefinitionAttribute as any).tag?.value?.targetEntity
          ) {
            const targetEntityDefinition: EntityDefinition | undefined =
              currentModel.entityDefinitions.find(
                (e) => e.entityUuid === event.colDef.cellRendererParams.entityUuid
              );

            const targetApplicationSection =
              (columnDefinitionAttribute as any)?.tag?.value?.targetEntityApplicationSection ||
              context.applicationSection;

            navigate(
              `/report/${contextDeploymentUuid}/${targetApplicationSection}/${targetEntityDefinition?.defaultInstanceDetailsReportUuid}/${event.data.rawValue[fieldName]}`
            );
          } else {
            log.info(
              "onCellClicked cell is not an Entity Instance uuid, no navigation occurs.",
              columnDefinitionAttribute
            );
          }
        }
      }, 0);
    },
    [
      props.type,
      (props as any).currentEntityDefinition,
      contextDeploymentUuid,
      context.applicationSection,
      currentModel.entityDefinitions,
      navigate,
    ]
  );
  
  
  // const domLayout = tableComponentRows.tableComponentRowUuidIndexSchema.length > 10?"normal":"autoHeight";
  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100%', 
        maxWidth: '100%', 
        overflow: 'hidden', 
        boxSizing: 'border-box',
        fontFamily: tableTheme.typography.fontFamily,
        position: 'relative',
        zIndex: 1, // Ensure proper layering for width measurement
      }}
    >
      {/* Apply unified table styles */}
      <style>{agGridStyles}</style>
      {/* <span>MtableComponent count {count}</span>
      <br /> */}
      {/* <span>{props.type}</span>
      <br /> */}
      {/* <span>rowData: {JSON.stringify(props.rowData.instancesWithStringifiedJsonAttributes)}</span> */}
      {props.type == "EntityInstance" ? (
        <div>
          {dialogFormObject ? (
            <>
              <JsonObjectEditFormDialog
                showButton={false}
                isOpen={editDialogFormIsOpen} // redundant with addObjectdialogFormIsOpen?
                isAttributes={true}
                addObjectdialogFormIsOpen={addObjectdialogFormIsOpen}
                setAddObjectdialogFormIsOpen={setAddObjectdialogFormIsOpen}
                label={props.currentEntity?.name ?? "No Entity Found!"}
                entityDefinitionJzodSchema={props.currentEntityDefinition?.jzodSchema as JzodObject}
                foreignKeyObjects={props.foreignKeyObjects}
                currentDeploymentUuid={contextDeploymentUuid}
                currentApplicationSection={context.applicationSection}
                currentAppModel={currentModel}
                currentMiroirModel={miroirMetaModel}
                defaultFormValuesObject={dialogFormObject ?? props.defaultFormValuesObject}
                onSubmit={onEditDialogFormSubmit}
                onClose={handleEditDialogFormClose}
              />
              <JsonObjectDeleteFormDialog
                showButton={false}
                currentDeploymentUuid={contextDeploymentUuid}
                currentApplicationSection={context.applicationSection}
                currentAppModel={currentModel}
                currentMiroirModel={miroirMetaModel}
                defaultFormValuesObject={dialogFormObject ?? props.defaultFormValuesObject}
                deleteObjectdialogFormIsOpen={deleteDialogFormIsOpen}
                entityDefinitionJzodSchema={props.currentEntityDefinition?.jzodSchema as JzodObject}
                foreignKeyObjects={props.foreignKeyObjects}
                isOpen={deleteDialogFormIsOpen} // redundant with deleteObjectdialogFormIsOpen?
                isAttributes={true}
                label={props.currentEntity?.name ?? "No Entity Found!"}
                onDeleteFormObject={onDeleteDialogFormSubmit}
                onClose={handleEditDialogFormClose}
                setDeleteObjectdialogFormIsOpen={setDeleteDialogFormIsOpen}
              />
            </>
          ) : (
            <></>
          )}
          {gridType === "ag-grid" ? (
            <>
              {/* Global Clear All Filters Icon */}
              {hasAnyFilter && (
                <div style={filterToolbarStyles.container}>
                  <span
                    className="mtable-global-clear-filters"
                    onClick={handleGlobalClearAllFilters}
                    style={filterToolbarStyles.clearAllButton}
                    title="Clear all filters"
                  >
                    ▼ Clear All Filters
                  </span>
                </div>
              )}
              <div
                id="tata"
                className="ag-theme-alpine"
                style={{
                  ...(tableComponentRows.tableComponentRowUuidIndexSchema.length > 50
                    ? { 
                        ...props.styles, 
                        height: "50vh", 
                        maxHeight: tableTheme.components.table.maxHeight 
                      }
                    : {
                        ...props.styles,
                        minHeight: tableTheme.components.table.minHeight
                      }),
                  width: '100%',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  boxSizing: 'border-box',
                  borderRadius: tableTheme.components.table.borderRadius,
                  border: tableTheme.components.table.border,
                }}
              >
                <AgGridReact
                  domLayout={
                    tableComponentRows.tableComponentRowUuidIndexSchema.length > 50
                      ? "normal"
                      : "autoHeight"
                  }
                  columnDefs={columnDefs}
                  rowData={tableComponentRows.tableComponentRowUuidIndexSchema}
                  getRowId={(params) => {
                    // Use the entity instance UUID for row identification
                    return params.data?.rawValue?.uuid
                      ? params.data?.rawValue?.uuid
                      : params.data?.rawValue?.id || Math.random().toString();
                  }}
                  defaultColDef={defaultColDef}
                  onCellClicked={onCellClicked}
                  onCellValueChanged={onCellValueChanged}
                  onGridReady={onGridReady}
                  // Enable advanced filtering and sorting features
                  enableRangeSelection={true}
                  enableCellTextSelection={true}
                  suppressRowClickSelection={true}
                  animateRows={true}
                  skipHeaderOnAutoSize={true}
                  suppressHorizontalScroll={false}
                ></AgGridReact>
              </div>
            </>
          ) : (
            <GlideDataGridComponent
              tableComponentRows={tableComponentRows}
              columnDefs={props.columnDefs}
              styles={{
                ...props.styles,
                fontFamily: tableTheme.typography.fontFamily,
                fontSize: tableTheme.typography.fontSize,
                borderRadius: tableTheme.components.table.borderRadius,
                border: tableTheme.components.table.border,
              }}
              type={props.type}
              currentEntityDefinition={props.type === 'EntityInstance' ? (props as any).currentEntityDefinition : undefined}
              calculatedColumnWidths={calculatedColumnWidths}
              containerWidth={containerWidth}
              toolsColumnDefinition={toolsColumnDefinition}
              maxRows={props.maxRows}
              theme={tableTheme}
              glideTheme={glideTheme}
              onCellClicked={onGlideGridCellClicked}
              onCellEdited={(cell, newValue) => {
                // Handle cell edit for Glide Data Grid
                log.info("Glide cell edited", cell, newValue);
                // You might want to implement similar logic to onCellValueChanged
              }}
              onRowEdit={handleEditDialogFormOpen}
              onRowDelete={handleDeleteDialogFormOpen}
              onRowDuplicate={handleDuplicateDialogFormOpen}
            />
          )}
        </div>
      ) : (
        // <div className="ag-theme-alpine" style={{height: 200, width: 200}}>
        <div className="ag-theme-alpine" style={{
          borderRadius: tableTheme.components.table.borderRadius,
          border: tableTheme.components.table.border,
        }}>
          {/* Global Clear All Filters Icon */}
          {hasAnyFilter && (
            <div style={filterToolbarStyles.container}>
              <span
                className="mtable-global-clear-filters"
                onClick={handleGlobalClearAllFilters}
                style={filterToolbarStyles.clearAllButton}
                title="Clear all filters"
              >
                ▼ Clear All Filters
              </span>
            </div>
          )}
          <div>Not EntityInstance</div>
          <AgGridReact
            domLayout="autoHeight"
            columnDefs={props.columnDefs.columnDefs}
            rowData={props.rowData}
            getRowId={(params: any) => {
              log.info("MtableComponent getRowId", params);
              return params?.data["uuid"]
                ? params?.data["uuid"]
                : params.data["id"]
                ? params.data["id"]
                : typeof params.data == "object"
                ? JSON.stringify(params.data)
                : params.data;
            }}
            defaultColDef={defaultColDef}
            onCellClicked={onCellClicked}
          ></AgGridReact>
        </div>
      )}
    </div>
  );
}