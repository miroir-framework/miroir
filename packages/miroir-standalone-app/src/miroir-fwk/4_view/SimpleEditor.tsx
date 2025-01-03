import { ICellEditorParams } from "ag-grid-community";
import { LoggerInterface, MiroirLoggerFactory } from "miroir-core";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { packageName } from "../../constants.js";
import { cleanLevel } from "./constants.js";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "SimpleEditor")
).then((logger: LoggerInterface) => {log = logger});



export default forwardRef((props:ICellEditorParams, ref) => {
    const inputRef = useRef<any>();
    const [value, setValue] = useState('');

    function inputHandler(e:any) {
      log.info('SimpleEditor inputHandler',e);
      setValue(e.target.value);
    }

    useImperativeHandle(
      ref,
      () => {
        return {
          resolvePathOnObject: () => {
            log.info('SimpleEditor useImperativeHandle resolvePathOnObject', value);
            return value;
          },
          afterGuiAttached: () => {
            log.info('SimpleEditor useImperativeHandle afterGuiAttached');
            setValue(props.value);
            inputRef.current.focus();
            inputRef.current.select();
          }
        };
      }
    );

    return (
        <input
            type="text"
            className="ag-input-field-input ag-text-field-input"
            ref={inputRef}
            onChange={inputHandler}
            value={value}
            placeholder={'Enter ' + props.column.getId()}
        />
    )
})
