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
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import ReactDOM from 'react-dom';

import { EntityDefinition, EntityInstanceWithName, MetaEntity } from 'miroir-core';
import {
  useMiroirContextService
} from './MiroirContextReactProvider';
import { useLocalCacheInstancesForEntityTOREFACTOR, useLocalCacheMetaModel, useLocalCacheSectionEntities, useLocalCacheSectionEntityDefinitions } from "./ReduxHooks";
import { LocalCacheInputSelectorParams, ReduxStateWithUndoRedo, selectInstanceArrayForDeploymentSectionEntity } from "miroir-redux";
import { useSelector } from "react-redux";


// backspace starts the editor on Windows
const KEY_BACKSPACE = 'Backspace';
const KEY_F2 = 'F2';
const KEY_ENTER = 'Enter';
const KEY_TAB = 'Tab';

// ################################################################################################
export const EntityInstanceCellRenderer =  memo((props: ICellRendererParams) => {
  // console.log('EntityInstanceCellRenderer',props);
  const context = useMiroirContextService();

  const deploymentUuid = context.deploymentUuid;
  // const deploymentUuid = (props as any)('deploymentUuid');
  const entityUuid = (props as any)['entityUuid'];
  // const miroirEntities:MetaEntity [] = useLocalCacheSectionEntities(deploymentUuid,'model');
  console.log('EntityInstanceCellRenderer 1');
  
  const currentModel = useLocalCacheMetaModel(context.deploymentUuid)();
  const currentMiroirEntityDefinition: EntityDefinition | undefined = currentModel.entityDefinitions?.find(e=>e?.entityUuid === entityUuid);
  console.log('EntityInstanceCellRenderer 2');
  
  // const instancesToDisplay = useLocalCacheInstancesForEntityTOREFACTOR(deploymentUuid,'data',(props as any)['entityUuid']) as EntityInstanceWithName[];
  const selectorParams:LocalCacheInputSelectorParams = useMemo(
    () => ({
      deploymentUuid,
      applicationSection: "data",
      entityUuid: entityUuid,
    } as LocalCacheInputSelectorParams),
    [deploymentUuid, entityUuid]
  );
  const localSelector = useCallback((state: ReduxStateWithUndoRedo) =>
  selectInstanceArrayForDeploymentSectionEntity(
    state,
    selectorParams
  ),[selectorParams])

  // const instancesToDisplay:EntityInstanceWithName[] = useSelector(localSelector) as EntityInstanceWithName[];
  const instancesToDisplay: EntityInstanceWithName[] = useSelector((state: ReduxStateWithUndoRedo) =>
    selectInstanceArrayForDeploymentSectionEntity(state, selectorParams)
  ) as EntityInstanceWithName[];
  console.log('EntityInstanceCellRenderer 3');
  // const instanceToDisplay = instancesToDisplay.find(i=>i.uuid == props.value["value"]);
  const instanceToDisplay = instancesToDisplay.find(i=>i.uuid == props.value);

  // if (entityUuid) {
  //   return (
  //     <span>
  //       {/* {instanceToDisplay?instanceToDisplay['name']:(currentMiroirEntityDefinition?currentMiroirEntityDefinition['name']:'entity definition not found') + ' ' + props.value + ' not known.'} */}
  //       <Link to={`/instance/f714bb2f-a12d-4e71-a03b-74dcedea6eb4/data/e8ba151b-d68e-4cc3-9a83-3459d309ccf5/caef8a59-39eb-48b5-ad59-a7642d3a1e8f`}>Book</Link>
  //     </span>
  //   );
  // } else {
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

// ################################################################################################
export const DefaultCellRenderer =  memo((props: ICellRendererParams) => {
  const valueToDisplay = props.value && props.value["value"]?props.value["value"]:props.value;

  if (Array.isArray(valueToDisplay) || _isObject(valueToDisplay)) {
    return (
      <span>
        {JSON.stringify(valueToDisplay)}
      </span>
    )
  } else {
    return (
      <span>
        {/* {props.value && props.value["value"]?props.value["value"]:(props.value?props.value:'null value')} */}
        {props.value?props.value:'null value'}
      </span>
    );
  }
})


export const SelectEntityInstanceEditor = memo(
  forwardRef((props: ICellEditorParams, ref) => {
    console.log('SelectEntityInstanceEditor',props,ref);
    const context = useMiroirContextService();
    const deploymentUuid = context.deploymentUuid;
    const miroirEntities:MetaEntity [] = useLocalCacheSectionEntities(deploymentUuid,'model');
    const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheSectionEntityDefinitions(deploymentUuid,'model');
    const currentMiroirEntityDefinition: EntityDefinition | undefined = miroirEntityDefinitions?.find(e=>e?.entityUuid === (props as any)['entityUuid']);
  
    const instancesToDisplay = useLocalCacheInstancesForEntityTOREFACTOR(deploymentUuid,(props as any)['entityUuid'],'data') as EntityInstanceWithName[];
    const instanceToDisplay = instancesToDisplay.find(i=>i.uuid == props.value);
      
    const [ready, setReady] = useState(false);
    // const [interimValue, setInterimValue] = useState(isFemale(props.value));
    const [interimValue, setInterimValue] = useState(props.value);
    const [selectedElement, setSelectedElement] = useState<any>(null);
    const refContainer = useRef(null);

    useEffect(() => {
      (ReactDOM.findDOMNode(refContainer.current) as any).focus();
      console.log('SelectEntityInstanceEditor ready for edit',props,ref);

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
            console.log('SelectEntityInstanceEditor renderOption props',props,'option',option);
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