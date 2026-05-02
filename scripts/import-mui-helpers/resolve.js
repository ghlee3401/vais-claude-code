'use strict';

/**
 * Resolve normalized sources by priority: overrides > figma > mui-npm.
 * For MUI Figma Community case, Figma values are typically null (we only know names),
 * so the practical effect is: figma marks "this token exists in Figma" → confidence ↑;
 * actual values come from mui-npm.
 */

function resolveColor(figma, mui, overrides) {
  const out = {};
  const allIds = new Set([
    ...Object.keys(figma.color || {}),
    ...Object.keys(mui.color || {}),
    ...Object.keys((overrides && overrides.color) || {}),
  ]);
  for (const id of allIds) {
    const ov = overrides && overrides.color && overrides.color[id];
    const f = figma.color && figma.color[id];
    const m = mui.color && mui.color[id];

    if (ov) {
      out[id] = { ...ov, source: 'override', confidence: 100 };
    } else if (f && f.value && m) {
      // Both have value: cross-check
      out[id] = {
        value: f.value,
        source: 'figma+mui',
        confidence: f.value === m.value ? 100 : 80,
        ...(f.value !== m.value ? { muiValue: m.value } : {}),
      };
    } else if (f && m) {
      // Figma exists by name, mui has value — use mui value but mark figma-validated
      out[id] = {
        value: m.value,
        source: 'mui-npm (figma-validated)',
        confidence: 90,
        figmaName: f.figmaName,
      };
    } else if (m) {
      out[id] = { value: m.value, source: 'mui-npm', confidence: 50 };
    } else if (f) {
      out[id] = { value: null, source: 'figma', confidence: 30, figmaName: f.figmaName };
    }
  }
  return out;
}

function resolveTypography(figma, mui, overrides) {
  const out = {};
  const allKeys = new Set([
    ...Object.keys(figma.typography || {}),
    ...Object.keys(mui.typography || {}),
    ...Object.keys((overrides && overrides.typography) || {}),
  ]);
  for (const k of allKeys) {
    const ov = overrides && overrides.typography && overrides.typography[k];
    const f = figma.typography && figma.typography[k];
    const m = mui.typography && mui.typography[k];

    if (ov) {
      out[k] = { ...ov, source: 'override', confidence: 100 };
    } else if (m && f) {
      out[k] = { ...m, source: 'mui-npm (figma-validated)', confidence: 90, figmaName: f.figmaName };
    } else if (m) {
      out[k] = { ...m, source: 'mui-npm', confidence: 50 };
    } else if (f) {
      out[k] = { source: 'figma-only', confidence: 30, figmaName: f.figmaName };
    }
  }
  return out;
}

function resolveShadow(figma, mui, overrides) {
  const out = {};
  const allKeys = new Set([
    ...Object.keys(figma.shadow || {}),
    ...Object.keys(mui.shadow || {}),
    ...Object.keys((overrides && overrides.shadow) || {}),
  ]);
  for (const k of allKeys) {
    const ov = overrides && overrides.shadow && overrides.shadow[k];
    const f = figma.shadow && figma.shadow[k];
    const m = mui.shadow && mui.shadow[k];

    if (ov) {
      out[k] = { value: ov, source: 'override', confidence: 100 };
    } else if (m && f) {
      out[k] = { value: m, source: 'mui-npm (figma-validated)', confidence: 90, figmaName: f.figmaName };
    } else if (m) {
      out[k] = { value: m, source: 'mui-npm', confidence: 50 };
    }
  }
  return out;
}

function resolveAll(figma, mui, overrides = null) {
  return {
    color: resolveColor(figma, mui, overrides),
    typography: resolveTypography(figma, mui, overrides),
    spacing: (overrides && overrides.spacing) || mui.spacing,
    radius: { ...mui.radius, ...(overrides && overrides.radius ? overrides.radius : {}) },
    shadow: resolveShadow(figma, mui, overrides),
  };
}

module.exports = { resolveAll, resolveColor, resolveTypography, resolveShadow };
