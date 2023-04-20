import { ICellEditorParams } from "ag-grid-community";
import { useCallback, useState, useRef, forwardRef, useImperativeHandle, useEffect } from "react";

// backspace starts the editor on Windows
const KEY_BACKSPACE = 'Backspace';
const KEY_ENTER = 'Enter';
const KEY_TAB = 'Tab';

export default forwardRef((props:ICellEditorParams, ref) => {
  console.log('EntityEditor forwardRef props',props,'ref',ref);

  const createInitialState = useCallback(() => {
    // console.log('EntityEditor forwardRef createInitialState props',props,'ref',ref);
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

  // const inputRef = useRef<any>();
    // const [value, setValue] = useState(ref['value']);
  const [value, setValue] = useState(initialState.value?initialState.value:'');
  const refInput = useRef(null);

  // focus on the input
  useEffect(() => {
    // get ref from React component
    window.setTimeout(() => {
      const eInput = refInput.current;
      eInput?.focus();
    });
  }, [])

  // const cancelBeforeStart =  props.charPress && '1234567890'.indexOf(props.charPress) < 0;

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

  function inputHandler(e:any) {
    console.log('EntityEditor inputHandler',e);
    setValue(e.target.value);
  }

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

    // if (!finishedEditingPressed(event)) {
    //   if (event.preventDefault) event.preventDefault();
    // } else {
    //   console.log('char typed', event.key)
    // }
  };

  useImperativeHandle(
    ref,
    () => {
      console.log('EntityEditor useImperativeHandle called');
      return {
        getValue: () => {
          console.log('EntityEditor useImperativeHandle getValue', value);
          return value;
        },
        // afterGuiAttached: () => {
        //   console.log('EntityEditor useImperativeHandle afterGuiAttached');
        //   setValue(props.value);
        //   inputRef.current.focus();
        //   // inputRef.current.select();
        // },
        // Gets called once before editing starts, to give editor a chance to
        // cancel the editing before it even starts.
        // isCancelBeforeStart() {
        //   return cancelBeforeStart;
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
      <input
          type="text"
          className="ag-input-field-input ag-text-field-input"
          ref={refInput}
          onChange={inputHandler}
          value={value}
          placeholder={'Enter ' + props.column.getId()}
          onKeyDown={(event) => onKeyDown(event)}
      />
  )
})
