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
  EntityInstanceWithName,
  LocalCacheQueryParams,
  LoggerInterface,
  MiroirLoggerFactory,
  getLoggerName
} from "miroir-core";
import {
  ReduxStateWithUndoRedo,
  selectInstanceArrayForDeploymentSectionEntity
} from "miroir-localcache-redux";

import { packageName } from "../../../constants.js";
import { cleanLevel } from "../constants.js";
import { TableComponentRow } from "./MTableComponentInterface.js";
import {
  useMiroirContextService
} from '../MiroirContextReactProvider.js';

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
export const DefaultCellRenderer =  memo((props: ICellRendererParams<TableComponentRow>) => {
  // const valueToDisplay = props.value && props.value["value"]?props.value["value"]:props.value;
  // const valueToDisplay = props.data && props.data["value"]?props.data["value"]:props.data;
  const valueToDisplay =
    props.colDef?.field && props.data && props.data.displayedValue && props.data.displayedValue[props.colDef?.field]
      ? props.data.displayedValue[props.colDef?.field]
      : `attribute ${props.colDef?.field} does not exist on object`;
  // log.info("DefaultCellRenderer",valueToDisplay, props);

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
export const SelectEntityInstanceEditorNotUsed = memo(
  forwardRef((props: ICellEditorParams, ref) => {
    log.info('SelectEntityInstanceEditor',props,ref);
    const context = useMiroirContextService();
    const deploymentUuid = context.deploymentUuid;

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
      
    const [ready, setReady] = useState(false);
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

    // const femaleStyle = interimValue ? selected : unselected;
    // const maleStyle = !interimValue ? selected : unselected;

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
            // log.info('SelectEntityInstanceEditor renderOption props',props,'option',option);
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