import { createContext, useContext, useMemo, useState } from "react";
import { FoldedStateTree } from "../Reports/FoldedStateTreeUtils";

// Document Outline Context
export interface DocumentOutlineContextType {
  isOutlineOpen: boolean;
  // outlineWidth: number;
  outlineData: any;
  reportInstance: any; // The root object being edited in the report, which structure is reflected in the outline
  outlineTitle: string;
  onToggleOutline: () => void;
  onNavigateToPath: (path: string[]) => void;
  setOutlineData: (data: any) => void;
  setReportInstance: (instance: any) => void;
  setOutlineTitle: (title: string) => void;
  setFoldedObjectAttributeOrArrayItems: React.Dispatch<
      React.SetStateAction<FoldedStateTree>
    > | undefined;
  setSetFoldedObjectAttributeOrArrayItems: (
    setFoldedObjectAttributeOrArrayItems: React.Dispatch<
      React.SetStateAction<FoldedStateTree>
    >
  ) => void;
}
export class DocumentOutlineContextDefault implements DocumentOutlineContextType {
  constructor(
    public isOutlineOpen = false,
    public outlineWidth = 300,
    public outlineData = null,
    public outlineTitle = "Document Outline",
    public reportInstance = null,
    public onToggleOutline = () => {},
    public onNavigateToPath = (path: string[]) => {},
    public setOutlineData = (data: any) => {},
    public setOutlineTitle = (title: string) => {},
    public setReportInstance = (instance: any) => {},
    public setFoldedObjectAttributeOrArrayItems: React.Dispatch<
        React.SetStateAction<FoldedStateTree>
      > | undefined,
    public setSetFoldedObjectAttributeOrArrayItems: (
      setFoldedObjectAttributeOrArrayItems: React.Dispatch<
        React.SetStateAction<FoldedStateTree>
      >
    ) => void,
  ) {
    // Empty constructor
  }
}

export const DocumentOutlineContext = createContext<DocumentOutlineContextType | null>(null);

export const useDocumentOutlineContext = () => {
  const context = useContext(DocumentOutlineContext);
  if (!context) {
    throw new Error('useDocumentOutlineContext must be used within a DocumentOutlineProvider');
  }
  return context;
};

export function DocumentOutlineContextProvider(props: {
  // value: DocumentOutlineContextType;
  isOutlineOpen: boolean;
  onToggleOutline: () => void;
  onNavigateToPath: (path: string[]) => void;
  children: React.ReactNode;
}) {
  const [setFoldedObjectAttributeOrArrayItems, setSetFoldedObjectAttributeOrArrayItems] =
    useState<React.Dispatch<React.SetStateAction<FoldedStateTree>>>();

  const [outlineData, setOutlineData] = useState<any>(null);
  const [reportInstance, setReportInstance] = useState<any>(null);
  const [outlineTitle, setOutlineTitle] = useState<string>("Document Outline");
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [outlineWidth, setOutlineWidth] = useState(300);
  const [onToggleOutline, setOnToggleOutline] = useState<() => void>(() => {});
  const [onNavigateToPath, setOnNavigateToPath] = useState<(path: string[]) => void>(() => {});

  const outlineContextValue: DocumentOutlineContextType = useMemo<DocumentOutlineContextType>(
    () => ({
      isOutlineOpen,
      // outlineWidth,
      outlineData,
      reportInstance,
      outlineTitle,
      onToggleOutline,
      onNavigateToPath,
      setIsOutlineOpen,
      setFoldedObjectAttributeOrArrayItems,
      setOutlineData,
      setOutlineTitle,
      setReportInstance,
      setSetFoldedObjectAttributeOrArrayItems,
    }),
    [
      isOutlineOpen,
      outlineWidth,
      outlineData,
      outlineTitle,
      reportInstance,
      onNavigateToPath,
      onToggleOutline,
      setIsOutlineOpen,
      setFoldedObjectAttributeOrArrayItems,
      setOutlineData,
      setReportInstance,
      setSetFoldedObjectAttributeOrArrayItems,
    ]
  );

  return (
    // <DocumentOutlineContext.Provider value={props.value}>
    <DocumentOutlineContext.Provider value={outlineContextValue}>
      {/* <DocumentOutlineContext.Provider value={outlineContextValue}> */}
      {props.children}
    </DocumentOutlineContext.Provider>
  );
}
