/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React, { useMemo } from 'react';

// Material-UI Icons
import { 
  Add as AddIcon,
  AccountBalance,
  Folder,
  SpaceDashboard,
  Book as BookIcon,
  AutoStories as AutoStoriesIcon,
  Category as CategoryIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Error as ErrorIcon,
  Flag,
  HelpOutline as HelpOutlineIcon,
  Home as HomeIcon,
  Interests as InterestsIcon,
  List as ListIcon,
  LocationOn as LocationOnIcon,
  Menu as MenuIcon,
  MenuBook as MenuBookIcon,
  Person,
  Remove as RemoveIcon,
  Save as SaveIcon,
  SavedSearch as SavedSearchIcon,
  Science,
  Search as SearchIcon,
  Settings as SettingsIcon,
  South as SouthIcon,
  Star as StarIcon,
} from '@mui/icons-material';

import { MiroirIcon, MiroirLoggerFactory, type LoggerInterface } from 'miroir-core';
import { packageName } from '../../../../constants';
import { cleanLevel } from '../../constants';
import { useMiroirTheme } from '../../contexts/MiroirThemeContext';
import { ThemedComponentProps } from './BaseTypes';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "IconComponents"), "UI",
).then((logger: LoggerInterface) => {log = logger});

// ################################################################################################
export const ThemedLineIconButton: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  onClick,
  title 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const buttonStyles = css({
    padding: 0,
    maxHeight: '1em',
    backgroundColor: 'transparent',
    border: 0,
    color: currentTheme.colors.text,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: `all ${currentTheme.transitions.duration.short} ${currentTheme.transitions.easing.easeInOut}`,
    '&:hover': {
      backgroundColor: currentTheme.colors.hover,
      borderRadius: currentTheme.borderRadius.sm,
    },
  });

  return (
    <button css={buttonStyles} className={className} style={style} onClick={onClick} title={title}>
      {children}
    </button>
  );
};

export const ThemedSmallIconButton: React.FC<ThemedComponentProps & {
  visible?: boolean;
}> = ({ 
  children, 
  className, 
  style,
  onClick,
  title,
  id,
  'aria-label': ariaLabel,
  visible = true
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const buttonStyles = css({
    padding: currentTheme.spacing.xs,
    backgroundColor: currentTheme.colors.surface,
    border: `1px solid ${currentTheme.colors.border}`,
    borderRadius: currentTheme.borderRadius.sm,
    color: currentTheme.colors.text,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: currentTheme.typography.fontSize.sm,
    transition: `all ${currentTheme.transitions.duration.short} ${currentTheme.transitions.easing.easeInOut}`,
    visibility: visible ? 'visible' : 'hidden',
    '&:hover': {
      backgroundColor: currentTheme.colors.hover,
      borderColor: currentTheme.colors.primary,
    },
    '&:active': {
      backgroundColor: currentTheme.colors.primary,
      color: currentTheme.colors.surface,
    },
  });

  return (
    <button 
      css={buttonStyles} 
      className={className} 
      style={style} 
      onClick={onClick} 
      title={title}
      id={id}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

export const ThemedSizedButton: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  onClick,
  id,
  name,
  'aria-label': ariaLabel,
  title
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const buttonStyles = css({
    height: '1em',
    width: 'auto',
    minWidth: '1em',
    padding: 0,
    backgroundColor: currentTheme.colors.primary,
    color: currentTheme.colors.background,
    border: `1px solid ${currentTheme.colors.primary}`,
    borderRadius: currentTheme.borderRadius.sm,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: currentTheme.typography.fontSize.sm,
    transition: `all ${currentTheme.transitions.duration.short} ${currentTheme.transitions.easing.easeInOut}`,
    '&:hover': {
      backgroundColor: currentTheme.colors.primaryDark,
      borderColor: currentTheme.colors.primaryDark,
    },
  });

  return (
    <button 
      css={buttonStyles} 
      className={className} 
      style={style} 
      onClick={onClick}
      id={id}
      name={name}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  );
};

export const ThemedAddIcon: React.FC<ThemedComponentProps> = ({ 
  className, 
  style 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const iconStyles = css({
    height: '0.8em',
    width: '0.8em',
    color: currentTheme.colors.text,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.9em',
    lineHeight: '1',
    verticalAlign: 'baseline',
  });

  return (
    <span css={iconStyles} className={className} style={style}>
      +
    </span>
  );
};

export const ThemedIconButton: React.FC<ThemedComponentProps> = ({ 
  children, 
  className, 
  style,
  onClick,
  title,
  id,
  'aria-label': ariaLabel
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const buttonStyles = css({
    padding: currentTheme.spacing.sm,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: currentTheme.borderRadius.sm,
    color: currentTheme.colors.text,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '2.5em',
    minHeight: '2.5em',
    transition: `all ${currentTheme.transitions.duration.short} ${currentTheme.transitions.easing.easeInOut}`,
    '&:hover': {
      backgroundColor: currentTheme.colors.hover,
    },
    '&:active': {
      backgroundColor: currentTheme.colors.selected || currentTheme.colors.primary + '20',
    },
    '&:focus': {
      outline: `2px solid ${currentTheme.colors.primary}`,
      outlineOffset: '2px',
    },
  });

  return (
    <button 
      css={buttonStyles} 
      className={className} 
      style={style} 
      onClick={onClick}
      title={title}
      id={id}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};

// Enhanced Icon Component Props
interface ThemedIconProps extends Omit<ThemedComponentProps, 'children'> {
  icon?: MiroirIcon;
  /** @deprecated Use 'icon' prop instead. This will be removed in a future version. */
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  fallback?: string;
  'aria-label'?: string;
}

// Unicode emoji mapping for common names and codes
const EMOJI_MAP: Record<string, string> = {
  // Common emoji names
  'book': '📚',
  'books': '📚',
  'library': '📚',
  'error': '❌',
  'warning': '⚠️',
  'info': 'ℹ️',
  'success': '✅',
  'heart': '❤️',
  'star': '⭐',
  'home': '🏠',
  'user': '👤',
  'settings': '⚙️',
  'search': '🔍',
  'menu': '☰',
  'close': '✕',
  'add': '➕',
  'remove': '➖',
  'edit': '✏️',
  'delete': '🗑️',
  'save': '💾',
  'folder': '📁',
  'file': '📄',
  'image': '🖼️',
  'video': '🎥',
  'music': '🎵',
  'phone': '📞',
  'email': '📧',
  'calendar': '📅',
  'clock': '🕐',
  'location': '📍',
  'map': '🗺️',
  'camera': '📷',
  'lock': '🔒',
  'unlock': '🔓',
  'key': '🔑',
  'download': '⬇️',
  'upload': '⬆️',
  'share': '📤',
  'print': '🖨️',
  'copy': '📋',
  'cut': '✂️',
  'paste': '📋',
  'undo': '↶',
  'redo': '↷',
  'refresh': '🔄',
  'sync': '🔄',
  'backup': '💾',
  'restore': '🔄',
  'archive': '📦',
  'trash': '🗑️',
  'recycle': '♻️',
  'filter': '🔍',
  'sort': '🔤',
  'group': '👥',
  'person': '👤',
  'people': '👥',
  'team': '👥',
  'organization': '🏢',
  'building': '🏢',
  'company': '🏢',
  'office': '🏢',
  'interests': '💎',
  'autoStories': '📖',
  'savedSearch': '🔍',
  'testTube': '🧪',
};

// Convert unicode code point to emoji
const codePointToEmoji = (codePoint: string): string => {
  try {
    // Handle hex codes (U+1F4DA, 1F4DA, 0x1F4DA)
    if (codePoint.match(/^(U\+|0x)?[0-9A-Fa-f]+$/)) {
      const cleanCode = codePoint.replace(/^(U\+|0x)/, '');
      const code = parseInt(cleanCode, 16);
      return String.fromCodePoint(code);
    }
    
    // Handle decimal codes
    if (codePoint.match(/^\d+$/)) {
      const code = parseInt(codePoint, 10);
      return String.fromCodePoint(code);
    }
    
    return codePoint; // Return as-is if not a recognized format
  } catch (error) {
    console.warn(`Failed to convert code point "${codePoint}" to emoji:`, error);
    return '❓'; // Question mark as fallback
  }
};

  // Map icon names to MUI icon components
const muiIconComponentMap: Record<string, React.ComponentType<any>> = {
  account_balance: AccountBalance,
  help_outline: HelpOutlineIcon,
  menu: MenuIcon,
  home: HomeIcon,
  book: BookIcon,
  menu_book: MenuBookIcon,
  auto_stories: AutoStoriesIcon,
  saved_search: SavedSearchIcon,
  category: CategoryIcon,
  list: ListIcon,
  location_on: LocationOnIcon,
  error: ErrorIcon,
  south: SouthIcon,
  interests: InterestsIcon,
  settings: SettingsIcon,
  search: SearchIcon,
  add: AddIcon,
  remove: RemoveIcon,
  edit: EditIcon,
  delete: DeleteIcon,
  flag: Flag,
  save: SaveIcon,
  person: Person,
  science: Science,
  star: StarIcon,
  space_dashboard: SpaceDashboard,
  folder: Folder,
};

  // Map common MUI icon name variations to component keys
const muiIconNameMap: Record<string, string> = {
  savedSearch: "saved_search",
  SavedSearch: "saved_search",
  autoStories: "auto_stories",
  AutoStories: "auto_stories",
  Interests: "interests",
  Book: "book",
  Books: "menu_book",
  books: "menu_book",
  south: "south",
  error: "error",
  category: "category",
  list: "list",
  location_on: "location_on",
  // Common fallback icons
  default: "menu",
  fallback: "menu",
};


export const ThemedIcon: React.FC<ThemedIconProps> = ({ 
  icon,
  children, 
  className, 
  style,
  size = 'md',
  fallback = 'help_outline',
  'aria-label': ariaLabel,
  ...rest 
}) => {
  const { currentTheme } = useMiroirTheme();
  
  // Memoized icon resolution logic
  const resolvedIcon = useMemo(() => {
    try {
      log.debug('Resolving icon:', icon );
      // Priority: icon prop > children (deprecated)
      const iconSource = icon ?? (typeof children === 'string' ? children : null);
      
      if (!iconSource) {
        const FallbackComponent = muiIconComponentMap[fallback] || HelpOutlineIcon;
        return { type: 'mui', content: fallback, component: FallbackComponent, error: null };
      }

            // Handle string (legacy MUI icon names)
      if (typeof iconSource === 'string') {
        // Check if it's an emoji first
        // if (iconSource.match(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u)) {
        //   return { type: 'emoji', content: iconSource, error: null };
        // }
        
        // // Check emoji name mapping
        // const emojiFromName = EMOJI_MAP[iconSource.toLowerCase()];
        // if (emojiFromName) {
        //   return { type: 'emoji', content: emojiFromName, error: null };
        // }
        
        // // Try unicode conversion
        // const convertedEmoji = codePointToEmoji(iconSource);
        // if (convertedEmoji !== '❓') {
        //   return { type: 'emoji', content: convertedEmoji, error: null };
        // }
        
        // Default to MUI icon
        const mappedName = muiIconNameMap[iconSource] || iconSource;
        const IconComponent = muiIconComponentMap[mappedName];
        if (IconComponent) {
          return { type: 'mui', content: mappedName, component: IconComponent, error: null };
        }
        return {
          type: "mui",
          content: mappedName,
          component: muiIconComponentMap[fallback] || HelpOutlineIcon,
          error: `Unknown MUI icon: ${mappedName}`,
        };
      }

      // Handle MiroirIcon object types
      if (typeof iconSource === 'object') {
        if (iconSource.iconType === 'emoji') {
          // Handle emoji type
          // const emojiName = iconSource.name.toLowerCase();
          const mappedEmoji = EMOJI_MAP[iconSource.name];
          if (mappedEmoji) {
            log.info(`Mapped emoji name "${iconSource.name}" to "${mappedEmoji}"`);
            return { type: 'emoji', content: mappedEmoji, error: null };
          }
          
          // // Try to convert unicode codes to emoji
          // const convertedEmoji = codePointToEmoji(iconSource.name);
          // if (convertedEmoji !== '❓') {
          //   return { type: 'emoji', content: convertedEmoji, error: null };
          // }
          
          // If it's already an emoji character, use it directly
          // if (iconSource.name.match(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u)) {
            return { type: 'emoji', content: iconSource.name, error: null };
          // }
          
          // return { 
          //   type: 'error', 
          //   content: `❓ ${iconSource.name}`, 
          //   error: `Unknown emoji: ${iconSource.name}` 
          // };
        }
        
        if (iconSource.iconType === 'mui') {
          const mappedName = muiIconNameMap[iconSource.name] || iconSource.name;
          const IconComponent = muiIconComponentMap[mappedName];
          if (IconComponent) {
            return { type: 'mui', content: mappedName, component: IconComponent, error: null };
          }
          return { type: 'mui', content: mappedName, component: muiIconComponentMap[fallback] || HelpOutlineIcon, error: `Unknown MUI icon: ${mappedName}` };
        }
      }

      const FallbackComponent = muiIconComponentMap[fallback] || HelpOutlineIcon;
      return { type: 'mui', content: fallback, component: FallbackComponent, error: 'Invalid icon format' };
    } catch (error) {
      console.warn('Icon resolution error:', error);
      const FallbackComponent = muiIconComponentMap[fallback] || HelpOutlineIcon;
      return { 
        type: 'error', 
        content: `❓ ${fallback}`, 
        component: FallbackComponent,
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }, [icon, children, fallback, muiIconNameMap, muiIconComponentMap]);

  // Size mapping
  const sizeMap = {
    sm: currentTheme.typography.fontSize.sm,
    md: currentTheme.typography.fontSize.lg,
    lg: currentTheme.typography.fontSize.xl || '1.5rem',
  };

  // Base icon styles
  const baseIconStyles = {
    fontSize: sizeMap[size],
    lineHeight: 1,
    display: 'inline-block',
    color: currentTheme.colors.text,
    verticalAlign: 'middle',
    userSelect: 'none' as const,
  };

  // MUI Icon styles
  const muiIconStyles = css({
    ...baseIconStyles,
    minWidth: sizeMap[size],
    textAlign: 'center',
  });

  // Emoji styles
  const emojiIconStyles = css({
    ...baseIconStyles,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    textAlign: 'center',
    minWidth: sizeMap[size],
  });

  // Error styles
  const errorIconStyles = css({
    ...baseIconStyles,
    color: currentTheme.colors.error || '#f44336',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    textAlign: 'center',
    minWidth: sizeMap[size],
  });

  // Generate aria-label
  const accessibilityLabel = useMemo(() => {
    if (ariaLabel) return ariaLabel;
    
    if (resolvedIcon.type === 'mui') {
      // Convert snake_case to readable format
      return resolvedIcon.content.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) + ' icon';
    }
    
    if (resolvedIcon.type === 'emoji') {
      // Try to find a name for the emoji
      const emojiName = Object.entries(EMOJI_MAP).find(([_, emoji]) => emoji === resolvedIcon.content)?.[0];
      return emojiName ? `${emojiName} emoji` : 'emoji';
    }
    
    if (resolvedIcon.error) {
      return `Icon error: ${resolvedIcon.error}`;
    }
    
    return 'icon';
  }, [ariaLabel, resolvedIcon]);

  // Render based on icon type
  const renderIcon = () => {
    switch (resolvedIcon.type) {
      case 'mui':
        const IconComponent = resolvedIcon.component || HelpOutlineIcon;
        return (
          <IconComponent
            css={muiIconStyles}
            className={className}
            style={style}
            aria-label={accessibilityLabel}
            role="img"
            {...rest}
          />
        );
      
      case 'emoji':
        return (
          <span 
            css={emojiIconStyles} 
            className={className} 
            style={style}
            aria-label={accessibilityLabel}
            role="img"
            {...rest}
          >
            {resolvedIcon.content}
          </span>
        );
      
      case 'error':
        return (
          <span 
            css={errorIconStyles} 
            className={className} 
            style={style}
            aria-label={accessibilityLabel}
            role="img"
            title={resolvedIcon.error || 'Icon error'}
            {...rest}
          >
            {resolvedIcon.content}
          </span>
        );
      
      default:
        const FallbackComponent = muiIconComponentMap[fallback] || HelpOutlineIcon;
        return (
          <FallbackComponent
            css={muiIconStyles}
            className={className}
            style={style}
            aria-label={accessibilityLabel}
            role="img"
            {...rest}
          />
        );
    }
  };

  // Show deprecation warning for children usage
  if (children !== undefined && icon === undefined && process.env.NODE_ENV === 'development') {
    console.warn(
      'ThemedIcon: Using "children" prop is deprecated. Please use the "icon" prop instead. ' +
      'This will be removed in a future version.'
    );
  }

  return renderIcon();
};
