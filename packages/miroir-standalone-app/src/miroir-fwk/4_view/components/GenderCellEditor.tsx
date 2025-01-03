import { Autocomplete, Box, TextField } from '@mui/material';
import {
  ICellEditorParams
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react';
import ReactDOM from 'react-dom';

import { LoggerInterface, MiroirLoggerFactory } from 'miroir-core';

import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "GendeCellEditor")
).then((logger: LoggerInterface) => {log = logger});


// backspace starts the editor on Windows
const KEY_BACKSPACE = 'Backspace';
const KEY_F2 = 'F2';
const KEY_ENTER = 'Enter';
const KEY_TAB = 'Tab';


export const GenderCellEditor = memo(
  forwardRef((props: ICellEditorParams, ref) => {
    log.info('GenderCellEditor2',props,ref);
    const isFemale = (value: string) => value === 'Female';

    const [ready, setReady] = useState(false);
    const [interimValue, setInterimValue] = useState(isFemale(props.value));
    const [female, setFemale] = useState<boolean | null>(null);
    const refContainer = useRef(null);

    const checkAndToggleMoodIfLeftRight = (event: any) => {
      if (ready) {
        if (['ArrowLeft', 'ArrowRight'].indexOf(event.key) > -1) {
          // left and right
          setInterimValue(!interimValue);
          event.stopPropagation();
        } else if (event.key === KEY_ENTER) {
          setFemale(interimValue);
          event.stopPropagation();
        }
      }
    };

    useEffect(() => {
      (ReactDOM.findDOMNode(refContainer.current) as any).focus();
      log.info('GenderCellEditor2 ready for edit',props,ref);

      setReady(true);
    }, []);

    // useEffect(() => {
    //   window.addEventListener('keydown', checkAndToggleMoodIfLeftRight);

    //   return () => {
    //     window.removeEventListener('keydown', checkAndToggleMoodIfLeftRight);
    //   };
    // }, [checkAndToggleMoodIfLeftRight, ready]);

    useEffect(() => {
      if (female !== null) {
        props.stopEditing();
      }
    }, [female]);

    useImperativeHandle(ref, () => {
      return {
        resolvePathOnObject() {
          return female ? 'Female' : 'Male';
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

    const selectData = [
      {
        key:'female',
        label:'female',
        src:"https://www.ag-grid.com/example-assets/genders/female.png",
        onClick:() => {
          setFemale(true);
        },
        style:femaleStyle
      },
      {
        key:'male',
        label:'male',
        src:"https://www.ag-grid.com/example-assets/genders/male.png",
        onClick:() => {
          setFemale(false);
        },
        style:maleStyle
      },
    ]
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
            log.info('GenderCellEditor2 renderOption props',props,'option',option);
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