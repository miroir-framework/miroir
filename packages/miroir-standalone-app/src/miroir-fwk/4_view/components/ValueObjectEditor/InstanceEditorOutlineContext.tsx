import { createContext, useContext, useMemo, useState } from "react";

// Document Outline Context
export interface DocumentOutlineContextType {
  isOutlineOpen: boolean;
  // outlineWidth: number;
  outlineData: any;
  outlineTitle: string;
  onToggleOutline: () => void;
  onNavigateToPath: (path: string[]) => void;
  setOutlineData: (data: any) => void;
  setOutlineTitle: (title: string) => void;
  setFoldedObjectAttributeOrArrayItems: React.Dispatch<
      React.SetStateAction<{ [k: string]: boolean }>
    > | undefined;
  setSetFoldedObjectAttributeOrArrayItems: (
    setFoldedObjectAttributeOrArrayItems: React.Dispatch<
      React.SetStateAction<{ [k: string]: boolean }>
    >
  ) => void;
}
export class DocumentOutlineContextDefault implements DocumentOutlineContextType {
  constructor(
    public isOutlineOpen = false,
    public outlineWidth = 300,
    public outlineData = null,
    public outlineTitle = "Document Outline",
    public onToggleOutline = () => {},
    public onNavigateToPath = (path: string[]) => {},
    public setOutlineData = (data: any) => {},
    public setOutlineTitle = (title: string) => {},
    public setFoldedObjectAttributeOrArrayItems: React.Dispatch<
        React.SetStateAction<{ [k: string]: boolean }>
      > | undefined,
    public setSetFoldedObjectAttributeOrArrayItems: (
      setFoldedObjectAttributeOrArrayItems: React.Dispatch<
        React.SetStateAction<{ [k: string]: boolean }>
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
    useState<React.Dispatch<React.SetStateAction<{ [k: string]: boolean }>>>();

  // const [isOutlineOpen, setIsOutlineOpen] = useState<boolean>(props.value.isOutlineOpen);
  // const [outlineWidth, setOutlineWidth] = useState<number>(props.value.outlineWidth);
  const [outlineData, setOutlineData] = useState<any>(null);
  const [outlineTitle, setOutlineTitle] = useState<string>("Document Outline");
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [outlineWidth, setOutlineWidth] = useState(300);
  // const [outlineData, setOutlineData] = useState<any>(null);
  // const [outlineTitle, setOutlineTitle] = useState<string>("Document Structure");
  const [onToggleOutline, setOnToggleOutline] = useState<() => void>(() => {});
  const [onNavigateToPath, setOnNavigateToPath] = useState<(path: string[]) => void>(() => {});

  const outlineContextValue: DocumentOutlineContextType = useMemo<DocumentOutlineContextType>(
    () => ({
      isOutlineOpen,
      // outlineWidth,
      outlineData,
      outlineTitle,
      onToggleOutline,
      onNavigateToPath,
      setOutlineData,
      setOutlineTitle,
      setIsOutlineOpen,
      setFoldedObjectAttributeOrArrayItems,
      setSetFoldedObjectAttributeOrArrayItems,
    }),
    [
      isOutlineOpen,
      outlineWidth,
      outlineData,
      setOutlineData,
      outlineTitle,
      onNavigateToPath,
      onToggleOutline,
      setIsOutlineOpen,
      setFoldedObjectAttributeOrArrayItems,
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
