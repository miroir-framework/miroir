import { ICellRendererParams } from 'ag-grid-community';
import { LoggerInterface, MiroirLoggerFactory } from "miroir-core";

import { Icon } from '@mui/material';
import React, { memo, useMemo } from 'react';
import { packageName } from '../../../../constants';
import { cleanLevel } from '../../constants';
import { TableActionButtons } from './TableActionButtons.js';
import { TableComponentRow } from './EntityInstanceGridInterface.js';

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

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "GenderCellRenderer")
).then((logger: LoggerInterface) => {log = logger});


export const ToolsCellRenderer: React.MemoExoticComponent<(props: ICellRendererParams) => JSX.Element> = memo(
  (props: ICellRendererParams) => {
    const row = props.data as TableComponentRow;
    const onEdit = (props as any)["onClickEdit"];
    const onDuplicate = (props as any)["onClickDuplicate"];  
    const onDelete = (props as any)["onClickDelete"];

    return (
      <TableActionButtons
        row={row}
        onEdit={onEdit}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
        variant="ag-grid"
        size="small"
      />
    );
  }
);

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