import { createContext, useContext } from "react";

// Document Outline Context
export interface DocumentOutlineContextType {
  isOutlineOpen: boolean;
  outlineWidth: number;
  outlineData: any;
  outlineTitle: string;
  onToggleOutline: () => void;
  onNavigateToPath: (path: string[]) => void;
  setOutlineData: (data: any) => void;
  setOutlineTitle: (title: string) => void;
  // setFoldedObjectAttributeOrArrayItems: React.Dispatch<
  //     React.SetStateAction<{ [k: string]: boolean }>
  //   > | null;
  // setSetFoldedObjectAttributeOrArrayItems: (
  //   setFoldedObjectAttributeOrArrayItems: React.Dispatch<
  //     React.SetStateAction<{ [k: string]: boolean }>
  //   >
  // ) => void;
}
export class DocumentOutlineContextDefault implements DocumentOutlineContextType {
  // public setFoldedObjectAttributeOrArrayItems: React.Dispatch<
  //     React.SetStateAction<{ [k: string]: boolean }>
  //   > | null = null;
  // public setSetFoldedObjectAttributeOrArrayItems = (
  //   setFoldedObjectAttributeOrArrayItems: React.Dispatch<
  //     React.SetStateAction<{ [k: string]: boolean }>
  //   >
  // ) => {
  //   console.log("DocumentOutlineContextDefault: setSetFoldedObjectAttributeOrArrayItems called with parameter", JSON.stringify(setFoldedObjectAttributeOrArrayItems));
  //   this.setFoldedObjectAttributeOrArrayItems = setFoldedObjectAttributeOrArrayItems;
  // };
  constructor(
  public isOutlineOpen = false,
  public outlineWidth = 300,
  public outlineData = null,
  public outlineTitle = "Document Outline",
  public onToggleOutline = () => {},
  public onNavigateToPath = (path: string[]) => {},
  public setOutlineData = (data: any) => {},
  public setOutlineTitle = (title: string) => {},
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