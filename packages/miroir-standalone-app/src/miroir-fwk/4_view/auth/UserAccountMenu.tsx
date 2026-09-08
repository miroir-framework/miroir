import { Avatar, IconButton, Menu, MenuItem, Tooltip, Typography } from "@mui/material";
import { useState, type MouseEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { nextPageWhenAuthGate } from "miroir-core";

import { useMiroirTheme } from "../contexts/MiroirThemeContext.js";
import { setAuthToken, useAuthSession } from "./authSession.js";

export function UserAccountMenu(): React.JSX.Element | null {
  const { enabled, principal } = useAuthSession();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const miroirTheme = useMiroirTheme();

  if (!enabled || !principal) {
    return null;
  }

  const username = principal.username;
  const initial = username.charAt(0).toUpperCase() || "?";
  const menuOpen = Boolean(anchorEl);

  const closeMenu = () => setAnchorEl(null);

  return (
    <>
      <Tooltip title={username}>
        <IconButton
          onClick={(event: MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget)}
          aria-label={`Account menu for ${username}`}
          aria-controls={menuOpen ? "user-account-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={menuOpen ? "true" : undefined}
          sx={{ p: 0.5 }}
        >
          <Avatar
            alt={username}
            sx={{
              width: 32,
              height: 32,
              fontSize: "0.875rem",
              bgcolor: miroirTheme.currentTheme.components.appBar.textColor,
              color: miroirTheme.currentTheme.components.appBar.background,
            }}
          >
            {initial}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        id="user-account-menu"
        sx={{ mt: "45px" }}
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        open={menuOpen}
        onClose={closeMenu}
        keepMounted
      >
        <MenuItem disabled>
          <Typography variant="body2">{username}</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            setAuthToken(undefined);
            const intended = `/?${searchParams.toString()}` || "/?page=home";
            navigate(
              nextPageWhenAuthGate({
                enabled: true,
                hasToken: false,
                intended,
              }),
            );
          }}
        >
          Log out
        </MenuItem>
      </Menu>
    </>
  );
}
