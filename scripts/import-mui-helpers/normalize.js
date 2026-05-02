'use strict';

/**
 * Normalize fetched sources to a standard token schema.
 *
 * Standard schema:
 * {
 *   color:      { "<id>": { value, source, confidence } },
 *   typography: { "<id>": { fontFamily, fontWeight, fontSize, lineHeight, letterSpacing, textTransform? } },
 *   spacing:    { unit, scale: number[] },
 *   radius:     { "<name>": number },
 *   shadow:     { "<elevation>": string }
 * }
 */

const COLOR_GROUPS = ['primary', 'secondary', 'error', 'warning', 'info', 'success'];
const COLOR_VARIANTS = ['main', 'light', 'dark', 'contrastText'];
const TEXT_VARIANTS = ['primary', 'secondary', 'disabled'];
const BG_VARIANTS = ['default', 'paper'];
const TYPO_KEYS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'button', 'caption', 'overline'];

function normalizeMuiColors(palette) {
  const out = {};
  for (const group of COLOR_GROUPS) {
    if (!palette[group]) continue;
    for (const variant of COLOR_VARIANTS) {
      if (palette[group][variant] === undefined) continue;
      out[`${group}.${variant}`] = {
        value: String(palette[group][variant]),
        source: 'mui-npm',
        confidence: 50,
      };
    }
  }
  // grey scale
  if (palette.grey) {
    for (const k of Object.keys(palette.grey)) {
      out[`grey.${k}`] = { value: String(palette.grey[k]), source: 'mui-npm', confidence: 50 };
    }
  }
  // text
  if (palette.text) {
    for (const v of TEXT_VARIANTS) {
      if (palette.text[v] === undefined) continue;
      out[`text.${v}`] = { value: String(palette.text[v]), source: 'mui-npm', confidence: 50 };
    }
  }
  // background
  if (palette.background) {
    for (const v of BG_VARIANTS) {
      if (palette.background[v] === undefined) continue;
      out[`background.${v}`] = { value: String(palette.background[v]), source: 'mui-npm', confidence: 50 };
    }
  }
  if (palette.divider !== undefined) {
    out['divider'] = { value: String(palette.divider), source: 'mui-npm', confidence: 50 };
  }
  if (palette.action) {
    for (const k of Object.keys(palette.action)) {
      out[`action.${k}`] = { value: String(palette.action[k]), source: 'mui-npm', confidence: 50 };
    }
  }
  return out;
}

function normalizeMuiTypography(typo) {
  const out = {};
  if (typo.fontFamily) {
    out['fontFamily'] = { value: typo.fontFamily };
  }
  for (const k of TYPO_KEYS) {
    if (!typo[k]) continue;
    const variant = typo[k];
    out[k] = {
      fontFamily: variant.fontFamily || typo.fontFamily,
      fontWeight: variant.fontWeight,
      fontSize: variant.fontSize,
      lineHeight: variant.lineHeight,
      letterSpacing: variant.letterSpacing,
      ...(variant.textTransform ? { textTransform: variant.textTransform } : {}),
    };
  }
  return out;
}

function normalizeMuiShape(shape) {
  return {
    small: 4,
    medium: shape.borderRadius || 4,
    large: (shape.borderRadius || 4) * 2,
    circle: 9999,
  };
}

function normalizeMuiShadows(shadows) {
  const out = {};
  for (let i = 0; i < shadows.length && i <= 24; i++) {
    out[String(i)] = String(shadows[i]);
  }
  return out;
}

function normalizeMui(mui) {
  return {
    color: normalizeMuiColors(mui.palette || {}),
    typography: normalizeMuiTypography(mui.typography || {}),
    spacing: { unit: 8, scale: [0, 4, 8, 16, 24, 32, 48, 64, 96, 128] },
    radius: normalizeMuiShape(mui.shape || {}),
    shadow: normalizeMuiShadows(mui.shadows || []),
  };
}

/**
 * Figma styles → tokens.
 * Free-tier API exposes Paint/Text/Effect Styles by name.
 * MUI Figma Community uses naming like "Primary/Main", "H1", "Elevation 1".
 * This is a heuristic mapper — confidence depends on cross-check with MUI npm.
 */
function normalizeFigma(figma) {
  const tokens = { color: {}, typography: {}, spacing: null, radius: {}, shadow: {} };
  if (!figma || !figma.styles) return tokens;

  for (const style of figma.styles) {
    const name = (style.name || '').trim();
    const styleType = style.style_type;

    if (styleType === 'FILL') {
      // "Primary/Main" / "Light/Background" / "Grey/500"
      const parts = name.split('/').map((p) => p.trim().toLowerCase());
      if (parts.length === 2) {
        const id = `${parts[0]}.${parts[1]}`;
        tokens.color[id] = { value: null, source: 'figma', confidence: 70, figmaName: name };
      } else if (parts.length === 3) {
        const id = `${parts[0]}.${parts[1]}.${parts[2]}`;
        tokens.color[id] = { value: null, source: 'figma', confidence: 70, figmaName: name };
      }
    } else if (styleType === 'TEXT') {
      // "H1" / "Body 1" / "Subtitle1"
      const key = name.toLowerCase().replace(/\s+/g, '');
      if (TYPO_KEYS.includes(key)) {
        tokens.typography[key] = { source: 'figma', confidence: 70, figmaName: name };
      }
    } else if (styleType === 'EFFECT') {
      // "Elevation 1" / "Shadow 24"
      const m = name.match(/(\d+)/);
      if (m) tokens.shadow[m[1]] = { source: 'figma', confidence: 70, figmaName: name };
    }
  }

  return tokens;
}

module.exports = { normalizeMui, normalizeFigma };
