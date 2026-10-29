import React, { createContext, useContext, useState, ReactNode } from 'react';

export type GridType = 'ag-grid' | 'glide-data-grid';

interface GridContextType {
  gridType: GridType;
  setGridType: (type: GridType) => void;
}

const GridContext = createContext<GridContextType | undefined>(undefined);

export const useGridContext = (): GridContextType => {
  const context = useContext(GridContext);
  if (!context) {
    throw new Error('useGridContext must be used within a GridProvider');
  }
  return context;
};

interface GridProviderProps {
  children: ReactNode;
}

export const GridProvider: React.FC<GridProviderProps> = ({ children }) => {
  const [gridType, setGridType] = useState<GridType>('ag-grid');

  return (
    <GridContext.Provider value={{ gridType, setGridType }}>
      {children}
    </GridContext.Provider>
  );
};
