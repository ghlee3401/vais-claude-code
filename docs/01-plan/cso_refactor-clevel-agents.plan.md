# refactor-clevel-agents - 보안·품질 검토 기획 (CSO)

> ⛔ **Plan 단계 범위**: 이 문서는 검토 계획만 기록합니다. 실제 감사 실행은 Do 단계에서 수행합니다.
> 참조: `docs/03-do/cto_refactor-clevel-agents.do.md`, `docs/04-qa/cto_refactor-clevel-agents.qa.md`

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | CTO가 수행한 7개 C-Level 에이전트 본문 리팩터링(−38% 감축)에 대한 독립적 코드·품질 검증. 내부 QA(CTO)와 외부 감사(CSO)의 이중 검증 체계. |
| **WHO** | 플러그인 유지보수자 (CSO 판정 기반 배포 의사결정자) |
| **RISK** | 리팩터링 과정에서 숨겨진 의미 손실이 자동 감사를 우회했을 가능성, refactor-audit.js 자체 버그, 보안·거버넌스 규칙 약화 |
| **SUCCESS** | Critical 0건 + 독립 관점에서 리팩터링 품질 ≥ 80/100 |
| **SCOPE** | `agents/{7}/{c}.md` 본문 변경분 + `scripts/refactor-audit.js` 신규 스크립트 + v0.48.3 auto-execute 규칙 추가분 |

---

## 0. 검토 대상

### 0.1 변경 범위 (CTO Do 결과 참조)

| 파일 | Before | After | 감축 |
|------|-------:|------:|------:|
| agents/ceo/ceo.md | 696 | 412 | -284 |
| agents/cpo/cpo.md | 366 | 239 | -127 |
| agents/cto/cto.md | 702 | 411 | -291 |
| agents/cso/cso.md | 485 | 323 | -162 |
| agents/cmo/cmo.md | 441 | 262 | -179 |
| agents/coo/coo.md | 361 | 245 | -116 |
| agents/cfo/cfo.md | 399 | 247 | -152 |
| **agent 합계** | **3,450** | **2,139** | **-38%** |
| scripts/refactor-audit.js (신규) | 0 | ~400 | new |

### 0.2 검토 가능한 Gate

| Gate | 적용 가능성 | 이유 |
|------|-----------|------|
| **Gate A (보안 검토)** | ⚠️ 제한적 | 본 작업은 md 문서 리팩터링 + 신규 Node 스크립트. 민감 데이터/인증/권한 코드 없음. scripts/refactor-audit.js 에는 `execSync('git show HEAD:...')` 호출 존재 → **명령 인젝션 점검 필요** |
| **Gate B (플러그인 검증)** | ✅ 가능 | 이미 `vais-validate-plugin.js` PASS 확인됨. 추가 검증 불필요 |
| **Gate C (독립 코드 리뷰)** | ✅ **핵심** | CTO QA 이후 독립 관점에서 리팩터 품질 + 숨겨진 의미 손실 + 감사 스크립트 자체 품질 재검증 |

**판정**: Gate C 필수 + Gate A 부분 수행 (refactor-audit.js 명령 인젝션만)

---

## 1. 검토 범위 결정

### 1.1 Gate C (독립 코드 리뷰) — 핵심

**대상**:
- 7개 리팩터된 C-Level 에이전트 md 파일
- `scripts/refactor-audit.js` (신규 400 LOC Node 스크립트)

**검토 항목**:
1. **문자 수준 의미 보존**: CTO의 refactor-audit.js가 놓친 의미 손실 여부 (정성적 검증)
2. **구조적 완전성**: 각 에이전트의 운영 로직(워크플로우, CP 분기, 위임 규칙)이 리팩터 후에도 실행 가능한 수준인지
3. **가독성**: 압축이 과도해서 사용자가 실제 읽을 때 이해가 어려운 섹션이 있는지
4. **HTML 주석 마커 일관성**: `<!-- @refactor:begin ... -->` 마커가 의도대로 배치되었는지
5. **refactor-audit.js 코드 품질**: 버그 패턴, 에러 처리, 성능, 입력 검증

### 1.2 Gate A 부분 (보안)

**대상**: `scripts/refactor-audit.js`만

**검토 항목**:
- `execSync('git show HEAD:${rel}')` — `rel` 값에 사용자 입력이 들어갈 경우 쉘 인젝션 가능성
- `fs.readFileSync(absPath)` — path traversal 가능성
- `crypto.createHash` 사용 적절성
- process.exit 코드 일관성

---

## 2. 검토 방법론

### 2.1 체크리스트

| # | 항목 | 검증 방법 |
|---|------|---------|
| 1 | 각 C-Level 에이전트의 5개 동작 규칙(phase 실행/CP 멈춤/Plan 제한/자동 실행/체이닝 금지) 원문 보존 | 직접 grep 확인 |
| 2 | CP 템플릿 축약이 실제 사용 시 정보 부족하지 않은가 | CP-1/2/Q 펜스 내용 수동 검토 |
| 3 | 공통 규칙 압축 시 핵심 제약 문구(반드시/절대 금지/필수) 수치 이상의 의미 보존 | 문맥 기반 정성 검토 |
| 4 | refactor-audit.js 명령 인젝션 | rel 값 정제 여부 확인, 하드코딩 리스트인지 확인 |
| 5 | refactor-audit.js path traversal | absPath 생성 경로 확인 |
| 6 | 테스트 가능성 (T1~T6 smoke) | 실제 존재 여부 및 실행 가능성 |
| 7 | CSO 파일 내 법적 체크리스트(GDPR/CCPA/NDA/ToS) 완전 보존 | 비교 grep |

### 2.2 품질 점수 판정 기준

- ≥ 90/100: Pass + 권장사항 제시
- 70-89/100: 조건부 통과 + 필수 개선 목록
- < 70/100: CTO 수정 요청 + 재검토

---

## 3. 의존성

- **CTO Do 완료** ✅ (`docs/03-do/cto_refactor-clevel-agents.do.md` 존재)
- **CTO QA 완료** ✅ (`docs/04-qa/cto_refactor-clevel-agents.qa.md` 전부 PASS)
- **git 상태**: 7 agent 파일 + scripts/refactor-audit.js + docs 추가 = 스테이징 전

## 4. 예상 결과

| 시나리오 | 확률 | 대응 |
|---------|------|------|
| Critical 0 + 품질 ≥ 90 | **높음** | CTO QA가 이미 PASS, refactor-audit.js가 철저 → 바로 승인 |
| 중간 수준 이슈 발견 (1~3건) | 중간 | 조건부 통과 + CTO 수정 요청 |
| Critical 발견 | 낮음 | CP-C로 배포 차단 여부 확인 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-08 | 초기 작성 — Gate C 주도 + Gate A 부분 (refactor-audit.js 명령 인젝션) |
