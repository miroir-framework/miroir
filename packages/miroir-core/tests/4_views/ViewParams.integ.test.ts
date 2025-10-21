import { describe, it, expect, beforeEach } from 'vitest';
import { ViewParams, GridType, AppTheme, ToolsPageState } from '../../src/0_interfaces/4-views/ViewParams.js';

describe('ViewParams editMode integration tests', () => {
  let viewParams: ViewParams;

  beforeEach(() => {
    viewParams = new ViewParams();
  });

  describe('editMode initialization', () => {
    it('should initialize editMode to false by default', () => {
      expect(viewParams.editMode).toBe(false);
    });

    it('should initialize editMode with provided value', () => {
      const viewParamsWithEditMode = new ViewParams(true, 250, 'ag-grid', 'default', {}, true);
      expect(viewParamsWithEditMode.editMode).toBe(true);
    });
  });

  describe('editMode getter and setter', () => {
    it('should get current editMode value', () => {
      expect(viewParams.editMode).toBe(false);
    });

    it('should set editMode value using setter', () => {
      viewParams.editMode = true;
      expect(viewParams.editMode).toBe(true);
    });

    it('should toggle editMode value', () => {
      viewParams.editMode = true;
      expect(viewParams.editMode).toBe(true);
      
      viewParams.editMode = false;
      expect(viewParams.editMode).toBe(false);
    });
  });

  describe('updateEditMode method', () => {
    it('should update editMode using updateEditMode method', () => {
      viewParams.updateEditMode(true);
      expect(viewParams.editMode).toBe(true);
    });

    it('should disable editMode using updateEditMode method', () => {
      viewParams.updateEditMode(true);
      viewParams.updateEditMode(false);
      expect(viewParams.editMode).toBe(false);
    });

    it('should handle multiple toggles correctly', () => {
      viewParams.updateEditMode(true);
      expect(viewParams.editMode).toBe(true);
      
      viewParams.updateEditMode(false);
      expect(viewParams.editMode).toBe(false);
      
      viewParams.updateEditMode(true);
      expect(viewParams.editMode).toBe(true);
    });
  });

  describe('editMode persistence pattern', () => {
    it('should maintain editMode state across getter calls', () => {
      viewParams.updateEditMode(true);
      expect(viewParams.editMode).toBe(true);
      expect(viewParams.editMode).toBe(true); // Second call should return same value
    });

    it('should not affect other ViewParams properties', () => {
      const initialSidebarWidth = viewParams.sidebarWidth;
      const initialGridType = viewParams.gridType;
      
      viewParams.updateEditMode(true);
      
      expect(viewParams.sidebarWidth).toBe(initialSidebarWidth);
      expect(viewParams.gridType).toBe(initialGridType);
    });
  });

  describe('editMode integration with constructor', () => {
    it('should construct ViewParams with all parameters including editMode', () => {
      const customParams = new ViewParams(
        false,              // sidebarIsOpen
        300,                // sidebarWidth
        'glide-data-grid',  // gridType
        'dark',             // appTheme
        {},                 // toolsPage
        true                // editMode
      );
      
      expect(customParams.sidebarIsOpen).toBe(false);
      expect(customParams.sidebarWidth).toBe(300);
      expect(customParams.gridType).toBe('glide-data-grid');
      expect(customParams.appTheme).toBe('dark');
      expect(customParams.editMode).toBe(true);
    });
  });
});
