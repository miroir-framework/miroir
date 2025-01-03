import { ICellEditorParams } from "ag-grid-community";
import { LoggerInterface, MiroirLoggerFactory } from "miroir-core";

import { forwardRef, KeyboardEvent, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { packageName } from "../../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "EntityEditor")
).then((logger: LoggerInterface) => {log = logger});


// backspace starts the editor on Windows
const KEY_BACKSPACE = 'Backspace';
const KEY_ENTER = 'Enter';
const KEY_TAB = 'Tab';

export default forwardRef((props:ICellEditorParams, ref) => {
  log.info('EntityEditor forwardRef props',props,'ref',ref);

  const createInitialState = useCallback(() => {
    // log.info('EntityEditor forwardRef createInitialState props',props,'ref',ref);
    let startValue;

    if (props.eventKey === KEY_BACKSPACE) {
      // if backspace or delete pressed, we clear the cell
      startValue = '';
    // } else if ((props as any)?.charPress) {
    } else if (props?.eventKey) {
      // if a letter was pressed, we start with the letter
      startValue = props?.eventKey;
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
  const refInput = useRef<any>(null);

  // focus on the input
  useEffect(() => {
    // get ref from React component
    window.setTimeout(() => {
      const eInput = refInput.current;
      eInput?.focus();
    });
  }, [])

  // const cancelBeforeStart =  props.charPress && '1234567890'.indexOf(props.charPress) < 0;

  const isLeftOrRight = (event: { key: string; }) => {
    return ['ArrowLeft', 'ArrowRight'].indexOf(event.key) > -1;
  };

  const isCharNumeric = (charStr: string) => {
    return !!/\d/.test(charStr);
  };

  const isKeyPressedNumeric = (event: { key: any; }) => {
    const charStr = event.key;
    return isCharNumeric(charStr);
  };

  const isBackspace = (event: { key: string; }) => {
    return event.key === KEY_BACKSPACE;
  };

  function inputHandler(e:any) {
    log.info('EntityEditor inputHandler',e);
    setValue(e.target.value);
  }

  const finishedEditingPressed = (event: { key: any; }) => {
    const key = event.key;
    return key === KEY_ENTER || key === KEY_TAB;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    log.info('onKeyDown char typed', event.key)
    if (isLeftOrRight(event) || isBackspace(event)) {
      event.stopPropagation();
      return;
    }

    // if (!finishedEditingPressed(event)) {
    //   if (event.preventDefault) event.preventDefault();
    // } else {
    //   log.info('char typed', event.key)
    // }
  };

  useImperativeHandle(
    ref,
    () => {
      log.info('EntityEditor useImperativeHandle called');
      return {
        resolvePathOnObject: () => {
          log.info('EntityEditor useImperativeHandle resolvePathOnObject', value);
          return value;
        },
        // afterGuiAttached: () => {
        //   log.info('EntityEditor useImperativeHandle afterGuiAttached');
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
