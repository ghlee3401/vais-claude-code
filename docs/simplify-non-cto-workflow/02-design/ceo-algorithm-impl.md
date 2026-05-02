---
owner: cto
agent: cto-direct
artifact: ceo-algorithm-impl
phase: design
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "CEO 7 차원 알고리즘의 함수 시그니처 + 의사 코드 + 등급 결정 휴리스틱."
---

# CEO Algorithm Implementation Spec

## 모듈 위치

`lib/ceo-algorithm.js` (신규)

## 함수 시그니처

```typescript
// 입력: 사용자 요청 (자유 텍스트)
// 출력: 7 차원 분석 + 활성 sub-agent 매핑 + ideation 박제 데이터

type FeatureRequest = {
  rawText: string;          // 사용자 원문
  feature?: string;          // kebab-case 피처명 (CEO 가 추론)
  contextDocs?: string[];    // docs/{feature}/ 의 기존 산출물 (재진입 시)
};

type DimensionGrade = 'none' | 'low' | 'medium' | 'high';

type DimensionResult = {
  id: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  name: '보안' | '컴플라이언스' | 'UX' | '데이터모델' | '외부통신' | '성능' | '제품정의';
  grade: DimensionGrade;
  reason: string;           // 등급 판단 근거 1줄
  activatedAgents: string[]; // 활성화된 sub-agent slug
};

type CEODecision = {
  feature: string;
  dimensions: DimensionResult[];      // 7 개 (모두)
  activeCLevel: ('ceo' | 'cpo' | 'cto' | 'cso')[]; // CBO/COO 자동 X
  artifactPlan: {
    phase: 'ideation' | 'plan' | 'design' | 'do' | 'qa' | 'report';
    artifact: string;
    owner: string;
    agent: string;
    reason: string;
  }[];
  excludedDimensions: { name: string; reason: string }[]; // 제외 근거
};

function analyzeCEO(request: FeatureRequest): CEODecision;
```

## 등급 결정 휴리스틱 (의사 코드)

```javascript
function gradeDimension1_security(text) {
  // 보안 영향
  const highKeywords = ['결제', '카드', '비밀번호', '인증', 'auth', 'login', 'OAuth', '권한', 'role', 'permission'];
  const mediumKeywords = ['사용자 정보', 'profile', 'user data', 'session'];
  if (highKeywords.some(k => text.includes(k))) return 'high';
  if (mediumKeywords.some(k => text.includes(k))) return 'medium';
  return 'low';
}

function gradeDimension2_compliance(text) {
  // 컴플라이언스
  if (/PCI|결제|카드/.test(text)) return 'high'; // PCI-DSS
  if (/GDPR|개인정보|privacy/.test(text)) return 'high';
  if (/SOC2|HIPAA/.test(text)) return 'high';
  return 'none';
}

function gradeDimension3_ux(text) {
  // UX 복잡도
  const ui = /UI|화면|폼|form|input|page|screen/.test(text);
  const flow = /flow|경로|step|wizard/.test(text);
  if (ui && flow) return 'high';
  if (ui || flow) return 'medium';
  return 'low';
}

function gradeDimension4_dataModel(text) {
  // DB / 엔티티
  if (/DB|database|schema|테이블|migration/.test(text)) return 'high';
  if (/저장|persist|state/.test(text)) return 'medium';
  return 'low';
}

function gradeDimension5_externalAPI(text) {
  // 외부 API
  if (/API|webhook|3rd-party|integration|연동/.test(text)) return 'high';
  if (/HTTP|fetch|request/.test(text)) return 'medium';
  return 'low';
}

function gradeDimension6_performance(text) {
  // 성능
  if (/실시간|realtime|latency|throughput|동시 \d+/.test(text)) return 'high';
  if (/응답 속도|cache|optimize/.test(text)) return 'medium';
  return 'low';
}

function gradeDimension7_productDefinition(text) {
  // 제품 정의 깊이
  if (/신규 (서비스|기능|제품)|new feature/.test(text)) return 'high';
  if (/추가|기능 확장|enhance/.test(text)) return 'medium';
  if (/수정|버그|fix/.test(text)) return 'low';
  return 'medium';
}
```

> 휴리스틱은 **default**. CEO agent (Opus) 가 LLM 판단으로 보강 가능.

## Phase ↔ Artifact 활성화 알고리즘

```javascript
function buildArtifactPlan(dimensions) {
  const plan = [];
  
  // 00-ideation 항상
  plan.push({ phase: 'ideation', artifact: 'ideation-decision', owner: 'ceo', agent: 'ceo-direct' });
  
  // 01-plan
  if (dimensions[6].grade !== 'none') { // 차원 7 (제품 정의)
    plan.push({ phase: 'plan', artifact: 'prd', owner: 'cpo', agent: 'prd-writer' });
  }
  if (dimensions[2].grade >= 'medium') { // 차원 3 (UX)
    plan.push({ phase: 'plan', artifact: 'persona', owner: 'cpo', agent: 'ux-researcher' });
  }
  if (dimensions[6].grade === 'high') {
    plan.push({ phase: 'plan', artifact: 'jtbd', owner: 'cpo', agent: 'product-researcher' });
    plan.push({ phase: 'plan', artifact: 'opportunity-solution-tree', owner: 'cpo', agent: 'product-discoverer' });
  }
  if (dimensions[0].grade >= 'medium') { // 차원 1 (보안)
    plan.push({ phase: 'plan', artifact: 'threat-model', owner: 'cso', agent: 'security-auditor' });
  }
  
  // 02-design
  plan.push({ phase: 'design', artifact: 'architecture', owner: 'cto', agent: 'infra-architect' });
  if (dimensions[3].grade >= 'medium') {
    plan.push({ phase: 'design', artifact: 'data-model', owner: 'cto', agent: 'db-architect' });
  }
  if (dimensions[4].grade >= 'medium') {
    plan.push({ phase: 'design', artifact: 'api-contract', owner: 'cto', agent: 'backend-engineer' });
  }
  if (dimensions[2].grade >= 'medium') {
    plan.push({ phase: 'design', artifact: 'ui-flow', owner: 'cto', agent: 'ui-designer' });
  }
  if (dimensions[6].grade === 'high') {
    plan.push({ phase: 'design', artifact: 'value-proposition-canvas', owner: 'cpo', agent: 'product-strategist' });
  }
  
  // 03-do
  plan.push({ phase: 'do', artifact: 'implementation-log', owner: 'cto', agent: 'cto-direct' });
  if (dimensions[0].grade >= 'medium') {
    plan.push({ phase: 'do', artifact: 'secret-scan', owner: 'cso', agent: 'secret-scanner' });
  }
  if (dimensions[4].grade >= 'medium') {
    plan.push({ phase: 'do', artifact: 'dependency-vulnerability', owner: 'cso', agent: 'dependency-analyzer' });
  }
  
  // 04-qa
  plan.push({ phase: 'qa', artifact: 'gap-analysis', owner: 'cto', agent: 'qa-engineer' });
  if (dimensions[0].grade >= 'medium') {
    plan.push({ phase: 'qa', artifact: 'security-audit', owner: 'cso', agent: 'security-auditor' });
  }
  if (dimensions[1].grade !== 'none') {
    plan.push({ phase: 'qa', artifact: 'compliance-report', owner: 'cso', agent: 'compliance-auditor' });
  }
  
  // 05-report 항상
  plan.push({ phase: 'report', artifact: 'completion-report', owner: 'cto', agent: 'cto-direct' });
  
  return plan;
}
```

## 사용자 인터페이스 호출

```javascript
async function ceoIdeation(request) {
  // 1. 7 차원 분석
  const dimensions = [
    { id: 1, name: '보안', grade: gradeDimension1_security(request.rawText), ...},
    { id: 2, name: '컴플라이언스', grade: gradeDimension2_compliance(request.rawText), ...},
    // ...
  ];
  
  // 2. artifact plan 생성
  const artifactPlan = buildArtifactPlan(dimensions);
  
  // 3. 활성 C-Level 추출
  const activeCLevel = [...new Set(artifactPlan.map(p => p.owner))];
  
  // 4. ideation 박제
  await writeIdeationDoc(request.feature, { dimensions, artifactPlan, activeCLevel });
  
  // 5. AskUserQuestion 호출 (옵션 2~3)
  const userChoice = await askUserQuestion({
    header: 'Plan',
    options: [
      { label: '진행 (CEO 결정)', description: `${artifactPlan.length} artifact 박제` },
      { label: '옵션 조정', description: 'artifact 추가/제외' },
    ],
  });
  
  // 6. 사용자 응답 → 자동 PDCA
  if (userChoice === '진행') return autoExecutePDCA(artifactPlan);
  if (userChoice === '옵션 조정') return overrideOptions(artifactPlan);
}
```

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | 함수 시그니처 (TypeScript) + 7 차원 휴리스틱 의사 코드 + buildArtifactPlan 알고리즘 + ceoIdeation 호출 흐름 |
