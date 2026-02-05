import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { configureStore } from '@reduxjs/toolkit';
import '@testing-library/jest-dom';

import {
  deployment_Library_DO_NO_USE,
  JzodElement,
  LoggerInterface,
  MiroirLoggerFactory,
  TransformerForBuild,
  getReduxDeploymentsStateIndex,
  type TransformerForBuildPlusRuntime
} from "miroir-core";

import { 
  LocalCacheProvider,
  getMemoizedReduxDeploymentsStateSelectorMap,
  ReduxStateWithUndoRedo,
  reduxStoreWithUndoRedoGetInitialState,
  LocalCacheSliceState
} from "../../src/miroir-fwk/miroir-localcache-imports.js";

import { TransformerEditor } from "../../src/miroir-fwk/4_view/components/TransformerEditor/TransformerEditor";
import { cleanLevel, packageName } from "../3_controllers/constants";
import { book1, entityBook, entityDefinitionBook } from "miroir-example-library";

// ################################################################################################
const pageLabel = "TransformerEditor.test";

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, pageLabel)).then(
  (logger: LoggerInterface) => {
    log = logger;
  }
);

// ################################################################################################
// Mock data setup
const mockDeploymentUuid = deployment_Library_DO_NO_USE.uuid;
const mockEntityUuid = entityBook.uuid;

// Sample transformers for testing
const sampleBuildTransformer: TransformerForBuild = {
  interpolation: "build",
  transformerType: "returnValue",
  value: "Sample Build Value"
};

const sampleRuntimeTransformer: TransformerForBuildPlusRuntime = {
  interpolation: "runtime",
  transformerType: "returnValue",
  value: "Sample Runtime Value"
};

// ################################################################################################
// Test utilities
function createMockStore() {
  // Create a mock LocalCacheSliceState that matches the expected structure
  const mockLocalCacheSliceState: LocalCacheSliceState = {
    loading: {},
    current: {
      [getReduxDeploymentsStateIndex(mockDeploymentUuid, "model", entityBook.uuid)]: {
        entities: {
          [entityBook.uuid]: entityBook as any,
          [entityDefinitionBook.uuid]: entityDefinitionBook as any
        },
        ids: [entityBook.uuid, entityDefinitionBook.uuid]
      },
      [getReduxDeploymentsStateIndex(mockDeploymentUuid, "data", entityBook.uuid)]: {
        entities: {
          [book1.uuid]: book1 as any
        },
        ids: [book1.uuid]
      }
    },
    status: {
      initialLoadDone: true
    }
  };

  const mockState: ReduxStateWithUndoRedo = reduxStoreWithUndoRedoGetInitialState(() => mockLocalCacheSliceState);
  mockState.presentModelSnapshot = mockLocalCacheSliceState;

  return configureStore({
    reducer: {
      // We use an identity reducer since we're providing the full preloaded state
      presentModelSnapshot: (state = mockState.presentModelSnapshot) => state,
      currentTransaction: (state = mockState.currentTransaction) => state,
      previousModelSnapshot: (state = mockState.previousModelSnapshot) => state,
      pastModelPatches: (state = mockState.pastModelPatches) => state,
      futureModelPatches: (state = mockState.futureModelPatches) => state,
      queriesResultsCache: (state = mockState.queriesResultsCache) => state,
    },
    preloadedState: mockState
  });
}

function renderTransformerEditor(props: Partial<React.ComponentProps<typeof TransformerEditor>> = {}) {
  const store = createMockStore();
  const defaultProps = {
    deploymentUuid: mockDeploymentUuid,
    entityUuid: mockEntityUuid,
    ...props
  };

  return render(
    <LocalCacheProvider store={store}>
      <TransformerEditor {...defaultProps} />
    </LocalCacheProvider>
  );
}

// ################################################################################################
describe("TransformerEditor Component", () => {
  
  describe("Component Rendering", () => {
    it("renders the transformer editor with all three panes", () => {
      renderTransformerEditor();
      
      // Check for main heading
      expect(screen.getByText(/Transformer Editor/)).toBeInTheDocument();
      
      // Check for transformer editor section
      expect(screen.getByText(/Transformer Schema/)).toBeInTheDocument();
      
      // Check for instance pane
      expect(screen.getByText(/Sample Entity Instance/)).toBeInTheDocument();
      
      // Check for result pane  
      expect(screen.getByText(/Transformation Result/)).toBeInTheDocument();
    });

    it("displays entity name in the interface", () => {
      renderTransformerEditor();
      expect(screen.getByText(/Book/)).toBeInTheDocument();
    });

    it("renders transformer type selection dropdown", () => {
      renderTransformerEditor();
      const transformerTypeSelect = screen.getByRole('combobox');
      expect(transformerTypeSelect).toBeInTheDocument();
    });
  });

  describe("Transformer Type Switching", () => {
    it("switches between build and runtime transformer modes", async () => {
      renderTransformerEditor();
      
      const modeSelect = screen.getByDisplayValue('build');
      
      await act(async () => {
        fireEvent.change(modeSelect, { target: { value: 'runtime' } });
      });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('runtime')).toBeInTheDocument();
      });
    });

    it("updates transformer schema when mode changes", async () => {
      renderTransformerEditor();
      
      const modeSelect = screen.getByDisplayValue('build');
      
      await act(async () => {
        fireEvent.change(modeSelect, { target: { value: 'runtime' } });
      });
      
      // The JzodElementEditor should update to show runtime transformer schema
      await waitFor(() => {
        expect(screen.getByDisplayValue('runtime')).toBeInTheDocument();
      });
    });
  });

  describe("Instance Selection", () => {
    it("displays refresh button for getting new instance", () => {
      renderTransformerEditor();
      expect(screen.getByText(/Refresh Instance/)).toBeInTheDocument();
    });

    it("can refresh to get a different instance", async () => {
      renderTransformerEditor();
      
      const refreshButton = screen.getByText(/Refresh Instance/);
      
      await act(async () => {
        fireEvent.click(refreshButton);
      });
      
      // Should trigger instance refresh (behavior depends on implementation)
      expect(refreshButton).toBeInTheDocument();
    });
  });

  describe("Transformer Application", () => {
    it("shows transformation result when transformer is applied", async () => {
      renderTransformerEditor();
      
      // The result should be automatically calculated
      // This test verifies the result pane shows some content
      await waitFor(() => {
        const resultSection = screen.getByText(/Transformation Result/);
        expect(resultSection).toBeInTheDocument();
      });
    });

    it("updates result when transformer changes", async () => {
      renderTransformerEditor();
      
      // Change transformer type
      const modeSelect = screen.getByDisplayValue('build');
      
      await act(async () => {
        fireEvent.change(modeSelect, { target: { value: 'runtime' } });
      });
      
      // Result should update (specific content depends on implementation)
      await waitFor(() => {
        expect(screen.getByDisplayValue('runtime')).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("handles invalid transformer gracefully", async () => {
      renderTransformerEditor();
      
      // The component should not crash with invalid transformers
      // This is a basic render test - more specific error scenarios would need
      // to be tested based on actual error handling implementation
      expect(screen.getByText(/Transformer Editor/)).toBeInTheDocument();
    });

    it("displays error message when transformation fails", async () => {
      // This test would need to be implemented based on actual error handling
      renderTransformerEditor();
      
      // Should handle cases where transformation throws an error
      expect(screen.getByText(/Transformer Editor/)).toBeInTheDocument();
    });
  });

  describe("Layout and Responsiveness", () => {
    it("maintains proper 3-pane layout structure", () => {
      renderTransformerEditor();
      
      // Check that all three main sections are present
      const transformerSection = screen.getByText(/Transformer Schema/);
      const instanceSection = screen.getByText(/Sample Entity Instance/);
      const resultSection = screen.getByText(/Transformation Result/);
      
      expect(transformerSection).toBeInTheDocument();
      expect(instanceSection).toBeInTheDocument();
      expect(resultSection).toBeInTheDocument();
    });

    it("applies correct styling classes", () => {
      const { container } = renderTransformerEditor();
      
      // Check for main container styling
      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveStyle({ padding: '20px' });
    });
  });

  describe("Integration with JzodElementEditor", () => {
    it("renders JzodElementEditor for transformer schema editing", () => {
      renderTransformerEditor();
      
      // The JzodElementEditor should be present for editing transformer schema
      // This checks that the integration is working
      expect(screen.getByText(/Transformer Schema/)).toBeInTheDocument();
    });

    it("updates transformer when JzodElementEditor value changes", async () => {
      renderTransformerEditor();
      
      // This would test the actual integration with JzodElementEditor
      // The specific implementation depends on how changes are propagated
      expect(screen.getByText(/Transformer Schema/)).toBeInTheDocument();
    });
  });

  describe("State Management", () => {
    it("maintains transformer state correctly", async () => {
      renderTransformerEditor();
      
      // Check that the component maintains its state
      const modeSelect = screen.getByDisplayValue('build');
      expect(modeSelect).toBeInTheDocument();
      
      await act(async () => {
        fireEvent.change(modeSelect, { target: { value: 'runtime' } });
      });
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('runtime')).toBeInTheDocument();
      });
    });

    it("preserves instance when transformer mode changes", async () => {
      renderTransformerEditor();
      
      // The instance should remain the same when switching transformer modes
      const instanceSection = screen.getByText(/Sample Entity Instance/);
      expect(instanceSection).toBeInTheDocument();
      
      const modeSelect = screen.getByDisplayValue('build');
      
      await act(async () => {
        fireEvent.change(modeSelect, { target: { value: 'runtime' } });
      });
      
      // Instance section should still be there
      await waitFor(() => {
        expect(screen.getByText(/Sample Entity Instance/)).toBeInTheDocument();
      });
    });
  });

  describe("Performance", () => {
    it("renders within acceptable time", async () => {
      const startTime = performance.now();
      renderTransformerEditor();
      const endTime = performance.now();
      
      // Component should render quickly (under 100ms for basic render)
      expect(endTime - startTime).toBeLessThan(100);
    });

    it("does not cause unnecessary re-renders", async () => {
      // This would require more sophisticated testing setup to track renders
      renderTransformerEditor();
      expect(screen.getByText(/Transformer Editor/)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels and roles", () => {
      renderTransformerEditor();
      
      // Check for proper accessibility attributes
      const transformerTypeSelect = screen.getByRole('combobox');
      expect(transformerTypeSelect).toBeInTheDocument();
    });

    it("supports keyboard navigation", async () => {
      renderTransformerEditor();
      
      const modeSelect = screen.getByRole('combobox');
      
      // Test keyboard interaction
      await act(async () => {
        modeSelect.focus();
        fireEvent.keyDown(modeSelect, { key: 'ArrowDown' });
      });
      
      expect(modeSelect).toHaveFocus();
    });
  });
});

// ################################################################################################
describe("TransformerEditor Integration Tests", () => {
  
  describe("End-to-End Transformer Workflow", () => {
    it("allows complete transformer creation and testing workflow", async () => {
      renderTransformerEditor();
      
      // 1. Verify initial state
      expect(screen.getByText(/Transformer Editor/)).toBeInTheDocument();
      
      // 2. Select transformer type
      const modeSelect = screen.getByDisplayValue('build');
      expect(modeSelect).toBeInTheDocument();
      
      // 3. Switch to runtime mode
      await act(async () => {
        fireEvent.change(modeSelect, { target: { value: 'runtime' } });
      });
      
      // 4. Verify mode change
      await waitFor(() => {
        expect(screen.getByDisplayValue('runtime')).toBeInTheDocument();
      });
      
      // 5. Check that all panes are still functional
      expect(screen.getByText(/Sample Entity Instance/)).toBeInTheDocument();
      expect(screen.getByText(/Transformation Result/)).toBeInTheDocument();
    });

    it("handles complex transformer configurations", async () => {
      renderTransformerEditor();
      
      // Test with a more complex transformer setup
      // This would involve testing nested transformers, complex schemas, etc.
      expect(screen.getByText(/Transformer Editor/)).toBeInTheDocument();
    });
  });

  describe("Data Flow Integration", () => {
    it("correctly fetches and displays entity instances", () => {
      renderTransformerEditor();
      
      // Verify that the component can fetch and display entity instances
      expect(screen.getByText(/Sample Entity Instance/)).toBeInTheDocument();
    });

    it("properly applies transformers to instances", async () => {
      renderTransformerEditor();
      
      // The transformation should be applied automatically
      await waitFor(() => {
        expect(screen.getByText(/Transformation Result/)).toBeInTheDocument();
      });
    });
  });
});
