'use strict';

// Diagram export (skills/diagram, docs/harness/design.md §10): a drawing is one self-contained HTML
// file with an inline <svg>. `--svg` lifts that first <svg> into a stand-alone file with the
// Google Fonts @import injected; `--png` photographs the HTML through the same Chrome capture the
// UI loop uses. No Python, no Playwright: the upstream skill's import/verify tooling was left out.

const fs = require('fs');
const path = require('path');
const { renderArtifact } = require('./screen-capture');

const FONT_IMPORT = "@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&amp;family=Geist:wght@400;500;600&amp;family=Geist+Mono:wght@400;500;600&amp;family=Noto+Sans+KR:wght@400;500;600&amp;family=Noto+Serif+KR:wght@400&amp;display=swap');";

// First <svg …>…</svg> block of an HTML document, made a valid stand-alone SVG document.
function extractSvg(html) {
  const source = String(html || '');
  const start = source.search(/<svg[\s>]/i);
  if (start < 0) throw new Error('HTML 에 <svg> 가 없다');
  const end = source.indexOf('</svg>', start);
  if (end < 0) throw new Error('<svg> 가 닫히지 않았다');
  let svg = source.slice(start, end + '</svg>'.length);
  if (!/\sxmlns=/.test(svg.slice(0, svg.indexOf('>')))) {
    svg = svg.replace(/^<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  // Stand-alone .svg files parse as strict XML: bare & in attribute values must be escaped.
  svg = svg.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, '&amp;');
  const style = `<style>${FONT_IMPORT}</style>`;
  svg = /<defs[\s>]/i.test(svg)
    ? svg.replace(/<defs(\s[^>]*)?>/i, match => `${match}${style}`)
    : svg.replace(/^(<svg[^>]*>)/i, `$1<defs>${style}</defs>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${svg}\n`;
}

function relativeInside(projectRoot, filePath) {
  const relative = path.relative(path.resolve(projectRoot), path.resolve(projectRoot, filePath)).split(path.sep).join('/');
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return relative;
}

// Writes <name>.svg and/or <name>.png next to the HTML. Options: { svg, png, renderer }.
function exportDiagram(projectRoot, filePath, options = {}) {
  const relative = relativeInside(projectRoot, filePath);
  if (!relative) throw new Error('--file 은 프로젝트 안의 파일이어야 한다');
  if (!/\.html?$/i.test(relative)) throw new Error('--file 은 .html 이어야 한다');
  const absolute = path.join(path.resolve(projectRoot), relative);
  if (!fs.existsSync(absolute)) throw new Error(`파일이 없다: ${relative}`);
  const base = absolute.replace(/\.html?$/i, '');
  const outputs = {};
  const warnings = [];
  if (options.svg) {
    const svg = extractSvg(fs.readFileSync(absolute, 'utf8'));
    fs.writeFileSync(`${base}.svg`, svg);
    outputs.svg = relativeInside(projectRoot, `${base}.svg`);
  }
  if (options.png) {
    try {
      const result = renderArtifact(absolute, { renderer: options.renderer });
      if (result.rendered) outputs.png = relativeInside(projectRoot, result.png);
      else warnings.push('PNG 를 만들지 못했다');
    } catch (error) {
      warnings.push(`PNG 생략: ${error.message}`);
    }
  }
  return { schema: 'diagram-export/v1', file: relative, outputs, warnings };
}

module.exports = { FONT_IMPORT, extractSvg, exportDiagram };
