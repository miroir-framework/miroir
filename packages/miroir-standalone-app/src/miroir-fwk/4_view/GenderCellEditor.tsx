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

// backspace starts the editor on Windows
const KEY_BACKSPACE = 'Backspace';
const KEY_F2 = 'F2';
const KEY_ENTER = 'Enter';
const KEY_TAB = 'Tab';

export const MoodRenderer = memo((props: ICellRendererParams) => {
  const imageForMood = (mood: string) =>
    'https://www.ag-grid.com/example-assets/genders/' +
    (mood === 'Female' ? 'female.png' : 'male.png');

  const mood = useMemo(() => imageForMood(props.value), [props.value]);

  // return <img width="20px" src={mood} />;
  return (
    <span>
      <img width="20px" src={mood} />
      {props.value}
    </span>
  )
});

export const GenderCellEditor = memo(
  forwardRef((props: ICellEditorParams, ref) => {
    console.log('GenderCellEditor',props,ref);
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
      setReady(true);
    }, []);

    useEffect(() => {
      window.addEventListener('keydown', checkAndToggleMoodIfLeftRight);

      return () => {
        window.removeEventListener('keydown', checkAndToggleMoodIfLeftRight);
      };
    }, [checkAndToggleMoodIfLeftRight, ready]);

    useEffect(() => {
      if (female !== null) {
        props.stopEditing();
      }
    }, [female]);

    useImperativeHandle(ref, () => {
      return {
        getValue() {
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

    return (
      <div
        ref={refContainer}
        style={mood}
        tabIndex={1} // important - without this the key presses wont be caught
      >
        <img
          src="https://www.ag-grid.com/example-assets/genders/female.png"
          onClick={() => {
            setFemale(true);
          }}
          style={femaleStyle}
        />
        <img
          src="https://www.ag-grid.com/example-assets/genders/male.png"
          onClick={() => {
            setFemale(false);
          }}
          style={maleStyle}
        />
      </div>
    );
  })
);