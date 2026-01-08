import { describe, it, expect, beforeEach } from 'vitest';
import { ViewParams, GridType, AppTheme, ToolsPageState } from '../../src/0_interfaces/4-views/ViewParams.js';

describe('ViewParams generalEditMode integration tests', () => {
  let viewParams: ViewParams;

  beforeEach(() => {
    viewParams = new ViewParams();
  });

  describe('generalEditMode initialization', () => {
    it('should initialize generalEditMode to false by default', () => {
      expect(viewParams.generalEditMode).toBe(false);
    });

    it('should initialize generalEditMode with provided value', () => {
      const viewParamsWithEditMode = new ViewParams(true, 250, 'ag-grid', 'default', {}, true);
      expect(viewParamsWithEditMode.generalEditMode).toBe(true);
    });
  });

  describe('generalEditMode getter and setter', () => {
    it('should get current generalEditMode value', () => {
      expect(viewParams.generalEditMode).toBe(false);
    });

    it('should set generalEditMode value using setter', () => {
      viewParams.generalEditMode = true;
      expect(viewParams.generalEditMode).toBe(true);
    });

    it('should toggle generalEditMode value', () => {
      viewParams.generalEditMode = true;
      expect(viewParams.generalEditMode).toBe(true);
      
      viewParams.generalEditMode = false;
      expect(viewParams.generalEditMode).toBe(false);
    });
  });

  describe('updateEditMode method', () => {
    it('should update generalEditMode using updateEditMode method', () => {
      viewParams.updateEditMode(true);
      expect(viewParams.generalEditMode).toBe(true);
    });

    it('should disable generalEditMode using updateEditMode method', () => {
      viewParams.updateEditMode(true);
      viewParams.updateEditMode(false);
      expect(viewParams.generalEditMode).toBe(false);
    });

    it('should handle multiple toggles correctly', () => {
      viewParams.updateEditMode(true);
      expect(viewParams.generalEditMode).toBe(true);
      
      viewParams.updateEditMode(false);
      expect(viewParams.generalEditMode).toBe(false);
      
      viewParams.updateEditMode(true);
      expect(viewParams.generalEditMode).toBe(true);
    });
  });

  describe('generalEditMode persistence pattern', () => {
    it('should maintain generalEditMode state across getter calls', () => {
      viewParams.updateEditMode(true);
      expect(viewParams.generalEditMode).toBe(true);
      expect(viewParams.generalEditMode).toBe(true); // Second call should return same value
    });

    it('should not affect other ViewParams properties', () => {
      const initialSidebarWidth = viewParams.sidebarWidth;
      const initialGridType = viewParams.gridType;
      
      viewParams.updateEditMode(true);
      
      expect(viewParams.sidebarWidth).toBe(initialSidebarWidth);
      expect(viewParams.gridType).toBe(initialGridType);
    });
  });

  describe('generalEditMode integration with constructor', () => {
    it('should construct ViewParams with all parameters including generalEditMode', () => {
      const customParams = new ViewParams(
        false,              // sidebarIsOpen
        300,                // sidebarWidth
        'glide-data-grid',  // gridType
        'dark',             // appTheme
        {},                 // toolsPage
        true                // generalEditMode
      );
      
      expect(customParams.sidebarIsOpen).toBe(false);
      expect(customParams.sidebarWidth).toBe(300);
      expect(customParams.gridType).toBe('glide-data-grid');
      expect(customParams.appTheme).toBe('dark');
      expect(customParams.generalEditMode).toBe(true);
    });
  });
});
