import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useDocumentOutlineContext } from "../ValueObjectEditor/InstanceEditorOutlineContext";

// Document Outline Context
export interface ReportPageContextType {
  // isOutlineOpen: boolean;
  // outlineWidth: number;
  // outlineData: any;
  // outlineTitle: string;
  // onToggleOutline: () => void;
  // onNavigateToPath: (path: string[]) => void;
  // setOutlineData: (data: any) => void;
  // setOutlineTitle: (title: string) => void;
  foldedObjectAttributeOrArrayItems: { [k: string]: boolean };
  setFoldedObjectAttributeOrArrayItems: React.Dispatch<
      React.SetStateAction<{ [k: string]: boolean }>
    >;
}
export class ReportPageContextDefault implements ReportPageContextType {
  constructor(
    public foldedObjectAttributeOrArrayItems: { [k: string]: boolean },
    public setFoldedObjectAttributeOrArrayItems: React.Dispatch<
        React.SetStateAction<{ [k: string]: boolean }>
      >,
  ) {
    // Empty constructor
  }
}

export const ReportPageContext = createContext<ReportPageContextType | null>(null);

// export const useDocumentOutlineContext = () => {
//   const context = useContext(ReportPageContext);
//   if (!context) {
//     throw new Error('useDocumentOutlineContext must be used within a DocumentOutlineProvider');
//   }
//   return context;
// };

export function ReportPageContextProvider(props: {
  // value: ReportPageContextType;
  children: React.ReactNode;
}) {
  const [foldedObjectAttributeOrArrayItems, setFoldedObjectAttributeOrArrayItems] =
    useState<{ [k: string]: boolean }>({});
  const outlineContext = useDocumentOutlineContext();

  useEffect(() =>
    outlineContext.setSetFoldedObjectAttributeOrArrayItems((a) =>{
      console.log("ReportPageContextProvider: called setFoldedObjectAttributeOrArrayItems in outlineContext");
      return setFoldedObjectAttributeOrArrayItems
    })
  , [outlineContext.setSetFoldedObjectAttributeOrArrayItems]);

  const outlineContextValue: ReportPageContextType = useMemo(
    () =>
      new ReportPageContextDefault(
        foldedObjectAttributeOrArrayItems,
        setFoldedObjectAttributeOrArrayItems,
      ),
    [
      foldedObjectAttributeOrArrayItems,
      setFoldedObjectAttributeOrArrayItems,
    ]
  );

  return (
    <ReportPageContext.Provider value={outlineContextValue}>
    {/* <DocumentOutlineContext.Provider value={outlineContextValue}> */}
      {props.children}
    </ReportPageContext.Provider>
  );
}

// #############################################################################################
export function useReportPageContext(): ReportPageContextType {
  const context = useContext(ReportPageContext);
  if (!context) {
    throw new Error('useReportPageContext must be used within a ReportPageContextReactProvider');
  }
  return context;
}
