import _ from "lodash";
const { transform:_transform, isObject: _isObject, isUndefined: _isUndefined } = _;

import { Autocomplete, Box, TextField } from '@mui/material';
import {
  ICellEditorParams,
  ICellRendererParams
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import ReactDOM from 'react-dom';
import { useSelector } from "react-redux";

import {
  Entity,
  EntityDefinition,
  EntityInstance,
  EntityInstanceWithName,
  LocalCacheQueryParams,
  LoggerInterface,
  MetaModel,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";
import {
  ReduxStateWithUndoRedo,
  selectInstanceArrayForDeploymentSectionEntity,
  selectModelForDeployment,
} from "miroir-localcache-redux";

import { packageName } from "../../constants";
import {
  useMiroirContextService
} from './MiroirContextReactProvider';
import { cleanLevel } from "./constants";
import { TableComponentRow } from "./MTableComponentInterface";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SelectEntityInstanceEditor");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

// backspace starts the editor on Windows
const KEY_BACKSPACE = 'Backspace';
const KEY_F2 = 'F2';
const KEY_ENTER = 'Enter';
const KEY_TAB = 'Tab';

// ################################################################################################
export const EntityInstanceCellRenderer =  memo((props: ICellRendererParams<TableComponentRow>) => {
  const context = useMiroirContextService();
  
  const deploymentUuid = context.deploymentUuid;
  // const entityUuid = props.data?.rawValue.parentUuid;
  const entityUuid = props.colDef?.cellRendererParams.entityUuid;
  // const targetObjectUuid = props.data?.rawValue.uuid;
  log.info(
    "EntityInstanceCellRenderer called for field",
    props.colDef?.field,
    "with deploymentUuid",
    context.deploymentUuid,
    "entityUuid",
    entityUuid,
    "props:",
    props,
    "value",
    props.value
  );
  
  // const currentModelSelectorParams:EntityInstanceUuidIndexSelectorParams = useMemo(
  const currentModelSelectorParams:LocalCacheQueryParams = useMemo(
    () => ({
      queryType: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid: context.deploymentUuid,
      }
    } as LocalCacheQueryParams),
    [context]
  );

  const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
  const currentModel = useSelector((state: ReduxStateWithUndoRedo) =>
    localSelectModelForDeployment(state, currentModelSelectorParams)
  ) as MetaModel

  const currentMiroirEntityDefinition: EntityDefinition | undefined = props.colDef?.cellRendererParams.entityDefinition??currentModel.entityDefinitions?.find(e=>e?.entityUuid === entityUuid);
  
  // const selectorParams:EntityInstanceUuidIndexSelectorParams = useMemo(
  const selectorParams:LocalCacheQueryParams = useMemo(
    () => ({
      queryType: "LocalCacheEntityInstancesSelectorParams",
      definition: {
        deploymentUuid,
        applicationSection: "data",
        entityUuid: entityUuid,
      }
    } as LocalCacheQueryParams),
    [deploymentUuid, entityUuid]
  );
  const instancesToDisplay: EntityInstanceWithName[] = useSelector((state: ReduxStateWithUndoRedo) =>
    selectInstanceArrayForDeploymentSectionEntity(state, selectorParams)
  ) as EntityInstanceWithName[];
  log.info("EntityInstanceCellRenderer instancesToDisplay",instancesToDisplay);
  const instanceToDisplay: EntityInstanceWithName = (
    props.colDef?.cellRendererParams.entityDefinition
      ? props.data?.rawValue
      : instancesToDisplay.find((i) => i.uuid == (props.data?.rawValue as any)[props.colDef?.field ?? ""])
  ) as EntityInstanceWithName;

  return (
    <span>
      {instanceToDisplay
        ? instanceToDisplay["name"]
        : (currentMiroirEntityDefinition ? currentMiroirEntityDefinition["name"] : "entity definition not found") +
          " " +
          props.value +
          " not known."}
    </span>
  );
  // }
})

// // ################################################################################################
// export const DefaultCellRenderer =  memo((props: ICellRendererParams) => {
//   // const valueToDisplay = props.value && props.value["value"]?props.value["value"]:props.value;
//   const valueToDisplay = props.data && props.data["value"]?props.data["value"]:props.data;
//   log.info("DefaultCellRenderer",valueToDisplay, props);

//   if (Array.isArray(valueToDisplay) || _isObject(valueToDisplay)) {
//     return (
//       <span>
//         {JSON.stringify(valueToDisplay)}
//       </span>
//     )
//   } else {
//     return (
//       <div>
//         {/* {props.value && props.value["value"]?props.value["value"]:(props.value?props.value:'null value')} */}
//         {/* {props.data?props.data:'null value'} */}
//         {valueToDisplay?valueToDisplay:'null value'}
//       </div>
//     );
//   }
// })

// ################################################################################################
export const DefaultCellRenderer2 =  memo((props: ICellRendererParams<TableComponentRow>) => {
  // const valueToDisplay = props.value && props.value["value"]?props.value["value"]:props.value;
  // const valueToDisplay = props.data && props.data["value"]?props.data["value"]:props.data;
  const valueToDisplay =
    props.colDef?.field && props.data && props.data.displayedValue && props.data.displayedValue[props.colDef?.field]
      ? props.data.displayedValue[props.colDef?.field]
      : `attribute ${props.colDef?.field} does not exist on object`;
  log.info("DefaultCellRenderer2",valueToDisplay, props);

  if (Array.isArray(valueToDisplay) || _isObject(valueToDisplay)) {
    return (
      <span>
        {JSON.stringify(valueToDisplay)}
      </span>
    )
  } else {
    return (
      <div>
        {/* {props.value && props.value["value"]?props.value["value"]:(props.value?props.value:'null value')} */}
        {/* {props.data?props.data:'null value'} */}
        {/* {props.colDef?.field && valueToDisplay[props.colDef?.field]?valueToDisplay[props.colDef?.field]:'null value'} */}
        {valueToDisplay}
      </div>
    );
  }
})

// ################################################################################################
export const SelectEntityInstanceEditor = memo(
  forwardRef((props: ICellEditorParams, ref) => {
    log.info('SelectEntityInstanceEditor',props,ref);
    const context = useMiroirContextService();
    const deploymentUuid = context.deploymentUuid;

    // const currentModelSelectorParams:EntityInstanceUuidIndexSelectorParams = useMemo(
    const currentModelSelectorParams:LocalCacheQueryParams = useMemo(
      () => ({
        queryType: "LocalCacheEntityInstancesSelectorParams",
        definition: {
          deploymentUuid: context.deploymentUuid,
        }
      } as LocalCacheQueryParams),
      [context]
    );
  
    const localSelectModelForDeployment = useMemo(selectModelForDeployment,[]);
    const currentModel = useSelector((state: ReduxStateWithUndoRedo) =>
      localSelectModelForDeployment(state, currentModelSelectorParams)
    ) as MetaModel
  
    const miroirEntities:Entity [] = currentModel.entities;
    // const miroirEntities:MetaEntity [] = useLocalCacheSectionEntitiesTOREMOVE(deploymentUuid,'model');
    const miroirEntityDefinitions:EntityDefinition[] = currentModel.entityDefinitions;
    // const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheSectionEntityDefinitions(deploymentUuid,'model');
    const currentMiroirEntityDefinition: EntityDefinition | undefined = miroirEntityDefinitions?.find(e=>e?.entityUuid === (props as any)['entityUuid']);
  
    // const selectorParams:EntityInstanceUuidIndexSelectorParams = useMemo(
    const selectorParams:LocalCacheQueryParams = useMemo(
      () => ({
        queryType: "LocalCacheEntityInstancesSelectorParams",
        definition: {
          deploymentUuid,
          applicationSection: "data",
          entityUuid: (props as any).entityUuid,
        }
      } as LocalCacheQueryParams),
      [deploymentUuid, (props as any).entityUuid]
    );
    const instancesToDisplay: EntityInstanceWithName[] = useSelector((state: ReduxStateWithUndoRedo) =>
      selectInstanceArrayForDeploymentSectionEntity(state, selectorParams)
    ) as EntityInstanceWithName[];
    const instanceToDisplay = instancesToDisplay.find(i=>i.uuid == props.value);
      
    const [ready, setReady] = useState(false);
    // const [interimValue, setInterimValue] = useState(isFemale(props.value));
    const [interimValue, setInterimValue] = useState(props.value);
    const [selectedElement, setSelectedElement] = useState<any>(null);
    const refContainer = useRef(null);

    useEffect(() => {
      (ReactDOM.findDOMNode(refContainer.current) as any).focus();
      log.info('SelectEntityInstanceEditor ready for edit',props,ref);

      setReady(true);
    }, []);

    useEffect(() => {
      if (selectedElement !== null) {
        props.stopEditing();
      }
    }, [selectedElement]);

    useImperativeHandle(ref, () => {
      return {
        getValue() {
          return selectedElement ? selectedElement : '';
        },
      };
    });

    const mood = {
      borderRadius: 15,
      border: '1px solid grey',
      background: '#e6e6e6',
      padding: 15,
      textAlign: 'center' as const,
      display: 'inline-block',
    };

    const unselected = {
      paddingLeft: 10,
      paddingRight: 10,
      border: '1px solid transparent',
      padding: 4,
    };

    const selected = {
      paddingLeft: 10,
      paddingRight: 10,
      border: '1px solid lightgreen',
      padding: 4,
    };

    const femaleStyle = interimValue ? selected : unselected;
    const maleStyle = !interimValue ? selected : unselected;

    const selectData = instancesToDisplay.map(
      (i: EntityInstanceWithName) => (
        {
          key:i.name,
          label:i.name,
          src:"",
          onClick:() => {
            setSelectedElement(i.uuid);
          },
          // style:femaleStyle
        }
      )
    );

    return (
      <div
        ref={refContainer}
        style={mood}
        tabIndex={1} // important - without this the key presses wont be caught
      >
        <Autocomplete
          id="combo-box-demo"
          options={selectData}
          sx={{ width: 300 }}
          autoHighlight
          getOptionLabel={(option) => option.label}
          onChange={(event,value,reason,details) => value?.onClick()}
          isOptionEqualToValue={(o,v)=>o.key == v.key}
          renderOption={(props, option) => {
            log.info('SelectEntityInstanceEditor renderOption props',props,'option',option);
            return (
              <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                <img
                  loading="lazy"
                  width="20"
                  src={option.src}
                  alt=""
                />
                {option.label} 
              </Box>
            )
          }}
          renderInput={(params) => <TextField {...params} label="Gender" />}
        ></Autocomplete>
      </div>
    );
  })
);