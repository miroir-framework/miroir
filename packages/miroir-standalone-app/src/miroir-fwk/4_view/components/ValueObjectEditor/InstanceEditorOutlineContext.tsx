import { MiroirLoggerFactory, type KeyMapEntry, type LoggerInterface } from "miroir-core";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";
import { useMiroirContextService } from "miroir-react";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "InstanceEditorOutlineContext"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

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
  typeCheckKeyMap: Record<string, KeyMapEntry>,
  setTypeCheckKeyMap: React.Dispatch<React.SetStateAction<Record<string, KeyMapEntry>>>,
  // setFoldedObjectAttributeOrArrayItems: React.Dispatch<
  //     React.SetStateAction<FoldedStateTree>
  //   > | undefined;
  // setSetFoldedObjectAttributeOrArrayItems: (
  //   setFoldedObjectAttributeOrArrayItems: React.Dispatch<
  //     React.SetStateAction<FoldedStateTree>
  //   >
  // ) => void;
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
    public typeCheckKeyMap: Record<string, KeyMapEntry>,
    public setTypeCheckKeyMap: React.Dispatch<React.SetStateAction<Record<string, KeyMapEntry>>>,
    // public setFoldedObjectAttributeOrArrayItems: React.Dispatch<
    //     React.SetStateAction<FoldedStateTree>
    //   > | undefined,
    // public setSetFoldedObjectAttributeOrArrayItems: (
    //   setFoldedObjectAttributeOrArrayItems: React.Dispatch<
    //     React.SetStateAction<FoldedStateTree>
    //   >
    // ) => void,
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

let count = 0;
// ################################################################################################
export function DocumentOutlineContextProvider(props: {
  // value: DocumentOutlineContextType;
  isOutlineOpen: boolean;
  onToggleOutline: () => void;
  onNavigateToPath: (path: string[]) => void;
  children: React.ReactNode;
}) {
  // const [setFoldedObjectAttributeOrArrayItems, setSetFoldedObjectAttributeOrArrayItems] =
  //   useState<React.Dispatch<React.SetStateAction<FoldedStateTree>>>();
  ++count;
  const [outlineData, setOutlineData] = useState<any>(null);
  const [reportInstance, setReportInstance] = useState<any>(null);
  const [outlineTitle, setOutlineTitle] = useState<string>("Document Outline");
  const [isOutlineOpen, setIsOutlineOpen] = useState(false);
  const [outlineWidth, setOutlineWidth] = useState(300);
  const [onToggleOutline, setOnToggleOutline] = useState<() => void>(() => {});
  const [onNavigateToPath, setOnNavigateToPath] = useState<(path: string[]) => void>(() => {});
  const [typeCheckKeyMap, setTypeCheckKeyMap] = useState<Record<string, KeyMapEntry>>({});

  const context = useMiroirContextService();

  useEffect(() => {
    context.setSetTypeCheckKeyMap((a) => {
      // console.log("DocumentOutlineContextProvider: called setTypeCheckKeyMap in context");
      return setTypeCheckKeyMap;
    });
  }, [context.setSetTypeCheckKeyMap, setTypeCheckKeyMap]);
  
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
      // setFoldedObjectAttributeOrArrayItems,
      setOutlineData,
      setOutlineTitle,
      setReportInstance,
      // setSetFoldedObjectAttributeOrArrayItems,
      typeCheckKeyMap,
      setTypeCheckKeyMap,
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
      // setFoldedObjectAttributeOrArrayItems,
      setOutlineData,
      setReportInstance,
      // setSetFoldedObjectAttributeOrArrayItems,
      setOutlineTitle,
      typeCheckKeyMap,
      setTypeCheckKeyMap,
    ]
  );

  // log.info("DocumentOutlineContextProvider render: reportInstance:", reportInstance);

  return (
    // <DocumentOutlineContext.Provider value={props.value}>
    <DocumentOutlineContext.Provider value={outlineContextValue}>
      {/* <DocumentOutlineContext.Provider value={outlineContextValue}> */}
      {props.children}
    </DocumentOutlineContext.Provider>
  );
}
