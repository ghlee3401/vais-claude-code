# Design: C-Suite 확장 + 위임 패턴 정립

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | PM 역할이 CTO에 혼재, CMO/CSO 인라인 로직 과다 → 역할 경계 불명확 |
| WHO | vais 사용자, C-Suite 에이전트, sub-agent들 |
| RISK | CMO/CSO가 너무 얇아져 컨텍스트 손실 가능성. 파일 수 증가 |
| SUCCESS | SC-01: CPO PRD 생성 + CTO 전달. SC-02: CMO→seo 위임. SC-03: CSO→sub-agent 위임. SC-04: 레거시 완전 제거 |
| SCOPE | agents/, skills/vais/phases/, skills/vais/SKILL.md, 삭제 대상 3곳 |

---

## 1. 선택된 아키텍처: Option B — 완전 분리

### 1.1 설계 원칙

- **C-level = 오케스트레이터**: 방향 설정 + 위임 + 결과 통합만 담당
- **sub-agent = 실행자**: 실제 체크리스트/분석/생성 로직 담당
- **단방향 의존**: sub-agent는 C-level을 알지 못함. C-level만 sub-agent를 호출

### 1.2 최종 에이전트 계층

```
CEO (opus) — 전략 + 전체 오케스트레이션
  ├─ CPO (sonnet) — 제품 방향 + PRD
  │     ├─ pm-discovery  (sub-agent)
  │     ├─ pm-strategy   (sub-agent) [병렬]
  │     ├─ pm-research   (sub-agent) [병렬]
  │     └─ pm-prd        (sub-agent)
  ├─ CTO (opus) — 기술 실행 오케스트레이션
  │     ├─ design        (sub-agent)
  │     ├─ architect     (sub-agent)
  │     ├─ frontend      (sub-agent) [병렬]
  │     ├─ backend       (sub-agent) [병렬]
  │     └─ qa            (sub-agent)
  ├─ CMO (sonnet) — 마케팅 오케스트레이션
  │     └─ seo           (sub-agent) ← 신규
  ├─ CSO (sonnet) — 보안/검증 오케스트레이션
  │     ├─ security      (sub-agent) ← 신규
  │     └─ validate-plugin (sub-agent) ← 신규
  ├─ CFO (sonnet) — [stub] 재무
  └─ COO (sonnet) — [stub] 운영
```

### 1.3 파일 변경 전체 목록

| 작업 | 파일 |
|------|------|
| 신규 | `agents/cpo.md` |
| 신규 | `agents/seo.md` |
| 신규 | `agents/security.md` |
| 신규 | `agents/validate-plugin.md` |
| 신규 | `skills/vais/phases/cpo.md` |
| 수정 | `agents/cmo.md` — 오케스트레이터로 교체 |
| 수정 | `agents/cso.md` — 오케스트레이터로 교체 |
| 수정 | `agents/ceo.md` — CPO/CFO/COO 위임 추가 |
| 수정 | `skills/vais/SKILL.md` — cpo/cfo/coo 추가, deprecated 제거 |
| 삭제 | `skills/vais-seo/` (폴더 전체) |
| 삭제 | `skills/vais-validate-plugin/` (폴더 전체) |
| 삭제 | `skills/vais/phases/manager.md` |
| 삭제 | `skills/vais/phases/auto.md` |
| 이미 존재 | `agents/cfo.md` (stub, 완료) |
| 이미 존재 | `agents/coo.md` (stub, 완료) |
| 이미 존재 | `skills/vais/phases/cfo.md` (stub, 완료) |
| 이미 존재 | `skills/vais/phases/coo.md` (stub, 완료) |

---

## 2. 신규 에이전트 설계

### 2.1 agents/cpo.md

**역할**: CPO. PRD + 로드맵 생성. pm sub-agents 오케스트레이션.

**frontmatter**:
```yaml
name: cpo
version: 1.0.0
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash, Agent, TodoWrite, AskUserQuestion]
memory: project
```

**핵심 로직**:
1. Query 모드(질문) vs Command 모드(실행) 판별
2. Command 모드: pm sub-agents 순차/병렬 호출
   - pm-discovery → pm-strategy + pm-research (병렬) → pm-prd
3. PRD 저장: `docs/00-pm/{feature}.prd.md`
4. CTO 핸드오프 컨텍스트 생성

**C-Suite 연동**:
- `/vais ceo:cpo {feature}` — CEO 전략 → CPO PRD
- `/vais cpo:cto {feature}` — CPO PRD → CTO 기술 계획

### 2.2 agents/seo.md

**역할**: SEO 감사 전담. 기존 CMO의 SEO 로직을 이 파일로 이동.

**frontmatter**:
```yaml
name: seo
version: 1.0.0
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash, TodoWrite]
memory: none
```

**핵심 로직** (기존 CMO에서 이동):
- Title/Meta 감사 (20점)
- Semantic HTML 감사 (30점)
- Core Web Vitals 가이드 (30점)
- 구조화 데이터 감사 (20점)
- SEO 리포트 생성: `docs/05-marketing/{feature}-seo.md`

**참고**: CMO가 호출할 때 feature 컨텍스트와 타깃 키워드를 전달받음

### 2.3 agents/security.md

**역할**: 보안 감사 전담. CSO의 Gate A(OWASP 검토) 로직 이동.

**frontmatter**:
```yaml
name: security
version: 1.0.0
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash, TodoWrite]
memory: none
```

**핵심 로직** (기존 CSO에서 이동):
- OWASP Top 10 체크리스트 실행
- 인증/인가 설계 검토
- 민감 데이터 노출 검사
- 보안 감사 리포트 반환 (CSO가 최종 판정)

### 2.4 agents/validate-plugin.md

**역할**: 플러그인 배포 검증 전담. CSO의 Gate B 로직 이동.

**frontmatter**:
```yaml
name: validate-plugin
version: 1.0.0
model: sonnet
tools: [Read, Write, Edit, Glob, Grep, Bash, TodoWrite]
memory: none
```

**핵심 로직** (기존 `skills/vais-validate-plugin/SKILL.md`에서 이동):
- plugin.json / marketplace.json 유효성 검사
- 마켓플레이스 요구사항 체크리스트
- 코드 안전성 검사
- 검증 결과 반환 (CSO가 최종 판정)

---

## 3. 수정 에이전트 설계

### 3.1 agents/cmo.md — 오케스트레이터로 교체

**변경 전**: 마케팅 방향 분석 + SEO 체크리스트 인라인 실행
**변경 후**: 마케팅 방향 분석 + seo agent 호출 + 결과 통합

**새 실행 흐름**:
```
1단계: 마케팅 컨텍스트 분석 (직접)
  - 타깃, 핵심 메시지, 콘텐츠 채널, SEO 키워드

2단계: Agent 도구로 seo 호출
  - 전달: feature명, 핵심 키워드, 타깃 URL 목록

3단계: SEO 결과 수신 + 통합 리포트
  - docs/05-marketing/{feature}.md (마케팅 전략)
  - docs/05-marketing/{feature}-seo.md (SEO는 seo agent가 직접 저장)
```

**제거 내용**: SEO 체크리스트 섹션 전체 (2단계 SEO 감사 실행)

### 3.2 agents/cso.md — 오케스트레이터로 교체

**변경 전**: OWASP 체크리스트 + 플러그인 검증 인라인 실행
**변경 후**: 두 Gate 모두 sub-agent 위임 + 최종 판정만 직접

**새 실행 흐름**:
```
/vais cso {feature}:
  Gate A: Agent 도구 → security 호출
          ← 보안 감사 리포트 수신
  Gate B: Agent 도구 → validate-plugin 호출
          ← 검증 결과 수신
  최종 판정: 두 결과 합산 → Pass/Fail + 개선 필요 항목
```

**제거 내용**: OWASP 체크리스트 섹션, 플러그인 검증 섹션 전체

### 3.3 agents/ceo.md — CPO/CFO/COO 위임 추가

**추가 내용** (작업 원칙 및 C-Suite 체이닝 섹션):
```
제품 방향/PRD는 CPO에게 위임합니다
재무/ROI는 CFO에게 위임합니다 (stub)
운영/CI/CD는 COO에게 위임합니다 (stub)
```

**에이전트 직접 위임 규칙 테이블에 추가**:
| cpo | Agent 도구로 위임 | cpo |
| cfo | Agent 도구로 위임 | cfo |
| coo | Agent 도구로 위임 | coo |

### 3.4 skills/vais/SKILL.md — 정리

**추가할 액션**:
```
| `cpo [feature]` | CPO 에이전트 — 제품 방향 + PRD 생성 |
| `cfo [feature]` | CFO 에이전트 — 재무/ROI 분석 (stub) |
| `coo [feature]` | COO 에이전트 — 운영/CI/CD (stub) |
```

**제거할 내용**:
- `manager` 액션 행
- `auto` 액션 행
- "Deprecated 액션 처리" 실행 지침 분기 (67-69번 줄)

---

## 4. 삭제 대상 상세

| 대상 | 삭제 방법 | 사유 |
|------|-----------|------|
| `skills/vais-seo/` | `rm -rf` | 로직이 `agents/seo.md`로 이동 |
| `skills/vais-validate-plugin/` | `rm -rf` | 로직이 `agents/validate-plugin.md`로 이동 |
| `skills/vais/phases/manager.md` | `rm` | CTO로 대체 완료 |
| `skills/vais/phases/auto.md` | `rm` | CTO로 대체 완료 |

---

## 5. sub-agent 입출력 계약

### 5.1 CMO → seo 호출 계약

**CMO가 전달하는 컨텍스트**:
```
## SEO 감사 요청

피처: {feature}
타깃 파일 경로: {HTML/TSX 파일 목록}
핵심 키워드: {CMO가 추출한 3-5개}
타깃 사용자: {CMO가 정의한 세그먼트}
```

**seo가 반환하는 결과**:
```
docs/05-marketing/{feature}-seo.md 파일 저장 완료
종합 점수: {X}/100
Critical 개선 항목: [{item1}, {item2}]
```

### 5.2 CSO → security 호출 계약

**CSO가 전달하는 컨텍스트**:
```
## 보안 감사 요청

피처: {feature}
검사 대상 파일: {API 라우트, 인증 미들웨어 목록}
```

**security가 반환하는 결과**:
```
OWASP 통과: {N}/10
미통과 항목: [{A01: ...}, ...]
Critical 취약점: [{item}]
```

### 5.3 CSO → validate-plugin 호출 계약

**CSO가 전달하는 컨텍스트**:
```
## 플러그인 검증 요청

plugin.json 경로: {path}
marketplace.json 경로: {path}
```

**validate-plugin이 반환하는 결과**:
```
검증 결과: Pass | Fail
실패 항목: [{item}]
```

---

## 6. phases/cpo.md 설계

`skills/vais/phases/cpo.md` — SKILL.md가 `$0 = cpo`일 때 로드하는 파일

**내용 구조**:
```markdown
### 📦 cpo — 제품 총괄

Agent 도구로 cpo 에이전트를 호출합니다.

#### 모드 판별
- 질문형 → Query 모드 (PRD/로드맵 현황 브리핑)
- 실행형 → Command 모드 (PRD 생성)

#### 전달할 정보
- 사용자 입력: "$1"
- .vais/status.json (현재 피처 상태)
- docs/00-pm/ (기존 PRD 목록)
```

---

## 7. 구현 순서 (Session Guide)

### Module 1 — 삭제 작업 (독립, 빠름)
- phases/manager.md 삭제
- phases/auto.md 삭제
- skills/vais-seo/ 삭제
- skills/vais-validate-plugin/ 삭제

### Module 2 — sub-agent 신규 생성
- agents/seo.md (CMO의 SEO 로직 추출)
- agents/security.md (CSO의 Gate A 로직 추출)
- agents/validate-plugin.md (CSO의 Gate B + vais-validate-plugin 로직)

### Module 3 — CPO 신규 생성
- agents/cpo.md
- skills/vais/phases/cpo.md

### Module 4 — C-level 수정
- agents/cmo.md 교체 (SEO 로직 제거 → seo 위임)
- agents/cso.md 교체 (검사 로직 제거 → sub-agent 위임)
- agents/ceo.md 수정 (CPO/CFO/COO 위임 추가)

### Module 5 — SKILL.md 정리
- cpo/cfo/coo 액션 추가
- manager/auto 제거
- deprecated 분기 제거

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-01 | Option B (완전 분리) 설계 |
