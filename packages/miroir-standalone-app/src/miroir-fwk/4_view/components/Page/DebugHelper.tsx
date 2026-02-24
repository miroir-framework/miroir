import { ThemedOnScreenDebug } from "../Themes";

export type DebugElements = { label: string; data: any }[];
export const DebugHelper: React.FC<{elements: DebugElements}> = ({elements}) => {
  return (
    <>
    {elements.map((element, index) => (
      <ThemedOnScreenDebug key={index} label={element.label} data={element.data} initiallyUnfolded={false} useCodeBlock={true} />
    ))}
    </>
    // <ThemedOnScreenDebug label={label} data={data} initiallyUnfolded={false} useCodeBlock={true} />
  );
}
