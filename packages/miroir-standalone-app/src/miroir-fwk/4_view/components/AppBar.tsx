import { useState } from 'react';
import AdbIcon from '@mui/icons-material/Adb';
import MenuIcon from '@mui/icons-material/Menu';
import { default as MuiAppBar, AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import { LoggerInterface, MiroirLoggerFactory, MiroirMenuItem, getLoggerName } from 'miroir-core';

import { packageName } from '../../../constants';
import { cleanLevel } from '../constants';
import { SidebarWidth } from './SidebarSection';
import { useTheme } from '@emotion/react';
import { Icon } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

const loggerName: string = getLoggerName(packageName, cleanLevel,"ResponsiveAppBar");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

const pages: MiroirMenuItem[] = [
  {
    "label": "Tools",
    "section": "model",
    "application": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
    "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9",
    "icon": "category"
  },
  {
    "label": "Page2",
    "section": "model",
    "application": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
    "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9",
    "icon": "category"
  },
];
const settings = ['Setting1', 'Setting2', 'Setting3', 'Setting4'];


export interface AppBarProps extends MuiAppBarProps {
  // open?: boolean;
  handleDrawerOpen?: ()=>void,
  open: boolean,
  children:any,
  // theme: any
}

const StyledAppBar =
// React.useEffect(
styled(
  MuiAppBar, 
  {shouldForwardProp: (prop) => prop !== "open"}
)<AppBarProps>(
  ({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    // display: "flex",
    // flexGrow: 1,
    position: "static",
    minHeight: 0,
    // flexDirection:"row",
    // justifyContent: "space-between"
    // p: 2,
    // height: "100px",
    // transition: theme.transitions.create(
    //   ["margin", "width"], 
    //   {
    //     easing: theme.transitions.easing.sharp,
    //     duration: theme.transitions.duration.leavingScreen,
    //   }
    // ),
    // ...(
    //   !open && {
    //     width: "100%",
    //     // marginLeft: `-${SidebarWidth}px`,
    //     // marginLeft: `240px`,
    //   }
    // ),
    ...(
      open && {
        width: `calc(100% - ${SidebarWidth}px)`,
        marginLeft: `${SidebarWidth}px`,
        transition: theme.transitions.create(
          ["margin", "width"], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
          }
        ),
      }
    ),
    [theme.breakpoints.between('xs', 'sm')]: {
      padding: '0 0px',
      minHeight: "0px"
    },
    [theme.breakpoints.up('md')]: {
      padding: '0 0px',
      minHeight: "0px"
    },
  })
);
// ,[props.open])
;

const Offset = styled('div')(({ theme }) => theme.mixins.toolbar);

export function AppBar(props:AppBarProps) {
  // react hooks
  const navigate = useNavigate();

  // custom hooks
  const theme = useTheme();
  const [anchorElNav, setAnchorElNav] = useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

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

  const menuNavigate = () => {
    navigate("/tools")
  }
  

  return (
    <StyledAppBar  open={props.open}>
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
                    color: 'white',
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
                <MenuItem key={page.label} onClick={menuNavigate}>
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
                    onClick={menuNavigate}
                    sx={{ my: 2, color: 'white', display: 'block' }}
                  >
                    {page.label}
                  </Button>
                )
              )
            }
          </Box>

          <Box sx={{ flexGrow: 0, display: "flex" }}>
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
    </StyledAppBar>
  );
}
export default AppBar;