import { ICellEditorParams } from "ag-grid-community";
import { useState, useRef, forwardRef, useImperativeHandle } from "react";

export default forwardRef((props:ICellEditorParams, ref) => {
    const inputRef = useRef<any>();
    const [value, setValue] = useState('');

    function inputHandler(e:any) {
      console.log('SimpleEditor inputHandler',e);
      setValue(e.target.value);
    }

    useImperativeHandle(
      ref,
      () => {
        return {
          getValue: () => {
            console.log('SimpleEditor useImperativeHandle getValue', value);
            return value;
          },
          afterGuiAttached: () => {
            console.log('SimpleEditor useImperativeHandle afterGuiAttached');
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
