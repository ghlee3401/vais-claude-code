'use strict';

/**
 * CEO Algorithm — 7 차원 체크리스트 + phase ↔ artifact 매핑
 *
 * v2.x: 코드 개발 도우미 정체성. 4 C-Suite (CEO/CPO/CTO/CSO) primary, CBO/COO secondary.
 *
 * @see docs/simplify-non-cto-workflow/02-design/ceo-algorithm-impl.md
 */

const DIMENSIONS = [
  { id: 1, name: '보안', code: 'security' },
  { id: 2, name: '컴플라이언스', code: 'compliance' },
  { id: 3, name: 'UX', code: 'ux' },
  { id: 4, name: '데이터모델', code: 'dataModel' },
  { id: 5, name: '외부통신', code: 'externalAPI' },
  { id: 6, name: '성능', code: 'performance' },
  { id: 7, name: '제품정의', code: 'productDefinition' },
];

const PHASE_ARTIFACT_MAPPING = {
  '00-ideation': {
    always: [{ artifact: 'ideation-decision', owner: 'ceo', agent: 'ceo-direct' }],
    conditional: [],
  },
  '01-plan': {
    always: [],
    conditional: [
      { artifact: 'prd', owner: 'cpo', agent: 'prd-writer', trigger: (g) => g.productDefinition !== 'none' },
      { artifact: 'persona', owner: 'cpo', agent: 'ux-researcher', trigger: (g) => gradeAtLeast(g.ux, 'medium') },
      { artifact: 'jtbd', owner: 'cpo', agent: 'product-researcher', trigger: (g) => g.productDefinition === 'high' },
      { artifact: 'tam-sam-som', owner: 'cpo', agent: 'product-researcher', trigger: (g) => g.productDefinition === 'high' },
      { artifact: 'opportunity-solution-tree', owner: 'cpo', agent: 'product-discoverer', trigger: (g) => g.productDefinition === 'high' },
      { artifact: 'threat-model', owner: 'cso', agent: 'security-auditor', trigger: (g) => gradeAtLeast(g.security, 'medium') },
    ],
  },
  '02-design': {
    always: [{ artifact: 'architecture', owner: 'cto', agent: 'infra-architect' }],
    conditional: [
      { artifact: 'data-model', owner: 'cto', agent: 'db-architect', trigger: (g) => gradeAtLeast(g.dataModel, 'medium') },
      { artifact: 'api-contract', owner: 'cto', agent: 'backend-engineer', trigger: (g) => gradeAtLeast(g.externalAPI, 'medium') },
      { artifact: 'ui-flow', owner: 'cto', agent: 'ui-designer', trigger: (g) => gradeAtLeast(g.ux, 'medium') },
      { artifact: 'value-proposition-canvas', owner: 'cpo', agent: 'product-strategist', trigger: (g) => g.productDefinition === 'high' },
      { artifact: 'lean-canvas', owner: 'cpo', agent: 'product-strategist', trigger: (g) => g.productDefinition === 'high' },
      { artifact: 'product-strategy-canvas', owner: 'cpo', agent: 'product-strategist', trigger: (g) => g.productDefinition === 'high' },
    ],
  },
  '03-do': {
    always: [{ artifact: 'implementation-log', owner: 'cto', agent: 'cto-direct' }],
    conditional: [
      { artifact: 'secret-scan', owner: 'cso', agent: 'secret-scanner', trigger: (g) => gradeAtLeast(g.security, 'medium') },
      { artifact: 'dependency-vulnerability', owner: 'cso', agent: 'dependency-analyzer', trigger: (g) => gradeAtLeast(g.externalAPI, 'medium') },
    ],
  },
  '04-qa': {
    always: [{ artifact: 'gap-analysis', owner: 'cto', agent: 'qa-engineer' }],
    conditional: [
      { artifact: 'security-audit', owner: 'cso', agent: 'security-auditor', trigger: (g) => gradeAtLeast(g.security, 'medium') },
      { artifact: 'compliance-report', owner: 'cso', agent: 'compliance-auditor', trigger: (g) => g.compliance !== 'none' },
    ],
  },
  '05-report': {
    always: [{ artifact: 'completion-report', owner: 'cto', agent: 'cto-direct' }],
    conditional: [],
  },
};

const GRADE_ORDER = { none: 0, low: 1, medium: 2, high: 3 };

function gradeAtLeast(actual, required) {
  return GRADE_ORDER[actual] >= GRADE_ORDER[required];
}

function gradeSecurity(text) {
  const high = /결제|카드|비밀번호|인증|auth|login|OAuth|권한|role|permission/i;
  const medium = /사용자 정보|profile|user data|session/i;
  if (high.test(text)) return 'high';
  if (medium.test(text)) return 'medium';
  return 'low';
}

function gradeCompliance(text) {
  if (/PCI|결제|카드/i.test(text)) return 'high';
  if (/GDPR|개인정보|privacy/i.test(text)) return 'high';
  if (/SOC2|HIPAA/i.test(text)) return 'high';
  return 'none';
}

function gradeUX(text) {
  const ui = /UI|화면|폼|form|input|page|screen/i.test(text);
  const flow = /flow|경로|step|wizard/i.test(text);
  if (ui && flow) return 'high';
  if (ui || flow) return 'medium';
  return 'low';
}

function gradeDataModel(text) {
  if (/DB|database|schema|테이블|migration/i.test(text)) return 'high';
  if (/저장|persist|state/i.test(text)) return 'medium';
  return 'low';
}

function gradeExternalAPI(text) {
  if (/API|webhook|3rd-party|integration|연동/i.test(text)) return 'high';
  if (/HTTP|fetch|request/i.test(text)) return 'medium';
  return 'low';
}

function gradePerformance(text) {
  if (/실시간|realtime|latency|throughput|동시 \d+/i.test(text)) return 'high';
  if (/응답 속도|cache|optimize/i.test(text)) return 'medium';
  return 'low';
}

function gradeProductDefinition(text) {
  if (/신규 (서비스|기능|제품)|new feature/i.test(text)) return 'high';
  if (/추가|기능 확장|enhance/i.test(text)) return 'medium';
  if (/수정|버그|fix/i.test(text)) return 'low';
  return 'medium';
}

/**
 * 7 차원 분석. 휴리스틱 default. LLM (CEO agent) 가 보강 가능.
 */
function analyzeDimensions(rawText) {
  return {
    security: gradeSecurity(rawText),
    compliance: gradeCompliance(rawText),
    ux: gradeUX(rawText),
    dataModel: gradeDataModel(rawText),
    externalAPI: gradeExternalAPI(rawText),
    performance: gradePerformance(rawText),
    productDefinition: gradeProductDefinition(rawText),
  };
}

/**
 * Phase ↔ Artifact 활성화 알고리즘.
 * 7 차원 결과 → 활성 artifact 목록.
 */
function buildArtifactPlan(grades) {
  const plan = [];
  for (const [phase, mapping] of Object.entries(PHASE_ARTIFACT_MAPPING)) {
    for (const a of mapping.always) {
      plan.push({ phase, ...a });
    }
    for (const a of mapping.conditional) {
      if (a.trigger(grades)) {
        plan.push({ phase, artifact: a.artifact, owner: a.owner, agent: a.agent });
      }
    }
  }
  return plan;
}

/**
 * 활성 C-Level 추출 (artifact plan 의 owner 들).
 * primary (CEO/CPO/CTO/CSO) 만. secondary (CBO/COO) 자동 X.
 */
function extractActiveCLevel(artifactPlan) {
  const owners = new Set(artifactPlan.map((p) => p.owner));
  return ['ceo', 'cpo', 'cto', 'cso'].filter((c) => owners.has(c));
}

/**
 * 메인 entry — CEO ideation 분석.
 */
function analyzeCEO(request) {
  const { rawText, feature } = request;
  const grades = analyzeDimensions(rawText);
  const dimensions = DIMENSIONS.map((d) => ({
    id: d.id,
    name: d.name,
    grade: grades[d.code],
    reason: `${d.name} 등급 = ${grades[d.code]} (default 휴리스틱)`,
  }));
  const artifactPlan = buildArtifactPlan(grades);
  const activeCLevel = extractActiveCLevel(artifactPlan);
  return {
    feature,
    dimensions,
    activeCLevel,
    artifactPlan,
    excludedDimensions: dimensions
      .filter((d) => GRADE_ORDER[d.grade] < GRADE_ORDER.medium)
      .map((d) => ({ name: d.name, reason: `등급 = ${d.grade}` })),
  };
}

module.exports = {
  DIMENSIONS,
  PHASE_ARTIFACT_MAPPING,
  GRADE_ORDER,
  gradeAtLeast,
  analyzeDimensions,
  buildArtifactPlan,
  extractActiveCLevel,
  analyzeCEO,
};
