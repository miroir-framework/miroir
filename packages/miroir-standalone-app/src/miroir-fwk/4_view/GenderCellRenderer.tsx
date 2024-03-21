import { ICellRendererParams } from 'ag-grid-community';
import { getLoggerName, LoggerInterface, MiroirLoggerFactory } from 'miroir-core';
import React, { memo, useMemo } from 'react';
import { packageName } from '../../constants';
import { cleanLevel } from './constants';
import { Icon } from '@mui/material';

// export default (props) => {
//   const image = props.value === 'Male' ? 'male.png' : 'female.png';
//   const imageSource = `https://www.ag-grid.com/example-assets/genders/${image}`;
//   return (
//     <span>
//       <img src={imageSource} />
//       {props.value}
//     </span>
//   );
// };

const loggerName: string = getLoggerName(packageName, cleanLevel,"GenderCellRenderer");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

export const ToolsCellRenderer:React.MemoExoticComponent<(props: ICellRendererParams) => JSX.Element> = memo((props: ICellRendererParams) => {
  return (
    <span>
      <button onClick={
        ()=>{
          console.log('ToolsCellRenderer calling onClick!');
          (props as any)['onClick'](props.data);
        } 
      }>
        <Icon>create</Icon>
      </button>
    </span>
  )
})

const GenderCellRenderer = memo((props: ICellRendererParams) => {
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
})

export default GenderCellRenderer;