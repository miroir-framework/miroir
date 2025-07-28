import { useState } from 'react';

import { default as MuiAppBar, AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import { styled } from '@mui/material/styles';
import { 
  Icon, 
  Toolbar, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Button, 
  Tooltip, 
  Avatar 
} from '@mui/material';
import AdbIcon from '@mui/icons-material/Adb';
import MenuIcon from '@mui/icons-material/Menu';
import TocIcon from '@mui/icons-material/Toc';

import { LoggerInterface, MiroirLoggerFactory, MiroirMenuItem } from 'miroir-core';

import { Link, useNavigate } from 'react-router-dom';
import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import { useMiroirTheme } from '../contexts/MiroirThemeContext.js';
import { SidebarWidth } from './SidebarSection.js';
import { useMiroirContextService } from '../MiroirContextReactProvider.js';
import { TableThemeSelector } from '../components/TableThemeSelector';
import { MiroirThemeSelector } from '../components/MiroirThemeSelector';

let log: LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.registerLoggerToStart(
  MiroirLoggerFactory.getLoggerName(packageName, cleanLevel, "ResponsiveAppBar")
).then((logger: LoggerInterface) => {log = logger});

const pages: MiroirMenuItem[] = [
  {
    "label": "Tools",
    "section": "model",
    "selfApplication": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
    "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9",
    "icon": "category",
  },
  {
    "label": "concept",
    "section": "model",
    "selfApplication": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
    "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9",
    "icon": "category"
  },
  {
    "label": "check",
    "section": "model",
    "selfApplication": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e", //not used
    "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9", //not used
    "icon": "category"
  },
];
const settings = ['Setting1', 'Setting2', 'Setting3', 'Setting4'];


export interface AppBarProps extends MuiAppBarProps {
  // open?: boolean;
  handleDrawerOpen?: ()=>void,
  open: boolean,
  children:any,
  width?: number,
  onWidthChange?: (width: number) => void,
  // Document outline props
  outlineOpen?: boolean,
  outlineWidth?: number,
  onOutlineToggle?: () => void,
  // Grid type display and toggle
  gridType?: string,
  onGridTypeToggle?: () => void,
  // theme: any
}

const StyledAppBar =
styled(
  MuiAppBar as any, //TODO: correct typing error
  {shouldForwardProp: (prop) => prop !== "open" && prop !== "width" && prop !== "outlineOpen" && prop !== "outlineWidth"}
)<AppBarProps>(
  ({ theme, open, width = SidebarWidth, outlineOpen, outlineWidth = 300 }) => {
    let appBarWidth = "100%";
    let marginLeft = 0;
    let marginRight = 0;

    // Calculate width and margins based on both sidebars
    if (open && outlineOpen) {
      // Both sidebars open
      appBarWidth = `calc(100% - ${width}px - ${outlineWidth}px)`;
      marginLeft = width;
      marginRight = outlineWidth;
    } else if (open) {
      // Only left sidebar open
      appBarWidth = `calc(100% - ${width}px)`;
      marginLeft = width;
    } else if (outlineOpen) {
      // Only right outline open
      appBarWidth = `calc(100% - ${outlineWidth}px)`;
      marginRight = outlineWidth;
    }

    return {
      zIndex: 1201, // Higher than drawer (1200) to appear above it
      position: "static",
      minHeight: 0,
      width: appBarWidth,
      marginLeft: `${marginLeft}px`,
      marginRight: `${marginRight}px`,
      transition: 'margin 0.3s ease-out, width 0.3s ease-out',
      '@media (max-width: 600px)': {
        padding: '0 0px',
        minHeight: "0px"
      },
      '@media (min-width: 960px)': {
        padding: '0 0px',
        minHeight: "0px"
      },
    };
  }
);

// ################################################################################################
export function AppBar(props:AppBarProps) {
  // react hooks
  const navigate = useNavigate();

  // custom hooks
  const miroirTheme = useMiroirTheme();
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const context = useMiroirContextService();

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const goToLabelPage = (event: any, l: string) => {
    log.info("goToLabelPage: ", l, " event: ", event);
    navigate("/"+l)
  }
  
  return (
    <StyledAppBar 
      open={props.open} 
      width={props.width} 
      outlineOpen={props.outlineOpen} 
      outlineWidth={props.outlineWidth}
      sx={{
        backgroundColor: miroirTheme.currentTheme.components.appBar.background,
        color: miroirTheme.currentTheme.components.appBar.textColor,
        borderBottom: miroirTheme.currentTheme.components.appBar.borderBottom,
        boxShadow: miroirTheme.currentTheme.components.appBar.elevation,
      }}
    >
      <>
        <Toolbar disableGutters={false}>
            {/* <Box sx={{display:"flex"}}> */}
              <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  onClick={props.handleDrawerOpen}
                  edge="start"
                  sx={{ mr: 2, ...(props.open && { display: 'none' }), ...(!props.open && { display: 'flex' }) }}
                >
                <MenuIcon />
              </IconButton>
              {/* <AdbIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} /> */}
            {/* </Box> */}
              {/* <Typography
                variant="h6"
                noWrap
                component="a"
                href="/"
                sx={{
                  mr: 2,
                  display: { xs: 'none', md: 'flex' },
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  letterSpacing: '.3rem',
                  color: 'inherit',
                  textDecoration: 'none',
                }}
              > */}
                <Link to={`/home`}>
                  <Icon
                    sx={{
                      mr: 2,
                      color: miroirTheme.currentTheme.components.appBar.textColor,
                    }}
                  >home</Icon>
                </Link>

                {/* open: {props.open?"true":"false"} */}
              {/* </Typography> */}
            
            <Box sx={{ flexGrow: 0, display: { xs: 'flex', md: 'flex'} }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{
                  display: { xs: 'block', md: 'none' },
                }}
              >
                {pages.map((page) => (
                  <MenuItem key={page.label} onClick={(e:any)=>goToLabelPage(e,page.label)}>
                      <Typography textAlign="center">{page.label}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            <AdbIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
            <Typography
              variant="h5"
              noWrap
              component="a"
              href=""
              sx={{
                mr: 2,
                display: { xs: 'flex', md: 'none' },
                flexGrow: 1,
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.3rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              LOGO
            </Typography>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {
                pages.map(
                  (page) => (
                    <Button
                      key={page.label}
                      onClick={(e:any) =>goToLabelPage(e,page.label)}
                      sx={{ my: 2, color: miroirTheme.currentTheme.components.appBar.textColor, display: 'block' }}
                    >
                      {page.label}
                    </Button>
                  )
                )
              }
            </Box>

            <Box sx={{ flexGrow: 0, display: "flex" }}>
              {/* App Theme Selector */}
              <MiroirThemeSelector showDescription={false} label="Theme" />
              
              {/* Table Theme Selector */}
              <TableThemeSelector showDescription={false}/>

              {/* Grid Type Toggle Button */}
              {props.gridType && props.onGridTypeToggle && (
                <Tooltip title={`Switch to ${props.gridType === 'ag-grid' ? 'Glide Data Grid' : 'AG-Grid'}`}>
                  <Button
                    onClick={props.onGridTypeToggle}
                    sx={{
                      mr: 2,
                      px: 1,
                      py: 0.5,
                      backgroundColor: 'transparent',
                      color: miroirTheme.currentTheme.components.appBar.textColor,
                      opacity: 0.8,
                      border: `1px solid ${miroirTheme.currentTheme.components.appBar.textColor}`,
                      borderRadius: 1,
                      transition: 'all 0.3s ease-in-out',
                      fontSize: '0.875rem',
                      fontWeight: 'normal',
                      textTransform: 'none',
                      minWidth: 'auto',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: miroirTheme.currentTheme.colors.hover,
                        color: miroirTheme.currentTheme.colors.text,
                        opacity: 1,
                      }
                    }}
                  >
                    Grid: {props.gridType === 'ag-grid' ? 'AG-Grid' : 'Glide Data Grid'}
                  </Button>
                </Tooltip>
              )}
              
              
            {/* Performance Monitor Indicator */}
            {context.setShowPerformanceDisplay && (
              <Tooltip title={context.showPerformanceDisplay ? "Performance Monitor: ON (click to disable)" : "Performance Monitor: OFF (click to enable)"}>
                <Button
                  onClick={() => context.setShowPerformanceDisplay?.(!context.showPerformanceDisplay)}
                  sx={{
                    mr: 2,
                    px: 1,
                    py: 0.5,
                    backgroundColor: 'transparent',
                    color: context.showPerformanceDisplay 
                      ? miroirTheme.currentTheme.colors.success 
                      : miroirTheme.currentTheme.components.appBar.textColor,
                    border: `1px solid ${context.showPerformanceDisplay 
                      ? miroirTheme.currentTheme.colors.success 
                      : miroirTheme.currentTheme.components.appBar.textColor}`,
                    borderRadius: 1,
                    textShadow: context.showPerformanceDisplay 
                      ? `0 0 8px ${miroirTheme.currentTheme.colors.success}aa, 0 0 16px ${miroirTheme.currentTheme.colors.success}77, 0 0 24px ${miroirTheme.currentTheme.colors.success}55` 
                      : 'none',
                    transition: 'all 0.3s ease-in-out',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    minWidth: 'auto',
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: miroirTheme.currentTheme.colors.hover,
                      color: context.showPerformanceDisplay 
                        ? miroirTheme.currentTheme.colors.success 
                        : miroirTheme.currentTheme.colors.text,
                      textShadow: context.showPerformanceDisplay 
                        ? `0 0 12px ${miroirTheme.currentTheme.colors.success}, 0 0 20px ${miroirTheme.currentTheme.colors.success}cc, 0 0 32px ${miroirTheme.currentTheme.colors.success}99` 
                        : 'none',
                    }
                  }}
                >
                  Performance Monitor
                </Button>
              </Tooltip>
            )}              {/* Document Outline Toggle Button */}
              {props.onOutlineToggle && (
                <Tooltip title={props.outlineOpen ? "Hide Document Outline" : "Show Document Outline"}>
                  <IconButton 
                    color="inherit"
                    onClick={props.onOutlineToggle}
                    sx={{ mr: 1 }}
                  >
                    <TocIcon />
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar alt="AVATAR" src="/static/images/avatar/2.jpg" />
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: '45px' }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {settings.map((setting) => (
                  <MenuItem key={setting} onClick={handleCloseUserMenu}>
                    <Typography textAlign="center">{setting}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
        </Toolbar>
      </>
    </StyledAppBar>
  );
}
export default AppBar;