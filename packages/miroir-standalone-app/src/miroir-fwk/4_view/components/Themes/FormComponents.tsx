/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from './BaseTypes';

// ################################################################################################
// Form-related Themed Components
// 
// Components for forms: inputs, selects, switches, etc.
// ################################################################################################

export const ThemedLabeledEditor: React.FC<{
  labelElement: JSX.Element;
  editor: JSX.Element;
  className?: string;
  style?: React.CSSProperties;
}> = ({ labelElement, editor, className, style }) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyles = css({
    display: 'flex',
    flexFlow: 'row',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    flexGrow: 1,
    gap: currentTheme.spacing.sm,
  });

  return (
    <span css={containerStyles} className={className} style={style}>
      {labelElement}
      {editor}
    </span>
  );
};

export const ThemedSelect: React.FC<ThemedComponentProps & {
  minWidth?: string;
  maxWidth?: string;
  width?: string;
  filterable?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  filterPlaceholder?: string;
  allowCustomValue?: boolean;
  navigateWithoutOpening?: boolean;
}> = ({ 
  children, 
  className, 
  style,
  value,
  onChange,
  minWidth,
  maxWidth,
  width,
  filterable = true,
  options = [],
  placeholder = 'Select an option...',
  filterPlaceholder = 'Type to filter...',
  allowCustomValue = false,
  navigateWithoutOpening = false,
  ...props 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  // If filterable is true and options are provided, use the filterable implementation
  if (filterable && options.length > 0) {
    const [isOpen, setIsOpen] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Calculate dropdown position when opening
    const updateDropdownPosition = useCallback(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom,
          left: rect.left,
          width: rect.width
        });
      }
    }, []);

    // Open dropdown and calculate position
    const openDropdown = useCallback(() => {
      setIsOpen(true);
      setFilterText('');
      setHighlightedIndex(-1);
      updateDropdownPosition();
    }, [updateDropdownPosition]);

    // Calculate the width needed to fit the longest option
    const calculateOptimalWidth = useMemo(() => {
      if (options.length === 0) return minWidth || '200px';
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) return minWidth || '200px';
      
      context.font = `${currentTheme.typography.fontSize.md} ${currentTheme.typography.fontFamily}`;
      
      const allTexts = [
        ...options.map(opt => opt.label),
        placeholder,
        filterPlaceholder
      ];
      
      const maxWidth = Math.max(
        ...allTexts.map(text => context.measureText(text || '').width)
      );
      
      const calculatedWidth = Math.max(
        maxWidth + 40, // 40px for padding and arrow
        parseInt(minWidth?.replace('px', '') || '200')
      );
      
      return `${calculatedWidth}px`;
    }, [options, placeholder, filterPlaceholder, minWidth, currentTheme]);

    // Update filtered options when filter text or options change
    useEffect(() => {
      if (!filterText.trim()) {
        setFilteredOptions(options);
      } else {
        const filtered = options.filter(option =>
          option.label.toLowerCase().includes(filterText.toLowerCase()) ||
          option.value.toLowerCase().includes(filterText.toLowerCase())
        );
        setFilteredOptions(filtered);
      }
      // Reset highlighted index when options change
      setHighlightedIndex(-1);
    }, [filterText, options]);

    // Scroll highlighted option into view
    useEffect(() => {
      if (highlightedIndex >= 0 && dropdownRef.current) {
        const optionElements = dropdownRef.current.querySelectorAll('[data-dropdown-option="true"]');
        const highlightedElement = optionElements[highlightedIndex] as HTMLElement;
        if (highlightedElement) {
          highlightedElement.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth'
          });
        }
      }
    }, [highlightedIndex]);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          // Check if the click was on a dropdown option (which is portaled to body)
          const target = event.target as Element;
          const isDropdownOption = target.closest('[data-dropdown-option]');
          
          if (!isDropdownOption) {
            setIsOpen(false);
            setFilterText('');
          }
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    // Update position when dropdown opens
    useEffect(() => {
      if (isOpen) {
        updateDropdownPosition();
      }
    }, [isOpen, updateDropdownPosition]);

    // Update dropdown position on scroll/resize
    useEffect(() => {
      if (isOpen) {
        const handlePositionUpdate = () => {
          updateDropdownPosition();
        };
        
        document.addEventListener('scroll', handlePositionUpdate, true);
        window.addEventListener('scroll', handlePositionUpdate, true);
        window.addEventListener('resize', handlePositionUpdate);
        
        return () => {
          document.removeEventListener('scroll', handlePositionUpdate, true);
          window.removeEventListener('scroll', handlePositionUpdate, true);
          window.removeEventListener('resize', handlePositionUpdate);
        };
      }
    }, [isOpen, updateDropdownPosition]);

    // Get display text for selected value
    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption ? selectedOption.label : value || '';

    const handleOptionClick = (optionValue: string, event?: React.MouseEvent) => {
      // console.log('ThemedSelect: Option clicked:', optionValue, event?.type);
      
      if (onChange) {
        // console.log('ThemedSelect: Calling onChange with value:', optionValue);
        const syntheticEvent = {
          target: { value: optionValue },
          currentTarget: { value: optionValue }
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
      setIsOpen(false);
      setFilterText('');
      setHighlightedIndex(-1);
    };

    const handleInputKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          // Select the highlighted option
          handleOptionClick(filteredOptions[highlightedIndex].value);
        } else if (filteredOptions.length > 0) {
          // Select the first option if nothing is highlighted
          handleOptionClick(filteredOptions[0].value);
        } else if (allowCustomValue && filterText.trim()) {
          handleOptionClick(filterText.trim());
        }
      } else if (event.key === 'Escape') {
        setIsOpen(false);
        setFilterText('');
        setHighlightedIndex(-1);
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (!isOpen) {
          if (navigateWithoutOpening) {
            // Navigate through options without opening dropdown
            const currentIndex = filteredOptions.findIndex(opt => opt.value === value);
            const nextIndex = currentIndex < filteredOptions.length - 1 ? currentIndex + 1 : 0;
            if (filteredOptions[nextIndex]) {
              handleOptionClick(filteredOptions[nextIndex].value);
            }
          } else {
            openDropdown();
          }
        } else {
          // Navigate down in the options list
          const nextIndex = highlightedIndex < filteredOptions.length - 1 ? highlightedIndex + 1 : 0;
          setHighlightedIndex(nextIndex);
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (isOpen) {
          // Navigate up in the options list
          const prevIndex = highlightedIndex > 0 ? highlightedIndex - 1 : filteredOptions.length - 1;
          setHighlightedIndex(prevIndex);
        } else {
          if (navigateWithoutOpening) {
            // Navigate through options without opening dropdown
            const currentIndex = filteredOptions.findIndex(opt => opt.value === value);
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredOptions.length - 1;
            if (filteredOptions[prevIndex]) {
              handleOptionClick(filteredOptions[prevIndex].value);
            }
          } else {
            // If closed, open the dropdown and will highlight the last option
            openDropdown();
            setTimeout(() => setHighlightedIndex(filteredOptions.length - 1), 0);
          }
        }
      }
    };

    const containerStyles = css`
      position: relative;
      display: inline-block;
      min-width: ${minWidth || calculateOptimalWidth};
      max-width: ${maxWidth || 'none'};
      width: ${width || calculateOptimalWidth};
    `;

    const inputStyles = css`
      min-height: 2.2em;
      max-height: 2.5em;
      height: auto;
      width: 100%;
      box-sizing: border-box;
      
      background-color: ${currentTheme.colors.surface} !important;
      background: ${currentTheme.colors.surface} !important;
      color: ${currentTheme.colors.text} !important;
      
      border: 1px solid ${currentTheme.colors.border} !important;
      border-radius: ${currentTheme.borderRadius.sm};
      padding: ${currentTheme.spacing.sm};
      
      font-family: ${currentTheme.typography.fontFamily};
      font-size: ${currentTheme.typography.fontSize.md};
      font-weight: normal;
      line-height: 1.4;
      
      cursor: pointer;
      
      &:focus {
        border-color: ${currentTheme.colors.primary} !important;
        outline: none !important;
        box-shadow: 0 0 0 2px ${currentTheme.colors.primary}20 !important;
      }
      
      &:hover {
        background-color: ${currentTheme.colors.hover || currentTheme.colors.surfaceVariant} !important;
      }
    `;

    const dropdownStyles = css`
      position: fixed;
      z-index: 99999;
      max-height: 200px;
      overflow-y: auto;
      background: ${currentTheme.colors.surface};
      border: 1px solid ${currentTheme.colors.border};
      border-radius: ${currentTheme.borderRadius.sm};
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      
      min-width: ${dropdownPosition.width}px;
      width: max-content;
      max-width: 400px;
      
      top: ${dropdownPosition.top}px;
      left: ${dropdownPosition.left}px;
    `;

    const optionStyles = css`
      padding: ${currentTheme.spacing.sm};
      cursor: pointer;
      font-family: ${currentTheme.typography.fontFamily};
      font-size: ${currentTheme.typography.fontSize.md};
      color: ${currentTheme.colors.text};
      white-space: nowrap;
      
      &:hover {
        background-color: ${currentTheme.colors.hover || currentTheme.colors.surfaceVariant};
      }
      
      &:active {
        background-color: ${currentTheme.colors.selected || currentTheme.colors.primary};
        color: ${currentTheme.colors.background};
      }
    `;

    const getOptionStyles = (isHighlighted: boolean) => css`
      padding: ${currentTheme.spacing.sm};
      cursor: pointer;
      font-family: ${currentTheme.typography.fontFamily};
      font-size: ${currentTheme.typography.fontSize.md};
      color: ${currentTheme.colors.text};
      white-space: nowrap;
      background-color: ${isHighlighted ? (currentTheme.colors.hover || currentTheme.colors.surfaceVariant) : 'transparent'};
      
      &:hover {
        background-color: ${currentTheme.colors.hover || currentTheme.colors.surfaceVariant};
      }
      
      &:active {
        background-color: ${currentTheme.colors.selected || currentTheme.colors.primary};
        color: ${currentTheme.colors.background};
      }
    `;

    const noResultsStyles = css`
      padding: ${currentTheme.spacing.sm};
      color: ${currentTheme.colors.textSecondary || currentTheme.colors.text};
      font-style: italic;
      text-align: center;
      white-space: nowrap;
    `;

    return (
      <div ref={containerRef} css={containerStyles} className={className} style={style}>
        <input
          ref={inputRef}
          css={inputStyles}
          type="text"
          value={isOpen ? filterText : displayText}
          onChange={(e) => setFilterText(e.target.value)}
          onFocus={openDropdown}
          onKeyDown={handleInputKeyDown}
          placeholder={isOpen ? filterPlaceholder : placeholder}
          autoComplete="off"
          {...props}
        />
        
        {isOpen && createPortal(
          <div ref={dropdownRef} css={dropdownStyles}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  css={getOptionStyles(index === highlightedIndex)}
                  data-dropdown-option="true"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOptionClick(option.value, e);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div css={noResultsStyles}>
                {allowCustomValue && filterText.trim() 
                  ? `Press Enter to use "${filterText}"`
                  : 'No matching options'
                }
              </div>
            )}
          </div>,
          document.body
        )}
      </div>
    );
  }

  // Fall back to standard select for non-filterable or legacy usage
  const {
    labelId,
    variant,
    label,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
    role,
    title,
    ...validSelectProps
  } = props;
  
  const selectStyles = css`
    min-height: 2.2em;
    max-height: 2.5em;
    height: auto;
    min-width: ${minWidth || 'auto'};
    max-width: ${maxWidth || 'auto'};
    width: ${width || 'auto'};
    
    background-color: ${currentTheme.colors.surface} !important;
    background: ${currentTheme.colors.surface} !important;
    color: ${currentTheme.colors.text} !important;
    
    border: 1px solid ${currentTheme.colors.border} !important;
    border-radius: ${currentTheme.borderRadius.sm};
    padding: ${currentTheme.spacing.sm};
    
    font-family: ${currentTheme.typography.fontFamily};
    font-size: ${currentTheme.typography.fontSize.md};
    font-weight: normal;
    line-height: 1.4;
    
    appearance: auto;
    -webkit-appearance: menulist;
    -moz-appearance: menulist;
    
    &:focus {
      border-color: ${currentTheme.colors.primary} !important;
      outline: none !important;
      box-shadow: 0 0 0 2px ${currentTheme.colors.primary}20 !important;
    }
    
    &:hover {
      background-color: ${currentTheme.colors.hover || currentTheme.colors.surfaceVariant} !important;
    }
    
    & option {
      background-color: ${currentTheme.colors.surface} !important;
      color: ${currentTheme.colors.text} !important;
      padding: ${currentTheme.spacing.sm};
    }
  `;

  return (
    <select 
      css={selectStyles} 
      className={className} 
      style={style} 
      value={value} 
      onChange={onChange} 
      data-testid={dataTestId}
      aria-label={ariaLabel}
      role={role}
      title={title}
      {...validSelectProps}
    >
      {children}
    </select>
  );
};

export const ThemedEditableInput: React.FC<ThemedComponentProps & {
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  'aria-label'?: string;
  minWidth?: number;
  dynamicWidth?: boolean;
}> = ({ 
  value = '',
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  name,
  'aria-label': ariaLabel,
  minWidth = 60,
  dynamicWidth = true,
  className,
  style
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const inputStyles = css({
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.sm,
    padding: `${currentTheme.spacing.xs} ${currentTheme.spacing.sm}`,
    fontSize: 'inherit',
    fontFamily: 'inherit',
    backgroundColor: currentTheme.colors.surface,
    color: currentTheme.colors.text,
    minWidth: `${minWidth}px`,
    width: dynamicWidth ? `${Math.max(minWidth, value.length * 8 + 16)}px` : 'auto',
    '&:focus': {
      outline: 'none',
      borderColor: currentTheme.colors.primary,
      boxShadow: `0 0 0 2px ${currentTheme.colors.primary}20`,
    },
  });

  return (
    <input
      css={inputStyles}
      className={className}
      style={style}
      name={name}
      aria-label={ariaLabel}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  );
};
