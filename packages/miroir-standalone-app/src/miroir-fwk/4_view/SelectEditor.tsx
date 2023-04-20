import * as React from 'react'
import { ICellEditorParams } from "ag-grid-community";
import { useCallback, useState, useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import type { ReactElement } from 'react';
import ReactDOM, { render } from 'react-dom';
import { Select, type SelectElement } from '@hilla/react-components/Select.js';
import { ListBox, type ListBoxElement } from '@hilla/react-components/ListBox.js';
import { Item, type ItemElement } from '@hilla/react-components/Item.js';
import { ReactJSXElement } from '@emotion/react/types/jsx-namespace';
// import { List, ListItem } from '@mui/material';
import GenderCellRenderer from 'miroir-fwk/4_view/GenderCellRenderer';
import { ICellEditorReactComp } from 'ag-grid-react';

// import '@vaadin/select/theme/material/vaadin-select.js';

// backspace starts the editor on Windows
const KEY_BACKSPACE = 'Backspace';
const KEY_ENTER = 'Enter';
const KEY_TAB = 'Tab';

// export const myList = (props) => {
const values = ['Female','Male'];

// const MyList: React.FC<{ref}> = (props:{ref}) => {
const MyList = forwardRef<HTMLInputElement, any>((props,ref) => {

  const onSelectedChanged = (values,event) => {
    console.log( 'MyList onSelectedChanged props.ref',ref,'values',values,event?.detail?.value,values[event?.detail?.value],event);
    // setValue(values[event?.detail?.value]);
    // ref['focus']();
  }
  return (
    <ListBox onSelectedChanged={onSelectedChanged.bind(null,values)}>
      {/* {values.map(v=>(
        <Item value={v} key={v}>
          <GenderCellRenderer value={v}>{v}</GenderCellRenderer>
        </Item>)
        )
      } */}
    </ListBox> 
  );
});

// const MySelect: React.FC<{ref}> = (props:{ref}) => {
// class MySelect extends React.Component<{}> {
const MySelect=forwardRef<HTMLInputElement, any>((props,ref) =>{
  // const inputRef = useRef(null);

  console.log('MySelect constructor',props,ref);

  const LineRenderer =(): ReactElement => {
    return (
      <div>
        <MyList ref={ref}></MyList>
      </div>
    );
  }
  const onOpenedChanged = (event) => {
    console.log( 'MySelect onOpenedChanged',event?.target?.value,event);
    // setValue(event?.target?.value);
  }
  const onValidated = (event) => {
    console.log( 'MySelect onValidated',event);
    // setValue(event?.target?.value);
  }
  // return (
  // crender () {
    return (
      <div> 
        <span>
          <Select
            label='choose gender'
            // ref={ref}
            renderer={LineRenderer}
            // onChange={onChange}
            // onValueChanged={onValueChanged}
            onOpenedChanged={onOpenedChanged}
            onValidated={onValidated}
          >
          </Select>
        </span>
      </div>
    )
  // }
});

// export default forwardRef((props:ICellEditorParams, inputRef:React.ForwardRefExoticComponent<ICellEditorParams<any, any>>) => {
// export default forwardRef<HTMLInputElement>(
// export default forwardRef<React.RefAttributes<HTMLInputElement>>(
// export default forwardRef<HTMLElement, ICellEditorParams>(
export default React.memo(forwardRef<ICellEditorReactComp, ICellEditorParams>(
  // (props, ref:React.ForwardedRef<ICellEditorReactComp>) => {
  (props, ref:React.MutableRefObject<ICellEditorReactComp>) => {
    console.log('SelectEditor forwardRef props',props,'ref',ref);
    // const inputRef = useRef<any>();
    const refContainer = useRef(null);
    const [ready, setReady] = useState(false);

    const createInitialState = useCallback(() => {
      console.log('SelectEditor forwardRef createInitialState props',props,'ref',ref);
      let startValue;

      if (props.eventKey === KEY_BACKSPACE) {
        // if backspace or delete pressed, we clear the cell
        startValue = '';
      } else if (props?.charPress) {
        // if a letter was pressed, we start with the letter
        startValue = props?.charPress;
      } else {
        // otherwise we start with the current value
        startValue = props?.value;
      }

      return {
        value: startValue,
      };
    },[props]);

    const initialState = createInitialState();
    const [value, setValue] = useState(initialState.value?initialState.value:'');


    useEffect(() => {
      (ReactDOM.findDOMNode(refContainer.current) as any).focus();
      setReady(true);
    }, []);

    // const refInput = useRef(null);
    // focus on the input
    // useEffect(() => {
    //   // get ref from React component
    //   window.setTimeout(() => {
    //     console.log('window.setTimeout',ref);
        
    //     // const eInput = ref.current;
    //     // const eInput = ref?ref['current']:undefined;
    //     ref.current.focusIn();
    //   });
    // }, [])

    const isLeftOrRight = (event) => {
      return ['ArrowLeft', 'ArrowRight'].indexOf(event.key) > -1;
    };

    const isCharNumeric = (charStr) => {
      return !!/\d/.test(charStr);
    };

    const isKeyPressedNumeric = (event) => {
      const charStr = event.key;
      return isCharNumeric(charStr);
    };

    const isBackspace = (event) => {
      return event.key === KEY_BACKSPACE;
    };

    const finishedEditingPressed = (event) => {
      const key = event.key;
      return key === KEY_ENTER || key === KEY_TAB;
    };

    const onKeyDown = (event) => {
      console.log('onKeyDown char typed', event.key)
      if (isLeftOrRight(event) || isBackspace(event)) {
        event.stopPropagation();
        return;
      }
    }

    const onmousedown = (event) => {
      console.log( 'onMouseDown');
    }

    const onselect = (event) => {
      console.log( 'onSelect',event);
    }

    const onValueChanged = (event) => {
      console.log( 'onValueChanged',event?.target?.value,event);
      setValue(event?.target?.value);
    }

    const onOpenedChanged = (event) => {
      console.log( 'onOpenedChanged',event?.target?.value,event);
      // setValue(event?.target?.value);
    }

    const onSelectedChanged = (values,event) => {
      console.log( 'onSelectedChanged ref',ref,'values',values,event?.detail?.value,values[event?.detail?.value],event);
      setValue(values[event?.detail?.value]);
      // ref['focus']();
    }

    const onChange = (event) => {
      console.log( 'onChange',event?.target?.value,event);
      setValue(event?.target?.value);
    }

    const onValidated = (event) => {
      console.log( 'onValidated',event);
      // setValue(event?.target?.value);
    }

      // if (!finishedEditingPressed(event)) {
      //   if (event.preventDefault) event.preventDefault();
      // } else {
      //   console.log('char typed', event.key)
      // }
    // };

    useImperativeHandle(
      ref,
      () => {
        console.log('SelectEditor useImperativeHandle called',ref);
        return {
          getValue: () => {
            console.log('SelectEditor useImperativeHandle getValue', value);
            return value;
          },
          // afterGuiAttached: () => {
          //   console.log('SelectEditor useImperativeHandle afterGuiAttached');
          //   setValue(props.value);
          //   // ref.current.focus();
          //   // inputRef.current.select();
          // },
          // // Gets called once before editing starts, to give editor a chance to
          // // cancel the editing before it even starts.
          // isCancelBeforeStart() {
          //   return cancelBeforeStart;
          // },
          // onValueChanged:(e) => {
          //   console.log('SelectEditor useImperativeHandle onValueChanged',onValueChanged);
          // },
          // focus() {
          //   refContainer.current.focus();
          // },
          // Gets called once when editing is finished (eg if Enter is pressed).
          // If you return true, then the result of the edit will be ignored.
          // isCancelAfterEnd() {
          //   // will reject the number if it greater than 1,000,000
          //   // not very practical, but demonstrates the method.
          //   return value > 1000000;
          // },

        };
      }
    );

    return (
      <MySelect ref={refContainer}></MySelect>
    );
  }
));
