/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from 'miroir-react';
import { type LoggerInterface, MiroirLoggerFactory } from 'miroir-core';
import { packageName } from '../../../../constants';
import { cleanLevel } from '../../constants';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "FormComponents"), "UI",
).then((logger: LoggerInterface) => {
  log = logger;
});

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

export const ThemedStackedLabeledEditor: React.FC<{
  labelElement: JSX.Element;
  editor: JSX.Element;
  className?: string;
  style?: React.CSSProperties;
}> = ({ labelElement, editor, className, style }) => {
  const { currentTheme } = useMiroirTheme();
  
  const containerStyles = css({
    display: 'flex',
    flexFlow: 'column',
    justifyContent: 'flex-start',
    // alignItems: 'stretch',
    alignItems: 'flex-start',
    flexGrow: 1,
    // gap: currentTheme.spacing.xs,
  });

  return (
    <span css={containerStyles} className={className} style={style}>
      {labelElement}
      {editor}
    </span>
  );
};

// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
// ################################################################################################
export const ThemedSelectWithPortal: React.FC<ThemedComponentProps & {
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
  filterable = false,
  options = [],
  placeholder = 'Select an option...',
  filterPlaceholder = 'Type to filter...',
  allowCustomValue = false,
  navigateWithoutOpening = false,
  ...props 
}) => {
  const { currentTheme } = useMiroirTheme();
  

    // Fall back to standard select for non-filterable or legacy usage
  const {
    id,
    labelId,
    variant,
    label,
    'data-testid': dataTestId,
    'aria-label': ariaLabel,
    role,
    title,
    ...validSelectProps
  } = props;

  // If filterable is true and options are provided, use the filterable implementation
  if (filterable && options.length > 0) {
    const componentId = Math.random().toString(36).substring(7);
    
    const [isOpen, setIsOpen] = useState(false);
    const [filterText, setFilterText] = useState('');
    const [filteredOptions, setFilteredOptions] = useState(options);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const [dropdownJustOpened, setDropdownJustOpened] = useState(false);
    const [hasFocus, setHasFocus] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const stateTrackerRef = useRef<HTMLDivElement>(null);

    // Debug: Log when isOpen changes
    useEffect(() => {
      // log.info('ThemedSelectWithPortal: [' + componentId + '] isOpen state changed to:', isOpen);
      // Update the data attribute directly on the DOM element
      if (stateTrackerRef.current) {
        stateTrackerRef.current.setAttribute('data-test-is-open', isOpen.toString());
        // log.info('ThemedSelectWithPortal: [' + componentId + '] Updated DOM attribute to:', isOpen.toString());
      }
    }, [isOpen, componentId]);

    // Helper function to update both state and DOM attribute immediately
    const setIsOpenWithDOMUpdate = (newIsOpen: boolean) => {
      setIsOpen(newIsOpen);
      // Immediately update DOM attribute for test tracking
      if (stateTrackerRef.current) {
        stateTrackerRef.current.setAttribute('data-test-is-open', newIsOpen.toString());
      }
    };

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
      setIsOpenWithDOMUpdate(true);
      setFilterText('');
      setHighlightedIndex(-1);
      setDropdownJustOpened(true);
      updateDropdownPosition();
      
      // Reset the "just opened" flag after a short delay to prevent accidental clicks
      setTimeout(() => {
        setDropdownJustOpened(false);
      }, 150);
    }, [updateDropdownPosition, setIsOpenWithDOMUpdate]);

    // Calculate the width needed to fit the longest option
    const calculateOptimalWidth = useMemo(() => {
      if (options.length === 0) return minWidth || '200px';
      
      const allTexts = [
        ...options.map(opt => opt.label),
        placeholder,
        filterPlaceholder
      ];
      
      // Simple character-based width estimation
      // This is more reliable across environments and sufficient for UI purposes
      const maxCharacters = Math.max(
        ...allTexts.map(text => (text || '').length)
      );
      
      // Estimate width: ~8px per character + padding and dropdown arrow space
      const estimatedWidth = Math.max(
        maxCharacters * 8 + 40, // 40px for padding and arrow
        parseInt(minWidth?.replace('px', '') || '200')
      );
      
      return `${estimatedWidth}px`;
    }, [options, placeholder, filterPlaceholder, minWidth]);

    // Update filtered options when filter text or options change
    useEffect(() => {
      if (!filterText.trim()) {
        setFilteredOptions(options);
        
        // Immediately update DOM attribute for test tracking
        if (stateTrackerRef.current) {
          stateTrackerRef.current.setAttribute('data-test-filtered-options-count', options.length.toString());
        }
      } else {
        const filterTextLower = filterText.toLowerCase();
        const filtered = options.filter(option =>
          option.label.toLowerCase().includes(filterTextLower) ||
          option.value.toLowerCase().includes(filterTextLower)
        );
        
        // Sort filtered options to prioritize exact matches
        filtered.sort((a, b) => {
          const aLabelExact = a.label.toLowerCase() === filterTextLower;
          const aValueExact = a.value.toLowerCase() === filterTextLower;
          const bLabelExact = b.label.toLowerCase() === filterTextLower;
          const bValueExact = b.value.toLowerCase() === filterTextLower;
          
          // Exact matches first
          if ((aLabelExact || aValueExact) && !(bLabelExact || bValueExact)) return -1;
          if (!(aLabelExact || aValueExact) && (bLabelExact || bValueExact)) return 1;
          
          // Then prioritize matches that start with the filter text
          const aLabelStarts = a.label.toLowerCase().startsWith(filterTextLower);
          const aValueStarts = a.value.toLowerCase().startsWith(filterTextLower);
          const bLabelStarts = b.label.toLowerCase().startsWith(filterTextLower);
          const bValueStarts = b.value.toLowerCase().startsWith(filterTextLower);
          
          if ((aLabelStarts || aValueStarts) && !(bLabelStarts || bValueStarts)) return -1;
          if (!(aLabelStarts || aValueStarts) && (bLabelStarts || bValueStarts)) return 1;
          
          // Default alphabetical order
          return a.label.localeCompare(b.label);
        });
        
        setFilteredOptions(filtered);
        
        // Immediately update DOM attribute for test tracking
        if (stateTrackerRef.current) {
          stateTrackerRef.current.setAttribute('data-test-filtered-options-count', filtered.length.toString());
        }
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
        // log.info('ThemedSelectWithPortal: handleClickOutside triggered, isOpen:', isOpen);
        // log.info('ThemedSelectWithPortal: containerRef.current:', !!containerRef.current);
        // log.info('ThemedSelectWithPortal: containerRef contains target:', containerRef.current?.contains(event.target as Node));
        
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          // Check if the click was on a dropdown option (which is portaled to body)
          const target = event.target as Element;
          const isDropdownOption = target.closest('[data-dropdown-option]');
          
          // log.info('ThemedSelectWithPortal: click outside detected, isDropdownOption:', !!isDropdownOption);
          
          if (!isDropdownOption) {
            // log.info('ThemedSelectWithPortal: closing dropdown due to outside click');
            setIsOpenWithDOMUpdate(false);
            setFilterText('');
            setDropdownJustOpened(false);
          }
        }
      };

      if (isOpen) {
        // log.info('ThemedSelectWithPortal: adding mousedown listener');
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          // log.info('ThemedSelectWithPortal: removing mousedown listener');
          document.removeEventListener('mousedown', handleClickOutside);
        };
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

    // Handle input text changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newFilterText = e.target.value;
      setFilterText(newFilterText);
      
      // If the dropdown isn't open, open it
      if (!isOpen) {
        setIsOpen(true);
        updateDropdownPosition();
      }
      
      // Reset highlighted index when filter changes
      setHighlightedIndex(-1);
    };

    // Handle input focus
    const handleInputFocus = () => {
      setHasFocus(true);
      if (!isOpen) {
        openDropdown();
        // Select all text if there's a current value to make it easy to replace
        if (inputRef.current && displayText) {
          setTimeout(() => {
            inputRef.current?.select();
          }, 0);
        }
      }
    };

    // Handle input blur
    const handleInputBlur = () => {
      setHasFocus(false);
    };

    // Handle input click
    const handleInputClick = () => {
      // log.info('ThemedSelectWithPortal: [' + componentId + '] handleInputClick called, isOpen:', isOpen);
      if (!isOpen) {
        // log.info('ThemedSelectWithPortal: [' + componentId + '] calling openDropdown()');
        openDropdown();
        // Select all text if there's a current value to make it easy to replace
        if (inputRef.current && displayText) {
          setTimeout(() => {
            inputRef.current?.select();
          }, 0);
        }
      }
    };

    // Get display text for selected value
    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption ? selectedOption.label : value || '';

    const handleOptionClick = (optionValue: string, event?: React.MouseEvent) => {
      // Prevent accidental clicks right after dropdown opens
      if (dropdownJustOpened) {
        return;
      }
      
      if (onChange) {
        const syntheticEvent = {
          target: { value: optionValue },
          currentTarget: { value: optionValue }
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
      
      // Immediately update DOM attribute for test tracking
      if (stateTrackerRef.current) {
        stateTrackerRef.current.setAttribute('data-test-selected-value', optionValue);
      }
      
      setIsOpenWithDOMUpdate(false);
      setFilterText('');
      setHighlightedIndex(-1);
      setDropdownJustOpened(false);
    };

    const handleInputKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (event.key === "Enter") {
          event.preventDefault();

          // Force recalculate filtered options based on current filterText to ensure we have the latest
          let actualFilteredOptions = filteredOptions;
          if (filterText.trim()) {
            const filterTextLower = filterText.toLowerCase();
            const recalculatedFiltered = options.filter(
              (option) =>
                option.label.toLowerCase().includes(filterTextLower) ||
                option.value.toLowerCase().includes(filterTextLower),
            );
            actualFilteredOptions = recalculatedFiltered;
          }

          let selectedValue: string | undefined;

          if (highlightedIndex >= 0 && highlightedIndex < actualFilteredOptions.length) {
            // Select the highlighted option
            selectedValue = actualFilteredOptions[highlightedIndex].value;
          } else if (actualFilteredOptions.length > 0) {
            // Select the first option if nothing is highlighted
            selectedValue = actualFilteredOptions[0].value;
          } else if (allowCustomValue && filterText.trim()) {
            selectedValue = filterText.trim();
          }

          // If we have a value to select, do the selection bypassing dropdownJustOpened check
          if (selectedValue !== undefined) {
            if (onChange) {
              const syntheticEvent = {
                target: { value: selectedValue },
                currentTarget: { value: selectedValue },
              } as React.ChangeEvent<HTMLSelectElement>;
              onChange(syntheticEvent);
            }

            // Immediately update DOM attribute for test tracking
            if (stateTrackerRef.current) {
              stateTrackerRef.current.setAttribute("data-test-selected-value", selectedValue);
            }

            setIsOpenWithDOMUpdate(false);
            setFilterText("");
            setHighlightedIndex(-1);
            setDropdownJustOpened(false);
          }
        } else if (event.key === "Escape") {
          setIsOpenWithDOMUpdate(false);
          setFilterText("");
          setHighlightedIndex(-1);
          setDropdownJustOpened(false);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          if (!isOpen) {
            if (navigateWithoutOpening) {
              // Navigate through options without opening dropdown
              const currentIndex = filteredOptions.findIndex((opt) => opt.value === value);
              const nextIndex = currentIndex < filteredOptions.length - 1 ? currentIndex + 1 : 0;
              if (filteredOptions[nextIndex]) {
                handleOptionClick(filteredOptions[nextIndex].value);
              }
            } else {
              openDropdown();
            }
          } else {
            // Navigate down in the options list
            const nextIndex =
              highlightedIndex < filteredOptions.length - 1 ? highlightedIndex + 1 : 0;
            setHighlightedIndex(nextIndex);
          }
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          if (isOpen) {
            // Navigate up in the options list
            const prevIndex =
              highlightedIndex > 0 ? highlightedIndex - 1 : filteredOptions.length - 1;
            setHighlightedIndex(prevIndex);
          } else {
            if (navigateWithoutOpening) {
              // Navigate through options without opening dropdown
              const currentIndex = filteredOptions.findIndex((opt) => opt.value === value);
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
        } else if (event.key === "Backspace" || event.key === "Delete") {
          // Allow editing by opening dropdown when user tries to delete
          if (!isOpen) {
            setIsOpen(true);
            setFilterText("");
            updateDropdownPosition();
          }
        } else if (event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
          // User is typing a character - open dropdown and start filtering
          if (!isOpen) {
            setIsOpen(true);
            setFilterText(event.key);
            setHighlightedIndex(-1);
            updateDropdownPosition();
            event.preventDefault(); // Prevent double character
          }
        }
      },
      [
        highlightedIndex,
        filteredOptions,
        handleOptionClick,
        allowCustomValue,
        filterText,
        isOpen,
        navigateWithoutOpening,
        value,
        openDropdown,
        setIsOpenWithDOMUpdate,
        updateDropdownPosition,
        options,
      ],
    );

    // position: relative;
    // display: inline-block;
    const containerStyles = css`
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
      
      background-color: ${currentTheme.colors.background} !important;
      background: ${currentTheme.colors.background} !important;
      color: ${currentTheme.colors.text} !important;
      
      border: 1px solid ${currentTheme.colors.border} !important;
      border-radius: ${currentTheme.borderRadius.sm};
      padding: ${currentTheme.spacing.sm};
      
      font-family: ${currentTheme.typography.fontFamily};
      font-size: ${currentTheme.typography.fontSize.md};
      font-weight: normal;
      line-height: 1.4;
      
      cursor: pointer;
      user-select: text;
      
      &:focus {
        border-color: ${currentTheme.colors.primary} !important;
        outline: none !important;
        box-shadow: 0 0 0 2px ${currentTheme.colors.primary}20 !important;
        cursor: text;
      }
      
      &:hover {
        background-color: ${currentTheme.colors.hover || currentTheme.colors.surfaceVariant} !important;
      }
      
      &::selection {
        background-color: ${currentTheme.colors.primary}40;
        color: ${currentTheme.colors.text};
      }
    `;

    const dropdownStyles = css`
      position: fixed;
      z-index: 99999;
      max-height: 200px;
      overflow-y: auto;
      background: ${currentTheme.colors.background};
      border: 1px solid ${currentTheme.colors.border};
      border-radius: ${currentTheme.borderRadius.sm};
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      
      min-width: ${dropdownPosition.width}px;
      width: max-content;
      max-width: 400px;
      
      top: ${dropdownPosition.top}px;
      left: ${dropdownPosition.left}px;
    `;

    // const optionStyles = css`
    //   padding: ${currentTheme.spacing.sm};
    //   cursor: pointer;
    //   font-family: ${currentTheme.typography.fontFamily};
    //   font-size: ${currentTheme.typography.fontSize.md};
    //   color: ${currentTheme.colors.text};
    //   white-space: nowrap;
      
    //   &:hover {
    //     background-color: ${currentTheme.colors.hover || currentTheme.colors.surfaceVariant};
    //   }
      
    //   &:active {
    //     background-color: ${currentTheme.colors.selected || currentTheme.colors.primary};
    //     color: ${currentTheme.colors.background};
    //   }
    // `;

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
          id={id}
          data-testid={dataTestId}
          aria-label={ariaLabel}
          ref={inputRef}
          css={inputStyles}
          type="text"
          role="combobox"
          value={isOpen ? filterText : displayText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onClick={handleInputClick}
          onKeyDown={handleInputKeyDown}
          placeholder={isOpen ? filterPlaceholder : placeholder}
          autoComplete="off"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          {...props}
        />
        
        {/* Hidden element for test state tracking */}
        <div
          ref={stateTrackerRef}
          data-testid={`themed-select-state-${props.name || 'unnamed'}`}
          data-test-is-open={isOpen.toString()}
          data-test-dropdown-just-opened={dropdownJustOpened}
          data-test-has-focus={hasFocus}
          data-test-highlighted-index={highlightedIndex}
          data-test-filter-text={filterText}
          data-test-selected-value={value}
          data-test-filtered-options-count={filteredOptions.length}
          style={{ display: 'none', visibility: 'hidden' }}
          aria-hidden="true"
        >
          TEST_TRACKER_PRESENT_isOpen_{isOpen.toString()}_componentId_{componentId}
        </div>
        
        {isOpen && createPortal(
          <div ref={dropdownRef} css={dropdownStyles}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  css={getOptionStyles(index === highlightedIndex)}
                  aria-label={props.name + '-option-' + option.value}
                  data-dropdown-option="true"
                  role="option"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOptionClick(option.value, e);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleOptionClick(option.value, e);
                  }}
                  onMouseEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setHighlightedIndex(index);
                  }}
                  onMouseLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
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
    // padding: ${currentTheme.spacing.sm};
    
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

// ################################################################################################
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
