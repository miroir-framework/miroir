import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useDocumentOutlineContext } from "../ValueObjectEditor/InstanceEditorOutlineContext";
import { FoldedStateTree, isNodeFolded, setNodeFolded, foldAllChildren, unfoldAllChildren } from "./FoldedStateTreeUtils";
import type { FoldAction } from "./FoldedStateTreeDebug";
import { LoggerInterface, MiroirLoggerFactory } from "miroir-core";
import { packageName } from "../../../../constants";
import { cleanLevel } from "../../constants";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ReportPageContext")
).then((logger: LoggerInterface) => {
  log = logger;
});

// Document Outline Context
export interface ReportPageContextType {
  foldedObjectAttributeOrArrayItems: FoldedStateTree;
  isNodeFolded: (path: (string | number)[]) => boolean;
  setNodeFolded: (path: (string | number)[], folded: FoldAction) => void;
  foldAllChildren: (path: (string | number)[], childKeys: (string | number)[]) => void;
  unfoldAllChildren: (path: (string | number)[], childKeys: (string | number)[]) => void;
  // Legacy API - will be deprecated
  setFoldedObjectAttributeOrArrayItems: React.Dispatch<
      React.SetStateAction<FoldedStateTree>
    >;
}
export class ReportPageContextDefault implements ReportPageContextType {
  constructor(
    public foldedObjectAttributeOrArrayItems: FoldedStateTree,
    public setFoldedObjectAttributeOrArrayItems: React.Dispatch<
        React.SetStateAction<FoldedStateTree>
      >,
    public isNodeFolded: (path: (string | number)[]) => boolean,
    public setNodeFolded: (path: (string | number)[], folded: FoldAction) => void,
    public foldAllChildren: (path: (string | number)[], childKeys: (string | number)[]) => void,
    public unfoldAllChildren: (path: (string | number)[], childKeys: (string | number)[]) => void
  ) {
    // Empty constructor
  }
}

export const ReportPageContext = createContext<ReportPageContextType | null>(null);

export function ReportPageContextProvider(props: {
  children: React.ReactNode;
}) {
  const [foldedObjectAttributeOrArrayItems, setFoldedObjectAttributeOrArrayItems] =
    useState<FoldedStateTree>({});
  const outlineContext = useDocumentOutlineContext();

  useEffect(() =>
    outlineContext.setSetFoldedObjectAttributeOrArrayItems((a) =>{
      // console.log("ReportPageContextProvider Outline: called setFoldedObjectAttributeOrArrayItems in outlineContext");
      return setFoldedObjectAttributeOrArrayItems
    })
  , [outlineContext.setSetFoldedObjectAttributeOrArrayItems]);

  // // Node folding state handlers
  const handleIsNodeFolded = useCallback((path: (string | number)[]): boolean => {
    // console.log("isNodeFolded called with path:", path, "state:", foldedObjectAttributeOrArrayItems);
    const result = isNodeFolded(foldedObjectAttributeOrArrayItems, path);
    // console.log("isNodeFolded result:", result);
    return result;
  }, [foldedObjectAttributeOrArrayItems]);

  const handleSetNodeFoldedState = useCallback((path: (string | number)[], folded: FoldAction): void => {
    // console.log("setNodeFolded called with path:", path, "folded:", folded);
    setFoldedObjectAttributeOrArrayItems(prevState => {
      const newState = setNodeFolded(prevState, path, folded);
      // console.log("New folded state:", newState);
      return newState;
    });
  }, []);

  const handleFoldAllChildren = useCallback((path: (string | number)[], childKeys: (string | number)[]): void => {
    setFoldedObjectAttributeOrArrayItems(prevState => 
      foldAllChildren(prevState, path, childKeys)
    );
  }, []);

  const handleUnfoldAllChildren = useCallback((path: (string | number)[], childKeys: (string | number)[]): void => {
    setFoldedObjectAttributeOrArrayItems(prevState => 
      unfoldAllChildren(prevState, path, childKeys)
    );
  }, []);

  const outlineContextValue: ReportPageContextType = useMemo(
    () => {
      log.info("ReportPageContextProvider: Providing context with folded state foldedObjectAttributeOrArrayItems:", foldedObjectAttributeOrArrayItems);
      return new ReportPageContextDefault(
        foldedObjectAttributeOrArrayItems,
        setFoldedObjectAttributeOrArrayItems,
        handleIsNodeFolded,
        handleSetNodeFoldedState,
        handleFoldAllChildren,
        handleUnfoldAllChildren
      );
    },
    [
      foldedObjectAttributeOrArrayItems,
      setFoldedObjectAttributeOrArrayItems,
      handleIsNodeFolded,
      handleSetNodeFoldedState,
      handleFoldAllChildren,
      handleUnfoldAllChildren
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
