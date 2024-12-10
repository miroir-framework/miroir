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

import { packageName } from '../../../constants.js';
import { cleanLevel } from '../constants.js';
import { SidebarWidth } from './SidebarSection.js';
import { useTheme } from '@emotion/react';
import { Icon } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';

const loggerName: string = getLoggerName(packageName, cleanLevel,"ResponsiveAppBar");
let log:LoggerInterface = console as any as LoggerInterface;
MiroirLoggerFactory.asyncCreateLogger(loggerName).then((value: LoggerInterface) => {
  log = value;
});

const MyAvatar = Avatar as any; // TODO: correct typing error
const MyBox = Box as any;
const MyButton = Button as any;
const MyIconButton = IconButton as any;
const MyMenu = Menu as any;
const MyMenuItem = MenuItem as any;
const MyToolbar = Toolbar as any; // TODO: correct typing error
const MyTooltip = Tooltip as any;
const MyTypography = Typography as any;

const pages: MiroirMenuItem[] = [
  {
    "label": "Tools",
    "section": "model",
    "application": "10ff36f2-50a3-48d8-b80f-e48e5d13af8e",
    "reportUuid": "c9ea3359-690c-4620-9603-b5b402e4a2b9",
    "icon": "category",
  },
  {
    "label": "concept",
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
  MuiAppBar as any, //TODO: correct typing error
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

  const goToLabelPage = (event: any, l: string) => {
    log.info("goToLabelPage: ", l, " event: ", event);
    navigate("/"+l)
  }
  
  return (
    <StyledAppBar  open={props.open}>
      <>
        <MyToolbar disableGutters={false}>
            {/* <Box sx={{display:"flex"}}> */}
              <MyIconButton
                  color="inherit"
                  aria-label="open drawer"
                  onClick={props.handleDrawerOpen}
                  edge="start"
                  sx={{ mr: 2, ...(props.open && { display: 'none' }), ...(!props.open && { display: 'flex' }) }}
                >
                <MenuIcon />
              </MyIconButton>
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
            
            <MyBox sx={{ flexGrow: 0, display: { xs: 'flex', md: 'flex'} }}>
              <MyIconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
              >
                <MenuIcon />
              </MyIconButton>
              <MyMenu
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
                  <MyMenuItem key={page.label} onClick={(e:any)=>goToLabelPage(e,page.label)}>
                      <MyTypography textAlign="center">{page.label}</MyTypography>
                  </MyMenuItem>
                ))}
              </MyMenu>
            </MyBox>
            <AdbIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
            <MyTypography
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
            </MyTypography>
            <MyBox sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
              {
                pages.map(
                  (page) => (
                    <MyButton
                      key={page.label}
                      onClick={(e:any) =>goToLabelPage(e,page.label)}
                      sx={{ my: 2, color: 'white', display: 'block' }}
                    >
                      {page.label}
                    </MyButton>
                  )
                )
              }
            </MyBox>

            <MyBox sx={{ flexGrow: 0, display: "flex" }}>
              <MyTooltip title="Open settings">
                <MyIconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <MyAvatar alt="AVATAR" src="/static/images/avatar/2.jpg" />
                </MyIconButton>
              </MyTooltip>
              <MyMenu
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
                  <MyMenuItem key={setting} onClick={handleCloseUserMenu}>
                    <MyTypography textAlign="center">{setting}</MyTypography>
                  </MyMenuItem>
                ))}
              </MyMenu>
            </MyBox>
        </MyToolbar>
      </>
    </StyledAppBar>
  );
}
export default AppBar;