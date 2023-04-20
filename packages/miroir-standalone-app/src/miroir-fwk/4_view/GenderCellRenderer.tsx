import { ICellRendererParams } from 'ag-grid-community';
import React, { memo, useMemo } from 'react';

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