import React from 'react';
import ReactDOM from 'react-dom/client';
// import { ThemedIcon } from './src/miroir-fwk/4_view/components/Themes/IconComponents';
// import { MiroirThemeProvider } from './src/miroir-fwk/4_view/contexts/MiroirThemeContext';
// import { defaultMiroirTheme } from './src/miroir-fwk/4_view/components/Themes/defaults';
import { ThemedIcon } from './miroir-fwk/4_view/components/Themes';
import { MiroirThemeProvider } from './miroir-fwk/4_view/contexts/MiroirThemeContext';
import { defaultMiroirTheme } from './miroir-fwk/4_view/components/Themes/MiroirTheme';

// Simple test component to verify MUI icons are working
const IconTest = () => {
  return (
    // <MiroirThemeProvider theme={defaultMiroirTheme}>
    <MiroirThemeProvider currentThemeId='default'>
      <div style={{ padding: '20px', display: 'flex', gap: '10px', flexDirection: 'column' }}>
        <h2>MUI Icon Test</h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>String icons:</span>
          <ThemedIcon icon="home" />
          <ThemedIcon icon="menu" />
          <ThemedIcon icon="settings" />
          <ThemedIcon icon="book" />
          <ThemedIcon icon="auto_stories" />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>Object icons:</span>
          <ThemedIcon icon={{ iconType: 'mui', name: 'saved_search' }} />
          <ThemedIcon icon={{ iconType: 'mui', name: 'home' }} />
          <ThemedIcon icon={{ iconType: 'mui', name: 'error' }} />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>Emoji icons:</span>
          <ThemedIcon icon={{ iconType: 'emoji', name: 'smile' }} />
          <ThemedIcon icon={{ iconType: 'emoji', name: 'book' }} />
          <ThemedIcon icon={{ iconType: 'emoji', name: 'heart' }} />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>Sizes:</span>
          <ThemedIcon icon="home" size="sm" />
          <ThemedIcon icon="home" size="md" />
          <ThemedIcon icon="home" size="lg" />
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>Unknown icon (should show fallback):</span>
          <ThemedIcon icon="unknown_icon_name" />
        </div>
      </div>
    </MiroirThemeProvider>
  );
};

export default IconTest;