import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box, 
  Typography,
  Chip,
  SelectChangeEvent 
} from '@mui/material';
import { Palette, DarkMode, CompressOutlined, Style } from '@mui/icons-material';
import { useTableTheme, TableThemeOption } from '../contexts/TableThemeContext.js';
import { useMiroirTheme } from '../contexts/MiroirThemeContext.js';
import { TableTheme } from 'miroir-core';

interface TableThemeSelectorProps {
  size?: 'small' | 'medium';
  showDescription?: boolean;
  label?: string;
  variant?: 'outlined' | 'filled' | 'standard';
}

// Icon mapping for different themes
const getThemeIcon = (themeId: string) => {
  switch (themeId) {
    case 'dark':
      return <DarkMode fontSize="small" />;
    case 'compact':
      return <CompressOutlined fontSize="small" />;
    case 'material':
      return <Style fontSize="small" />;
    default:
      return <Palette fontSize="small" />;
  }
};

// Color indicator for theme preview
const getThemeColorIndicator = (themeOption: TableThemeOption) => {
  const theme = themeOption.theme;
  return (
    <Box
      sx={{
        width: 16,
        height: 16,
        borderRadius: '2px',
        background: `linear-gradient(45deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
        border: `1px solid ${theme.colors.border}`,
        marginRight: 1,
        flexShrink: 0,
      }}
    />
  );
};

export const TableThemeSelector: React.FC<TableThemeSelectorProps> = ({
  size = 'small',
  showDescription = true,
  label = 'Table Theme',
  variant = 'outlined',
}) => {
  const { 
    currentThemeId, 
    currentThemeOption, 
    selectTheme, 
    availableThemes 
  } = useTableTheme();
  
  const miroirTheme = useMiroirTheme();

  const handleThemeChange = (event: SelectChangeEvent<string>) => {
    selectTheme(event.target.value as TableTheme);
  };

  return (
    <Box sx={{ minWidth: 200 }}>
      <FormControl 
        size={size} 
        variant={variant} 
        fullWidth
        sx={{
          '& .MuiInputLabel-root': {
            color: miroirTheme.currentTheme.components.appBar.textColor,
          },
          '& .MuiOutlinedInput-root': {
            color: miroirTheme.currentTheme.components.appBar.textColor,
            '& fieldset': {
              borderColor: miroirTheme.currentTheme.components.appBar.textColor,
            },
            '&:hover fieldset': {
              borderColor: miroirTheme.currentTheme.components.appBar.textColor,
            },
            '&.Mui-focused fieldset': {
              borderColor: miroirTheme.currentTheme.components.appBar.textColor,
            },
          },
          '& .MuiSelect-icon': {
            color: miroirTheme.currentTheme.components.appBar.textColor,
          },
        }}
      >
        <InputLabel id="table-theme-selector-label">{label}</InputLabel>
        <Select
          labelId="table-theme-selector-label"
          id="table-theme-selector"
          value={currentThemeId}
          label={label}
          onChange={handleThemeChange}
          sx={{
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
              color: miroirTheme.currentTheme.components.appBar.textColor,
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                backgroundColor: miroirTheme.currentTheme.colors.surface,
                color: miroirTheme.currentTheme.colors.text,
              }
            }
          }}
        >
          {availableThemes.map((themeOption) => (
            <MenuItem 
              key={themeOption.id} 
              value={themeOption.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 48,
                color: miroirTheme.currentTheme.colors.text,
                '&:hover': {
                  backgroundColor: miroirTheme.currentTheme.colors.hover,
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                {getThemeColorIndicator(themeOption)}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getThemeIcon(themeOption.id)}
                  <Typography 
                    variant="body2" 
                    component="span"
                    sx={{ color: miroirTheme.currentTheme.colors.text }}
                  >
                    {themeOption.name}
                  </Typography>
                </Box>
              </Box>
              {currentThemeId === themeOption.id && (
                <Chip 
                  label="Active" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                  sx={{ ml: 1 }}
                />
              )}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      {showDescription && currentThemeOption && (
        <Typography 
          variant="caption" 
          sx={{ 
            display: 'block', 
            mt: 0.5,
            fontSize: '0.75rem',
            lineHeight: 1.2,
            color: miroirTheme.currentTheme.components.appBar.textColor,
          }}
        >
          {currentThemeOption.description}
        </Typography>
      )}
    </Box>
  );
};
