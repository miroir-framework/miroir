import React, { useState, useCallback, useMemo } from 'react';
import { Toc } from '@mui/icons-material';
import { InstanceEditorOutline } from '../InstanceEditorOutline.js';
import { JzodElementEditor } from './JzodElementEditor.js';
import { JzodElementEditorProps } from './JzodElementEditorInterface.js';
import { 
  ThemedBox,
  ThemedTooltip,
  ThemedSmallIconButton
} from "../Themes/index"
import { useMiroirTheme } from '../../contexts/MiroirThemeContext.js';

export interface JzodElementEditorWithOutlineProps extends JzodElementEditorProps {
  showOutlineToggle?: boolean;
  outlineTitle?: string;
  data?: any; // The data to show in the outline
  customHeaderElements?: JSX.Element; // Additional elements to show in the header
  // External control props
  externalOutlineOpen?: boolean;
  onExternalOutlineToggle?: () => void;
}

export const JzodElementEditorWithOutline: React.FC<JzodElementEditorWithOutlineProps> = ({
  showOutlineToggle = true,
  outlineTitle = "Document Structure",
  data,
  customHeaderElements,
  externalOutlineOpen,
  onExternalOutlineToggle,
  ...editorProps
}) => {
  const { currentTheme } = useMiroirTheme();
  const [internalOutlineOpen, setInternalOutlineOpen] = useState(false);
  
  // Use external control if provided, otherwise use internal state
  const isOutlineOpen = externalOutlineOpen !== undefined ? externalOutlineOpen : internalOutlineOpen;
  const handleToggleOutline = onExternalOutlineToggle || (() => setInternalOutlineOpen(prev => !prev));

  const handleNavigateToPath = useCallback((path: string[]) => {
    // Convert the path array to a rootLessListKey
    const rootLessListKey = path.join('.');
    
    console.log('Attempting to navigate to path:', path, 'rootLessListKey:', rootLessListKey);
    
    // Find the element with the corresponding ID
    let targetElement = document.getElementById(rootLessListKey);
    
    // If not found, try alternative selector strategies
    if (!targetElement) {
      // Try finding by data-testid attribute
      targetElement = document.querySelector(`[data-testid="miroirInput"][id="${rootLessListKey}"]`);
    }
    
    // Try to find the containing element if the direct element is not found
    if (!targetElement) {
      // Look for any element with an id containing the rootLessListKey
      const elements = document.querySelectorAll(`[id*="${rootLessListKey}"]`);
      if (elements.length > 0) {
        targetElement = elements[0] as HTMLElement;
      }
    }
    
    if (targetElement) {
      console.log('Found target element:', targetElement);
      
      // Scroll the element into view with smooth behavior
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
      
      // Optional: Add a temporary highlight effect
      const originalBackgroundColor = targetElement.style.backgroundColor;
      const originalBorder = targetElement.style.border;
      const originalBorderRadius = targetElement.style.borderRadius;
      
      targetElement.style.backgroundColor = currentTheme.colors.warningLight;
      targetElement.style.border = `2px solid ${currentTheme.colors.warning}`;
      targetElement.style.borderRadius = '4px';
      targetElement.style.transition = 'all 0.3s ease';
      
      // Remove the highlight after 2 seconds
      setTimeout(() => {
        targetElement!.style.backgroundColor = originalBackgroundColor;
        targetElement!.style.border = originalBorder;
        targetElement!.style.borderRadius = originalBorderRadius;
        targetElement!.style.transition = '';
      }, 2000);
    } else {
      console.warn('Element not found for path:', path, 'rootLessListKey:', rootLessListKey);
      
      // List all elements with IDs to help with debugging
      const allElementsWithIds = document.querySelectorAll('[id]');
      const ids = Array.from(allElementsWithIds).map(el => el.id).filter(id => id);
      console.log('Available element IDs:', ids.slice(0, 20)); // Show first 20 for brevity
    }
  }, []);

  return (
    <ThemedBox display="flex" position="relative" width="100%">
      {/* Main Editor Content */}
      <ThemedBox 
        flexGrow={1}
        marginRight={isOutlineOpen ? 0 : 0}
        transition="margin-right 0.3s"
        width="100%"
      >
        {/* Use JzodElementEditorWithEnhancedHeader that includes outline button in the header */}
        <JzodElementEditorWithEnhancedHeader
          {...editorProps}
          isOutlineOpen={isOutlineOpen}
          onToggleOutline={handleToggleOutline}
          showOutlineToggle={showOutlineToggle && editorProps.rootLessListKey === "" && !!data}
        />
      </ThemedBox>
      
      {/* Document Outline Sidebar - moved to the right */}
      {data && (
        <InstanceEditorOutline
          isOpen={isOutlineOpen}
          onToggle={handleToggleOutline}
          data={data}
          onNavigate={handleNavigateToPath}
          title={outlineTitle}
        />
      )}
    </ThemedBox>
  );
};

// Component that extends JzodElementEditor to add the outline button to the existing header switch
const JzodElementEditorWithEnhancedHeader: React.FC<JzodElementEditorProps & {
  isOutlineOpen: boolean;
  onToggleOutline: () => void;
  showOutlineToggle: boolean;
}> = ({ isOutlineOpen, onToggleOutline, showOutlineToggle, ...editorProps }) => {
  
  // Create a custom JzodElementEditor that renders with our enhanced header
  // This is a simplified wrapper approach
  return (
    <JzodElementEditorWithCustomHeader
      {...editorProps}
      outlineButton={showOutlineToggle ? (
        <ThemedTooltip title={isOutlineOpen ? "Hide Document Outline" : "Show Document Outline"}>
          <ThemedSmallIconButton
            onClick={onToggleOutline}
          >
            <Toc />
          </ThemedSmallIconButton>
        </ThemedTooltip>
      ) : undefined}
    />
  );
};

// This is a temporary simplified approach
// In a real implementation, we would copy the JzodElementEditor logic and modify the displayAsStructuredElementSwitch
const JzodElementEditorWithCustomHeader: React.FC<JzodElementEditorProps & {
  outlineButton?: JSX.Element;
}> = ({ outlineButton, ...props }) => {
  // For now, we'll render the outline button above the editor 
  // TODO: Properly integrate into the editor's header
  return (
    <div>
      {outlineButton && (
        <ThemedBox display="flex" justifyContent="flex-end" marginBottom="8px">
          {outlineButton}
        </ThemedBox>
      )}
      <JzodElementEditor {...props} />
    </div>
  );
};

export default JzodElementEditorWithOutline;
