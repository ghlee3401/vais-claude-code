'use strict';

// `/vais 설명 <대상>` (docs/harness/design.md §7): an ID, a term, or a file path explained in plain
// language from the chain index, the glossary data, and document frontmatter. When nothing
// matches the answer says so and offers candidates instead of guessing.

const fs = require('fs');
const path = require('path');
const { assertContract } = require('./contracts');
const idChain = require('./id-chain');
const { loadChainCatalog, stageByPrefix } = require('./chain-registry');
const { parseDocument } = require('./document-manager');
const { normalizeRelative } = require('./write-policy');
const { WorkItemStore } = require('./work-item-store');

const ID_PATTERN = /^[A-Z]{1,4}-\d{3}$/;
const GLOSSARY_FILE = path.join(__dirname, '..', '..', '..', 'contracts', 'glossary.json');
let glossaryCache = null;

function loadGlossary(options = {}) {
  if (glossaryCache && !options.reload) return glossaryCache;
  glossaryCache = assertContract('glossary', JSON.parse(fs.readFileSync(GLOSSARY_FILE, 'utf8')));
  return glossaryCache;
}

function normalize(value) {
  return String(value || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

function stamp(value) {
  return value ? String(value).slice(0, 10) : '—';
}

function explainId(projectRoot, id) {
  const index = idChain.loadChainIndex(projectRoot);
  const item = index.items[id];
  const stage = stageByPrefix(id.split('-')[0]);
  if (!item) {
    const candidates = Object.keys(index.items).filter(key => key.startsWith(`${id.split('-')[0]}-`)).slice(0, 5);
    return {
      kind: 'unknown', target: id, refs: stage ? [stage.file] : [], candidates,
      text: stage
        ? `${id} 는 ${stage.title}(${stage.file})의 항목 형식이지만 승인된 항목 중에 없다.${candidates.length ? ` 비슷한 항목: ${candidates.join(', ')}.` : ' 아직 그 단계가 승인되지 않았을 수 있다.'}`
        : `${id} 는 알려진 항목 접두가 아니다. 접두는 ${loadChainCatalog().stages.map(entry => entry.idPrefix).join('·')} 중 하나다.`,
    };
  }
  const children = Object.values(index.items).filter(entry => (entry.parents || []).includes(id)).map(entry => entry.id);
  const stale = idChain.computeStale(index);
  const staleAsChild = stale.filter(entry => entry.id === id).map(entry => entry.parent);
  const staleChildren = stale.filter(entry => entry.parent === id).map(entry => entry.id);
  const parts = [
    `${id} 는 ${stage ? stage.title : item.stage} 의 항목이다.`,
    item.parents?.length ? `부모: ${item.parents.join(', ')}.` : '부모 없음(최상위).',
    children.length ? `자식: ${children.join(', ')}.` : '자식 없음.',
    `${item.workItem || '알 수 없는 작업'} 에서 ${stamp(item.approvedAt)} 승인(revision ${item.revision || 1}).`,
    staleAsChild.length ? `⚠ 부모 ${staleAsChild.join(', ')} 가 바뀌어 stale 이다.` : staleChildren.length ? `⚠ 이 항목이 바뀌어 자식 ${staleChildren.join(', ')} 이 stale 이다.` : 'stale 아님.',
  ];
  return { kind: 'id', target: id, text: parts.join(' '), refs: [stage?.file, ...(item.workItem ? [`docs/work-items/**/${String(item.workItem).replace(/^WI-/, '')}/`] : [])].filter(Boolean), candidates: [] };
}

function matchTerms(target) {
  const wanted = normalize(target);
  const terms = loadGlossary().terms;
  const exact = terms.filter(term => term.names.some(name => normalize(name) === wanted));
  if (exact.length) return { exact, partial: [] };
  const partial = terms.filter(term => term.names.some(name => normalize(name).includes(wanted) || wanted.includes(normalize(name))));
  return { exact: [], partial };
}

function explainTerm(target) {
  const { exact, partial } = matchTerms(target);
  const term = exact[0] || (partial.length === 1 ? partial[0] : null);
  if (term) return { kind: 'term', target, text: term.text, refs: term.refs || [], candidates: [] };
  return null;
}

function explainFile(projectRoot, target) {
  const relative = normalizeRelative(projectRoot, target);
  if (!relative) return null;
  const absolute = path.join(projectRoot, relative);
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return null;
  const stage = loadChainCatalog().stages.find(entry => entry.file === relative);
  const parsed = /\.md$/i.test(relative) ? parseDocument(absolute) : null;
  const refs = [relative];
  if (stage) {
    const status = parsed?.data?.status || 'draft';
    const items = parsed ? idChain.parseStageDocument(fs.readFileSync(absolute, 'utf8'), stage).items.length : 0;
    return { kind: 'file', target: relative, refs, candidates: [], text: `${stage.order}단계 ${stage.title} 정본이다. 상태 ${status}, 항목 ${items}개${parsed?.data?.work_item ? `, ${parsed.data.work_item} 에서 승인` : ''}. 항목 이름표는 ${stage.idPrefix}-NNN.` };
  }
  if (parsed?.data?.schema === 'vais-phase/v1') {
    const item = new WorkItemStore(projectRoot).get(parsed.data.work_item);
    return { kind: 'file', target: relative, refs, candidates: [], text: `${parsed.data.work_item} 의 ${parsed.data.phase} 단계 정본(revision ${parsed.data.revision}, 상태 ${parsed.data.status}${parsed.data.frozen ? ', 동결' : ''}).${item ? ` 그 작업은 지금 ${item.phase}/${item.status} 이고 제목은 "${item.title}".` : ''}` };
  }
  if (parsed?.data?.schema === 'vais-work-item/v1') {
    return { kind: 'file', target: relative, refs, candidates: [], text: `작업 ${parsed.data.id} 의 상태 문서다: ${parsed.data.phase}/${parsed.data.status}, feature ${parsed.data.primary_feature}.` };
  }
  const notes = { 'docs/product/README.md': '제품 노트 "현재" — 10단계 문서 상태표. Report 마다 자동 생성.', 'docs/product/roadmap.md': '제품 노트 "다음" — 남은 단계와 제안. 표식 사이 메모만 손으로 고친다.', 'docs/product/decisions.md': '제품 노트 "왜" — 장부를 사람 말로 다시 그린 문서. 자동 생성.', 'docs/README.md': '작업 목록(과거) 인덱스. 자동 생성.' };
  if (notes[relative]) return { kind: 'file', target: relative, refs, candidates: [], text: notes[relative] };
  return { kind: 'file', target: relative, refs, candidates: [], text: `프로젝트 파일이다 (${fs.statSync(absolute).size} bytes). 하네스 정본은 아니다.` };
}

function explain(projectRoot, rawTarget) {
  const target = String(rawTarget || '').trim().replace(/^[`'"]|[`'"]$/g, '');
  if (!target) return { kind: 'unknown', target, text: '설명할 대상을 함께 적는다: `/vais 설명 F-003`, `/vais 설명 stale`, `/vais 설명 docs/product/02-features.md`.', refs: [], candidates: [] };
  const upper = target.toUpperCase();
  if (ID_PATTERN.test(upper)) return explainId(projectRoot, upper);
  const asFile = explainFile(projectRoot, target);
  if (asFile) return asFile;
  const asTerm = explainTerm(target);
  if (asTerm) return asTerm;
  const { partial } = matchTerms(target);
  const index = idChain.loadChainIndex(projectRoot);
  const candidates = [
    ...partial.map(term => term.names[0]),
    ...Object.keys(index.items).filter(key => normalize(key).includes(normalize(target))),
  ].slice(0, 5);
  return { kind: 'unknown', target, refs: [], candidates, text: `"${target}" 은 모른다 — 항목 ID·용어·파일 어디에도 없다.${candidates.length ? ` 혹시: ${candidates.join(', ')}.` : ''}` };
}

module.exports = { ID_PATTERN, loadGlossary, matchTerms, explainId, explainTerm, explainFile, explain };
