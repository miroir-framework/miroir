/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import React, { useMemo } from 'react';

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
  // padding,
  'aria-label': ariaLabel,
  disabled = false
}) => {
  const { currentTheme } = useMiroirTheme();
  
  const buttonStyles = css({
    padding: currentTheme.spacing.sm,
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: currentTheme.borderRadius.sm,
    color: 'inherit',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '2.5em',
    minHeight: '2.5em',
    opacity: disabled ? 0.5 : 1,
    transition: `all ${currentTheme.transitions.duration.short} ${currentTheme.transitions.easing.easeInOut}`,
    '&:hover': {
      backgroundColor: disabled ? 'transparent' : currentTheme.colors.hover,
    },
    '&:active': {
      backgroundColor: disabled ? 'transparent' : (currentTheme.colors.selected || currentTheme.colors.primary + '20'),
    },
    '&:focus': {
      outline: disabled ? 'none' : `2px solid ${currentTheme.colors.primary}`,
      outlineOffset: '2px',
    },
  });

  return (
    <button 
      css={buttonStyles} 
      className={className} 
      style={style} 
      onClick={disabled ? undefined : onClick}
      title={title}
      id={id}
      aria-label={ariaLabel}
      disabled={disabled}
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
  'gear': '⚙️',
  'cogwheel': '⚙️',
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

// Material Symbols font-based icon component
interface MaterialSymbolProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  role?: string;
}

const MaterialSymbol: React.FC<MaterialSymbolProps> = ({ 
  name, 
  className, 
  style, 
  'aria-label': ariaLabel,
  role = 'img',
  ...rest 
}) => {
  const combinedClassName = className 
    ? `material-symbols-outlined ${className}` 
    : 'material-symbols-outlined';
  
  return (
    <span 
      className={combinedClassName}
      style={style}
      aria-label={ariaLabel}
      role={role}
      {...rest}
    >
      {name}
    </span>
  );
};

// Map icon names to Material Symbols icon names
const materialSymbolsIconMap: Record<string, string> = {
  account_balance: 'account_balance',
  help_outline: 'help_outline',
  menu: 'menu',
  home: 'home',
  book: 'book',
  menu_book: 'menu_book',
  add: 'add',
  add_box: 'add_box',
  architecture: 'architecture',
  auto_stories: 'auto_stories',
  bug_report: 'bug_report',
  category: 'category',
  delete: 'delete',
  edit: 'edit',
  edit_off: 'edit_off',
  error: 'error',
  error_outline: 'error_outline',
  folder: 'folder',
  folder_open: 'folder_open',
  folder_zip: 'folder_zip',
  history: 'history',
  lightbulb: 'lightbulb',
  draw: 'draw',
  list: 'list',
  location_on: 'location_on',
  south: 'south',
  flag: 'flag',
  interests: 'interests',
  notifications: 'notifications',
  notifications_off: 'notifications_off',
  person: 'person',
  remove: 'remove',
  save: 'save',
  saved_search: 'saved_search',
  science: 'science',
  search: 'search',
  settings: 'settings',
  space_dashboard: 'space_dashboard',
  square_foot: 'square_foot',
  star: 'star',
  sync: 'sync',
  timer: 'timer',
  timer_off: 'timer_off',
  lightbulb_outline: 'lightbulb_outline',
  chevron_left: 'chevron_left',
  chevron_right: 'chevron_right',
  expand_more: 'expand_more',
  expand_less: 'expand_less',
  create: 'create',
  content_copy: 'content_copy',
  toc: 'toc',
  cloud_upload: 'cloud_upload',
  description: 'description',
  get_app: 'get_app',
  image: 'image',
  insert_drive_file: 'insert_drive_file',
  loop: 'loop',
  picture_as_pdf: 'picture_as_pdf',
  keyboard_double_arrow_down: 'keyboard_double_arrow_down',
  keyboard_double_arrow_up: 'keyboard_double_arrow_up',
  unfold_less: 'unfold_less',
  unfold_more: 'unfold_more',
  clear: 'clear',
  close: 'close',
  palette: 'palette',
  dark_mode: 'dark_mode',
  compress: 'compress',
  style: 'style',
  assignment: 'assignment',
  assignment_turned_in: 'assignment_turned_in',
  check_circle: 'check_circle',
  download: 'download',
  play_arrow: 'play_arrow',
  visibility: 'visibility',
  info: 'info',
  warning: 'warning',
  refresh: 'refresh',
  filter_list: 'filter_list',
  height: 'height',
  code: 'code',
  data_object: 'data_object',
  menu_open: 'menu_open',
  view_list: 'view_list',
};

// Map common icon name variations to Material Symbols names
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
  ChevronLeft: "chevron_left",
  ChevronRight: "chevron_right",
  Edit: "edit",
  EditOff: "edit_off",
  BugReport: "bug_report",
  ExpandLess: "expand_less",
  ExpandMore: "expand_more",
  Info: "info",
  Warning: "warning",
  Error: "error",
  ErrorIcon: "error",
  Create: "create",
  CreateIcon: "create",
  ContentCopy: "content_copy",
  ContentCopyIcon: "content_copy",
  Delete: "delete",
  DeleteIcon: "delete",
  Toc: "toc",
  CloudUpload: "cloud_upload",
  CloudUploadIcon: "cloud_upload",
  Description: "description",
  DescriptionIcon: "description",
  FolderZip: "folder_zip",
  FolderZipIcon: "folder_zip",
  GetApp: "get_app",
  GetAppIcon: "get_app",
  Image: "image",
  ImageIcon: "image",
  InsertDriveFile: "insert_drive_file",
  InsertDriveFileIcon: "insert_drive_file",
  CircularProgress: "loop",
  Loop: "loop",
  PictureAsPdf: "picture_as_pdf",
  PictureAsPdfIcon: "picture_as_pdf",
  KeyboardDoubleArrowDown: "keyboard_double_arrow_down",
  KeyboardDoubleArrowUp: "keyboard_double_arrow_up",
  UnfoldLess: "unfold_less",
  UnfoldMore: "unfold_more",
  Clear: "clear",
  ClearIcon: "clear",
  Close: "close",
  CloseIcon: "close",
  Palette: "palette",
  DarkMode: "dark_mode",
  CompressOutlined: "compress",
  Style: "style",
  ExpandMoreIcon: "expand_more",
  Assignment: "assignment",
  AssignmentTurnedIn: "assignment_turned_in",
  CheckCircle: "check_circle",
  CheckCircleIcon: "check_circle",
  Download: "download",
  DownloadIcon: "download",
  ErrorOutline: "error_outline",
  History: "history",
  PlayArrow: "play_arrow",
  Search: "search",
  SearchIcon: "search",
  Visibility: "visibility",
  VisibilityIcon: "visibility",
  Refresh: "refresh",
  RefreshIcon: "refresh",
  FilterList: "filter_list",
  FilterListIcon: "filter_list",
  Science: "science",
  Height: "height",
  Add: "add",
  AddIcon: "add",
  AddBox: "add_box",
  Remove: "remove",
  RemoveIcon: "remove",
  Save: "save",
  SaveIcon: "save",
  EditIcon: "edit",
  Code: "code",
  DataObject: "data_object",
  Folder: "folder",
  FolderOpen: "folder_open",
  MenuOpen: "menu_open",
  Settings: "settings",
  SettingsIcon: "settings",
  ViewList: "view_list",
  AccountBalance: "account_balance",
  Architecture: "architecture",
  Flag: "flag",
  Home: "home",
  HomeIcon: "home",
  Lightbulb: "lightbulb",
  Draw: "draw",
  LocationOn: "location_on",
  LocationOnIcon: "location_on",
  MenuBook: "menu_book",
  MenuBookIcon: "menu_book",
  Menu: "menu",
  MenuIcon: "menu",
  NotificationsOutlined: "notifications",
  NotificationsIcon: "notifications",
  NotificationsOffOutlined: "notifications_off",
  NotificationsOffIcon: "notifications_off",
  Person: "person",
  SavedSearchIcon: "saved_search",
  South: "south",
  SouthIcon: "south",
  SpaceDashboard: "space_dashboard",
  SquareFootSharp: "square_foot",
  Star: "star",
  StarIcon: "star",
  Sync: "sync",
  TimerOffOutlined: "timer_off",
  TimerOutlined: "timer",
  WbIncandescent: "lightbulb_outline",
  wbIncandescent: "lightbulb_outline",
  wb_incandescent: "lightbulb_outline",
  HelpOutline: "help_outline",
  HelpOutlineIcon: "help_outline",
  timerOff: "timer_off",
  timer_off: "timer_off",
  notificationOff: "notifications_off",
  notification: "notifications",
  bugReport: "bug_report",
  bug_report: "bug_report",
};


export const ThemedIcon: React.FC<ThemedIconProps> = ({ 
  icon,
  children, 
  className, 
  style,
  size = 'lg',
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
        const fallbackIconName = materialSymbolsIconMap[fallback] || fallback;
        return { type: 'symbol', content: fallbackIconName, error: null, color: undefined };
      }

      // Handle string (legacy MUI icon names)
      if (typeof iconSource === 'string') {
        // Default to Material Symbol
        const mappedName = muiIconNameMap[iconSource] || iconSource;
        const symbolName = materialSymbolsIconMap[mappedName] || mappedName;
        return { type: 'symbol', content: symbolName, error: null, color: undefined };
      }

      // Handle MiroirIcon object types
      if (typeof iconSource === 'object') {
        if (iconSource.iconType === 'emoji') {
          // Handle emoji type
          const mappedEmoji = EMOJI_MAP[iconSource.name];
          if (mappedEmoji) {
            log.info(`Mapped emoji name "${iconSource.name}" to "${mappedEmoji}"`);
            return { type: 'emoji', content: mappedEmoji, error: null, color: undefined };
          }
          
          // If it's already an emoji character, use it directly
            return { type: 'emoji', content: iconSource.name, error: null, color: undefined };
        }
        
        if (iconSource.iconType === 'mui') {
          const mappedName = muiIconNameMap[iconSource.name] || iconSource.name;
          const symbolName = materialSymbolsIconMap[mappedName] || mappedName;
          
          // Resolve color
          let resolvedColor: string | undefined = undefined;
          if (iconSource.color) {
            if (typeof iconSource.color === 'string') {
              // Direct color string (name or code)
              resolvedColor = iconSource.color;
            } else if (iconSource.color.colorType === 'themeColor') {
              // Resolve from theme using dot notation path
              const pathParts = iconSource.color.currentThemeColorPath.split('.');
              let colorValue: any = currentTheme;
              
              for (const part of pathParts) {
                if (colorValue && typeof colorValue === 'object' && part in colorValue) {
                  colorValue = colorValue[part];
                } else {
                  log.warn(`Theme color path not found: ${iconSource.color.currentThemeColorPath}`);
                  colorValue = undefined;
                  break;
                }
              }
              
              if (typeof colorValue === 'string') {
                resolvedColor = colorValue;
              }
            }
          }
          
          return { type: 'symbol', content: symbolName, error: null, color: resolvedColor };
        }
      }

      const fallbackIconName = materialSymbolsIconMap[fallback] || fallback;
      return { type: 'symbol', content: fallbackIconName, error: 'Invalid icon format', color: undefined };
    } catch (error) {
      console.warn('Icon resolution error:', error);
      const fallbackIconName = materialSymbolsIconMap[fallback] || fallback;
      return { 
        type: 'error', 
        content: `❓ ${fallback}`, 
        symbolName: fallbackIconName,
        error: error instanceof Error ? error.message : 'Unknown error',
        color: undefined
      };
    }
  }, [icon, children, fallback, muiIconNameMap, materialSymbolsIconMap, currentTheme]);

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
    // color: currentTheme.colors.text,
    color: 'inherit',
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
    
    if (resolvedIcon.type === 'symbol') {
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
      case 'symbol':
        const iconColor = resolvedIcon.color || "inherit";
        const symbolStyles: React.CSSProperties = {
          fontSize: sizeMap[size],
          lineHeight: 1,
          display: 'inline-block',
          color: iconColor,
          verticalAlign: 'middle',
          userSelect: 'none',
          minWidth: sizeMap[size],
          textAlign: 'center' as const,
          ...style,
        };
        return (
          <MaterialSymbol
            name={resolvedIcon.content}
            className={className}
            style={symbolStyles}
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
        const fallbackIconName = materialSymbolsIconMap[fallback] || fallback;
        const defaultSymbolStyles: React.CSSProperties = {
          fontSize: sizeMap[size],
          lineHeight: 1,
          display: 'inline-block',
          verticalAlign: 'middle',
          userSelect: 'none',
          minWidth: sizeMap[size],
          textAlign: 'center' as const,
          ...style,
        };
        return (
          <MaterialSymbol
            name={fallbackIconName}
            className={className}
            style={defaultSymbolStyles}
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
