import { ICellEditorParams } from "ag-grid-community";
import { getLoggerName, LoggerInterface, MiroirLoggerFactory } from "miroir-core";
import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { packageName } from "../../constants.js";
import { cleanLevel } from "./constants.js";

const loggerName: string = getLoggerName(packageName, cleanLevel,"SimpleEditor");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});


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
