'use strict';

/**
 * Fetch Figma file styles + components via REST API.
 * Free-tier compatible: uses /v1/files/{key} (no Variables API).
 */

const FIGMA_API_BASE = 'https://api.figma.com/v1';

async function fetchFigmaFile(fileKey, pat, { depth = null } = {}) {
  const url = depth
    ? `${FIGMA_API_BASE}/files/${fileKey}?depth=${depth}`
    : `${FIGMA_API_BASE}/files/${fileKey}`;
  const res = await fetch(url, {
    headers: { 'X-Figma-Token': pat },
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Figma API error ${res.status}: ${text.slice(0, 200)}`);
    err.statusCode = res.status;
    throw err;
  }
  return res.json();
}

async function fetchFigmaStyles(fileKey, pat) {
  const url = `${FIGMA_API_BASE}/files/${fileKey}/styles`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': pat } });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Figma styles API error ${res.status}: ${text.slice(0, 200)}`);
    err.statusCode = res.status;
    throw err;
  }
  const data = await res.json();
  return data.meta && data.meta.styles ? data.meta.styles : [];
}

async function fetchFigmaComponents(fileKey, pat) {
  const url = `${FIGMA_API_BASE}/files/${fileKey}/components`;
  const res = await fetch(url, { headers: { 'X-Figma-Token': pat } });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Figma components API error ${res.status}: ${text.slice(0, 200)}`);
    err.statusCode = res.status;
    throw err;
  }
  const data = await res.json();
  return data.meta && data.meta.components ? data.meta.components : [];
}

async function fetchAll(fileKey, pat) {
  const [meta, styles, components] = await Promise.all([
    fetchFigmaFile(fileKey, pat, { depth: 1 }),
    fetchFigmaStyles(fileKey, pat),
    fetchFigmaComponents(fileKey, pat),
  ]);
  return {
    name: meta.name || null,
    lastModified: meta.lastModified || null,
    version: meta.version || null,
    styles,
    components,
  };
}

module.exports = { fetchFigmaFile, fetchFigmaStyles, fetchFigmaComponents, fetchAll };
