import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, IconButton, Typography, TextField } from '@mui/material';
import { Clear as ClearIcon, Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';

type FilterType = 'contains' | 'startsWith' | 'endsWith' | 'equals' | 'notEqual' | 'notContains' | 'notStartsWith' | 'notEndsWith';
type FilterLogic = 'AND' | 'OR';

interface FilterCondition {
  id: string;
  columnId: string;
  type: FilterType;
  value: string;
}

interface ColumnFilterGroup {
  columnId: string;
  conditions: FilterCondition[];
  logic: FilterLogic;
}

interface FilterState {
  columnGroups: ColumnFilterGroup[];
  globalLogic: FilterLogic;
}

interface Props {
  columnDefs: { columnDefs: any[] };
  filterState: FilterState;
  selectedColumnId: string | null;
  setSelectedColumnId: (id: string | null) => void;
  addFilterCondition: (columnId: string) => void;
  updateColumnGroupLogic: (columnId: string, logic: FilterLogic) => void;
  removeColumnGroup: (columnId: string) => void;
  updateFilterCondition: (conditionId: string, updates: Partial<FilterCondition>) => void;
  removeFilterCondition: (conditionId: string) => void;
  clearAllFilters: () => void;
  filterValueRef: React.RefObject<HTMLInputElement>;
  theme?: any;
}

export default function GlideDataGridFilterComponent({
  columnDefs,
  filterState,
  selectedColumnId,
  setSelectedColumnId,
  addFilterCondition,
  updateColumnGroupLogic,
  removeColumnGroup,
  updateFilterCondition,
  removeFilterCondition,
  clearAllFilters,
  filterValueRef,
  theme,
}: Props) {
  return (
    <Box
      sx={{
        padding: 1,
        borderBottom: `1px solid ${theme?.colors?.border || '#e0e0e0'}`,
        backgroundColor: theme?.components?.toolbar?.background || '#f8f8f8',
        width: '100%',
        maxWidth: '100%',
        // overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'center',
          mb: 1,
          flexWrap: 'wrap',
          width: '100%',
          maxWidth: '100%',
          // overflow: 'hidden',
        }}
      >
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Add Filter Column</InputLabel>
          <Select
            value={selectedColumnId || ''}
            label="Add Filter Column"
            onChange={(e) => {
              const newColumnId = (e.target as any).value || null;
              setSelectedColumnId(newColumnId);
            }}
          >
            <MenuItem value="">None</MenuItem>
            {columnDefs.columnDefs
              .filter((colDef: any) => colDef.filter !== false)
              .map((colDef: any) => (
                <MenuItem key={colDef.field} value={colDef.field}>
                  {colDef.headerName || colDef.field}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        {filterState.columnGroups.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Between Columns</InputLabel>
            <Select
              value={filterState.globalLogic}
              label="Between Columns"
              onChange={(e) =>
                // Intentional cast; parent will pass a typed handler when needed
                (e.target as any).value && null
              }
            >
              <MenuItem value="AND">AND</MenuItem>
              <MenuItem value="OR">OR</MenuItem>
            </Select>
          </FormControl>
        )}

        {filterState.columnGroups.length > 0 && (
          <IconButton size="small" onClick={clearAllFilters} title="Clear All Filters">
            <ClearIcon />
          </IconButton>
        )}
      </Box>

      {filterState.columnGroups.length === 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Select a column above to start filtering
          </Typography>
        </Box>
      )}

      {filterState.columnGroups.map((group, groupIndex) => (
        <Box
          key={group.columnId}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            padding: 1,
            mb: 1,
            backgroundColor: theme?.colors?.background || '#ffffff',
            width: '100%',
            maxWidth: '100%',
            // overflow: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              mb: 1,
              flexWrap: 'wrap',
              width: '100%',
              maxWidth: '100%',
            }}
          >
            {groupIndex > 0 && (
              <Typography
                variant="body2"
                sx={{
                  minWidth: 60,
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: 'primary.main',
                  backgroundColor: 'primary.light',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                }}
              >
                {filterState.globalLogic}
              </Typography>
            )}

            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', flex: 1 }}>
              {columnDefs.columnDefs.find((col: any) => col.field === group.columnId)
                ?.headerName || group.columnId}
            </Typography>

            {group.conditions.length > 1 && (
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <InputLabel>Logic</InputLabel>
                <Select
                  value={group.logic}
                  label="Logic"
                  onChange={(e) => updateColumnGroupLogic(group.columnId, (e.target as any).value)}
                >
                  <MenuItem value="AND">AND</MenuItem>
                  <MenuItem value="OR">OR</MenuItem>
                </Select>
              </FormControl>
            )}

            <IconButton size="small" onClick={() => addFilterCondition(group.columnId)} title="Add Condition" color="primary">
              <AddIcon />
            </IconButton>

            <IconButton size="small" onClick={() => removeColumnGroup(group.columnId)} title="Remove Column Filter">
              <ClearIcon />
            </IconButton>
          </Box>

          {group.conditions.map((condition, conditionIndex) => (
            <Box
              key={condition.id}
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                mb: 1,
                ml: groupIndex > 0 ? 8 : 0,
                flexWrap: 'wrap',
                width: '100%',
                maxWidth: '100%',
              }}
            >
              {conditionIndex > 0 && (
                <Typography variant="body2" sx={{ minWidth: 40, textAlign: 'center', fontWeight: 'bold' }}>
                  {group.logic}
                </Typography>
              )}

              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Type</InputLabel>
                <Select
                  value={condition.type}
                  label="Type"
                  onChange={(e) => updateFilterCondition(condition.id, { type: (e.target as any).value })}
                >
                  <MenuItem value="contains">Contains</MenuItem>
                  <MenuItem value="notContains">Not Contains</MenuItem>
                  <MenuItem value="startsWith">Starts With</MenuItem>
                  <MenuItem value="notStartsWith">Not Starts With</MenuItem>
                  <MenuItem value="endsWith">Ends With</MenuItem>
                  <MenuItem value="notEndsWith">Not Ends With</MenuItem>
                  <MenuItem value="equals">Equals</MenuItem>
                  <MenuItem value="notEqual">Not Equal</MenuItem>
                </Select>
              </FormControl>

              <TextField
                inputRef={
                  group.columnId === selectedColumnId && conditionIndex === group.conditions.length - 1
                    ? filterValueRef
                    : undefined
                }
                size="small"
                label="Filter Value"
                value={condition.value}
                onChange={(e) => updateFilterCondition(condition.id, { value: (e.target as any).value })}
                sx={{ minWidth: 120, maxWidth: 200, flex: 1 }}
              />

              <IconButton size="small" onClick={() => removeFilterCondition(condition.id)} title="Remove Condition">
                <RemoveIcon />
              </IconButton>
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}
