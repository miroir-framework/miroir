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
import { useMiroirTheme, MiroirThemeOption } from '../contexts/MiroirThemeContext.js';
import { AppTheme } from 'miroir-core';

interface MiroirThemeSelectorProps {
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
const getThemeColorIndicator = (themeOption: MiroirThemeOption) => {
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

export const MiroirThemeSelector: React.FC<MiroirThemeSelectorProps> = ({
  size = 'small',
  showDescription = true,
  label = 'App Theme',
  variant = 'outlined',
}) => {
  const { 
    currentThemeId, 
    currentThemeOption, 
    selectTheme, 
    availableThemes 
  } = useMiroirTheme();

  const handleThemeChange = (event: SelectChangeEvent<string>) => {
    selectTheme(event.target.value as AppTheme);
  };

  return (
    <Box sx={{ minWidth: 200 }}>
      <FormControl size={size} variant={variant} fullWidth>
        <InputLabel id="miroir-theme-selector-label">{label}</InputLabel>
        <Select
          labelId="miroir-theme-selector-label"
          id="miroir-theme-selector"
          value={currentThemeId}
          label={label}
          onChange={handleThemeChange}
          sx={{
            '& .MuiSelect-select': {
              display: 'flex',
              alignItems: 'center',
            },
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
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                {getThemeColorIndicator(themeOption)}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getThemeIcon(themeOption.id)}
                  <Typography variant="body2" component="span">
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
          color="text.secondary" 
          sx={{ 
            display: 'block', 
            mt: 0.5,
            fontSize: '0.75rem',
            lineHeight: 1.2,
          }}
        >
          {currentThemeOption.description}
        </Typography>
      )}
    </Box>
  );
};
