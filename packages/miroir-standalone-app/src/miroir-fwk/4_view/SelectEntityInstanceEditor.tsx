import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import React, {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import ReactDOM, { render } from 'react-dom';
import { AgGridReact } from 'ag-grid-react';
import {
  ColDef,
  ICellEditorParams,
  ICellRendererParams,
} from 'ag-grid-community';
import { Autocomplete, Box, TextField } from '@mui/material';

import { EntityDefinition, EntityInstance, EntityInstanceWithName, MetaEntity } from 'miroir-core';
import {
  useLocalCacheSectionEntities,
  useLocalCacheSectionEntityDefinitions,
  useLocalCacheEntityDefinitions,
  useLocalCacheInstancesForEntity,
  useLocalCacheInstancesForReport,
} from "miroir-fwk/4_view/hooks";
import { useMiroirContextDeploymentUuid } from 'miroir-fwk/4_view/MiroirContextReactProvider';


// backspace starts the editor on Windows
const KEY_BACKSPACE = 'Backspace';
const KEY_F2 = 'F2';
const KEY_ENTER = 'Enter';
const KEY_TAB = 'Tab';


export const EntityInstanceCellRenderer =  memo((props: ICellRendererParams) => {
  console.log('EntityInstanceCellRenderer',props);
  const deploymentUuid = useMiroirContextDeploymentUuid();
  const miroirEntities:MetaEntity [] = useLocalCacheSectionEntities(deploymentUuid,'model');
  // const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheEntityDefinitions();
  const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheSectionEntityDefinitions(deploymentUuid,'model');
  const currentMiroirEntityDefinition: EntityDefinition | undefined = miroirEntityDefinitions?.find(e=>e?.entityUuid === props['entityUuid']);

  const instancesToDisplay = useLocalCacheInstancesForEntity(deploymentUuid,'data',props['entityUuid']) as EntityInstanceWithName[];
  const instanceToDisplay = instancesToDisplay.find(i=>i.uuid == props.value);
  // const imageForMood = (mood: string) =>
  //   'https://www.ag-grid.com/example-assets/genders/' +
  //   (mood === 'Female' ? 'female.png' : 'male.png');

  // const mood = useMemo(() => imageForMood(props.value), [props.value]);

  // return <img width="20px" src={mood} />;
  return (
    <span>
      {/* <img width="20px" src={mood} /> */}
      {instanceToDisplay?instanceToDisplay['name']:(currentMiroirEntityDefinition?currentMiroirEntityDefinition['name']:'entity definition not found') + ' ' + props.value + ' not known.'}
    </span>
  )
})


export const SelectEntityInstanceEditor = memo(
  forwardRef((props: ICellEditorParams, ref) => {
    console.log('SelectEntityInstanceEditor',props,ref);
    const deploymentUuid = useMiroirContextDeploymentUuid();
    // const miroirEntities:MetaEntity [] = useLocalCacheEntities();
    const miroirEntities:MetaEntity [] = useLocalCacheSectionEntities(deploymentUuid,'model');
    // const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheEntityDefinitions();
    const miroirEntityDefinitions:EntityDefinition[] = useLocalCacheSectionEntityDefinitions(deploymentUuid,'model');
    const currentMiroirEntityDefinition: EntityDefinition | undefined = miroirEntityDefinitions?.find(e=>e?.entityUuid === props['entityUuid']);
  
    const instancesToDisplay = useLocalCacheInstancesForEntity(deploymentUuid,props['entityUuid'],'data') as EntityInstanceWithName[];
    const instanceToDisplay = instancesToDisplay.find(i=>i.uuid == props.value);
      
    const [ready, setReady] = useState(false);
    // const [interimValue, setInterimValue] = useState(isFemale(props.value));
    const [interimValue, setInterimValue] = useState(props.value);
    const [selectedElement, setSelectedElement] = useState<any>(null);
    const refContainer = useRef(null);

    // const checkAndToggleMoodIfLeftRight = (event: any) => {
    //   if (ready) {
    //     if (['ArrowLeft', 'ArrowRight'].indexOf(event.key) > -1) {
    //       // left and right
    //       setInterimValue(!interimValue);
    //       event.stopPropagation();
    //     } else if (event.key === KEY_ENTER) {
    //       setFemale(interimValue);
    //       event.stopPropagation();
    //     }
    //   }
    // };

    useEffect(() => {
      (ReactDOM.findDOMNode(refContainer.current) as any).focus();
      console.log('SelectEntityInstanceEditor ready for edit',props,ref);

      setReady(true);
    }, []);

    // useEffect(() => {
    //   window.addEventListener('keydown', checkAndToggleMoodIfLeftRight);

    //   return () => {
    //     window.removeEventListener('keydown', checkAndToggleMoodIfLeftRight);
    //   };
    // }, [checkAndToggleMoodIfLeftRight, ready]);

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
    // const selectData = [
    //   {
    //     key:'female',
    //     label:'female',
    //     src:"https://www.ag-grid.com/example-assets/genders/female.png",
    //     onClick:() => {
    //       setFemale(true);
    //     },
    //     style:femaleStyle
    //   },
    //   {
    //     key:'male',
    //     label:'male',
    //     src:"https://www.ag-grid.com/example-assets/genders/male.png",
    //     onClick:() => {
    //       setFemale(false);
    //     },
    //     style:maleStyle
    //   },
    // ]

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