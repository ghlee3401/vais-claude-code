'use strict';

/**
 * Fetch MUI npm createTheme defaults.
 * No browser/React runtime needed — createTheme returns a plain JS object.
 */

function fetchMuiDefaults() {
  let createTheme;
  try {
    createTheme = require('@mui/material/styles').createTheme;
  } catch (err) {
    const e = new Error('@mui/material not installed. Run `npm install --save-dev @mui/material`.');
    e.code = 'MUI_NOT_INSTALLED';
    throw e;
  }

  const theme = createTheme();
  const muiPkg = require('@mui/material/package.json');

  return {
    package: '@mui/material',
    version: muiPkg.version,
    palette: theme.palette,
    typography: theme.typography,
    spacing: { unit: 8, fn: theme.spacing.toString().slice(0, 200) },
    shape: theme.shape,
    shadows: theme.shadows,
    breakpoints: theme.breakpoints && theme.breakpoints.values ? theme.breakpoints.values : {},
    zIndex: theme.zIndex,
  };
}

module.exports = { fetchMuiDefaults };
