# Sub-plan 02 — Existing C-Level Agent Updates

> 상위: `../v050-full-overhaul.plan.md`
> 선행: 00
> 후행: 03, 06, 08
> 병렬 가능: 01 (서로 다른 디렉토리)

---

## 0. 목적

기존 5개 C-Level(CEO/CPO/CTO/CSO/COO) 본체와 sub-agent 집합을 v0.50 스펙에 맞춰 갱신한다. **신규 sub-agent 4종** 생성, **이동 2종**(release-engineer, performance-engineer: CTO→COO), **제거 2종**(retrospective-writer, technical-writer).

CMO/CFO **디렉토리 자체 삭제**는 sub-plan 08에서. 본 sub-plan은 "새로 필요한 것 생성 + 본체 문서 갱신"에만 집중.

---

## 1. 변경 요약

| C-Level | 추가 | 이동 | 제거 |
|---------|------|------|------|
| CEO | `skill-creator` | — | `retrospective-writer` |
| CPO | `backlog-manager` | — | — |
| CTO | — | `release-engineer`, `performance-engineer` → COO | — |
| CSO | `secret-scanner`, `dependency-analyzer` | — | — |
| COO | `release-engineer`, `performance-engineer` (CTO에서) | — | `technical-writer` |

**신규 생성 파일 (4)**:
- `agents/ceo/skill-creator.md`
- `agents/cpo/backlog-manager.md`
- `agents/cso/secret-scanner.md`
- `agents/cso/dependency-analyzer.md`

**삭제 파일 (2, 08에서 실행하지만 본 sub-plan에서 참조 제거 필수)**:
- `agents/ceo/retrospective-writer.md`
- `agents/coo/technical-writer.md`

**이동 (내용 변경 없이 위치만)**:
- `agents/cto/release-engineer.md` → `agents/coo/release-engineer.md` (이미 일부 진행됨 — `T agents/coo/release-engineer.md` type change 상태)
- `agents/cto/performance-engineer.md` → `agents/coo/performance-engineer.md` (현재 `agents/coo/performance-engineer.md`로 이미 존재)

---

## 2. 태스크

### 2.1 CEO 업데이트 (`agents/ceo/ceo.md` + skill-creator 신설)

**본체 수정**:
- frontmatter `subAgents`: `[absorb-analyzer, skill-creator]` (retrospective-writer 제거)
- 본문 "Sub-agents" 섹션:
  - `skill-creator` 설명 추가 — "자동 skill/agent markdown 생성, 외부 skill absorption 지원 (S-9 시나리오 핵심)"
  - `retrospective-writer` 라인 제거
- **동적 라우팅** 섹션 강화:
  - 10+1 시나리오(S-1 ~ S-10 + S-0) 반영
  - ideation 라우팅 분기: "주제 → C-Level 추천 → AskUserQuestion 승인 → 자동 전환" (CP-3b)

**신규 `agents/ceo/skill-creator.md`**:
- Frontmatter: `model: sonnet`, `parent: ceo`, `agent-type: subagent`
- Input: skill/agent 스펙 (purpose, input, output, sub-agents)
- Output:
  - `skills/{name}/SKILL.md` 생성 (frontmatter + 본문)
  - `agents/{c-level}/{role}.md` 생성
  - 통합 테스트 코드 예시
- 역할 범위:
  - (a) 새 skill/agent 정의로부터 markdown 생성
  - (b) `absorb-analyzer`가 분석한 외부 skill을 vais-code 컨벤션으로 변환 (S-9 absorption branch)
- 참조: `skills/vais/utils/skill-creator.md` (기존 utility)와의 관계 — skill-creator 에이전트는 CC agent 단위, skill-creator utility는 /vais 내부 sub-command. 본 sub-agent는 후자의 wrapper 역할

### 2.2 CPO 업데이트 (`agents/cpo/cpo.md` + backlog-manager 신설)

**본체 수정**:
- frontmatter `subAgents`: `[product-discoverer, product-strategist, product-researcher, prd-writer, backlog-manager, ux-researcher, data-analyst]`
- 본문 PDCA 오케스트레이션에 backlog-manager 위치 명시:
  - **Design phase**: prd-writer가 PRD 작성 → `backlog-manager`가 PRD → user story + acceptance criteria + sprint plan + story points 변환

**신규 `agents/cpo/backlog-manager.md`**:
- Frontmatter: `model: sonnet`, `parent: cpo`
- Input: PRD, 제품 로드맵, 팀 벨로시티
- Output:
  - User story 백로그 (INVEST criteria 준수)
  - Acceptance criteria (Given-When-Then)
  - Story points (Planning Poker / T-shirt)
  - Sprint 플랜 (2주 단위)
  - Dependency graph (차단 관계)
- Frameworks:
  - **INVEST** (Independent/Negotiable/Valuable/Estimable/Small/Testable)
  - **MoSCoW** 우선순위
  - **RICE** (Reach × Impact × Confidence / Effort)
  - **Story Mapping** (Jeff Patton)
  - **Definition of Ready / Definition of Done**

### 2.3 CTO 업데이트 (`agents/cto/cto.md`)

**본체 수정**:
- frontmatter `subAgents`에서 **제거**: `release-engineer`, `performance-engineer`
- frontmatter `subAgents` 최종: `[infra-architect, backend-engineer, frontend-engineer, ui-designer, db-architect, qa-engineer, test-engineer, incident-responder]`
- 본문 "Sub-agents" 섹션:
  - release-engineer / performance-engineer 라인 제거
  - 각 섹션에 "v0.50부터 COO 소관" 주석 추가 (히스토리 표기)
- 배포 관련 언급은 "CTO는 구현까지 책임, 배포는 COO 협업"으로 정리

**파일 이동**:
- `agents/cto/release-engineer.md`는 08에서 삭제. 본 sub-plan에서는 CTO 본체가 **참조하지 않도록** 먼저 분리.
- `agents/cto/performance-engineer.md` 존재하지 않으면 무시 (이미 COO로 옮겨져 있음)

### 2.4 CSO 업데이트 (`agents/cso/cso.md` + secret-scanner, dependency-analyzer 신설)

**본체 수정**:
- frontmatter `subAgents`: `[security-auditor, code-reviewer, secret-scanner, dependency-analyzer, plugin-validator, skill-validator, compliance-auditor]`
- 본문에 두 신규 sub-agent orchestration 추가:
  - **Do phase** 병렬: `secret-scanner` + `dependency-analyzer` 동시 실행
  - **QA phase**: CSO가 두 결과를 severity(critical/high/medium/low)로 분류 + 결과 통합

**신규 `agents/cso/secret-scanner.md`**:
- Frontmatter: `model: sonnet`, `parent: cso`
- Input: 소스 코드 전체, `.env.example`, Git 히스토리 (optional)
- Output: 시크릿 탐지 리포트 `{file, line, pattern, entropy, confidence, remediation}`
- Detection 방식:
  - **Regex patterns**: AWS access key (`AKIA[0-9A-Z]{16}`), GitHub token (`gh[ps]_[A-Za-z0-9]{36}`), Slack (`xox[baprs]-`), private key PEM 헤더, JWT 형식, Stripe (`sk_live_`, `pk_live_`)
  - **Shannon entropy**: base64-looking strings ≥ 4.5 bits/char
  - **Context heuristics**: `password=`, `secret=`, `token=` 근방
  - **File allowlist**: `.env.example`, fixture 파일 제외
- 참조: gitleaks, truffleHog 룰셋 호환 구조로 설계 (필요 시 추후 연동)

**신규 `agents/cso/dependency-analyzer.md`**:
- Frontmatter: `model: sonnet`, `parent: cso`
- Input: `package.json`, `package-lock.json`, `requirements.txt`, `Gemfile.lock`, `go.mod` 등
- Output: 의존성 취약점 리포트 `{package, version, advisory_id, severity, cwe, patched_version, license}`
- Detection 방식:
  - **CVE lookup**: npm audit / `osv.dev` / GitHub Advisory Database 연동 가정
  - **License compliance**: SPDX 식별, 허용/금지 리스트 비교 (기본: GPL 계열 경고)
  - **Supply chain risk**: typosquatting 후보, 저 maintainer 수, 최근 업데이트 없음
  - **Transitive deps** 포함
- 연동: 실제 API 키 없을 시 로컬 `npm audit --json` 폴백

### 2.5 COO 업데이트 (`agents/coo/coo.md`)

**본체 수정**:
- frontmatter `subAgents`: `[release-engineer, sre-engineer, release-monitor, performance-engineer]`
- technical-writer 관련 언급 제거. 기술 문서 책임은 각 역할(CTO/CPO 등)이 분담한다고 명시
- 본문 PDCA 오케스트레이션:
  - **Plan**: 배포 전략 결정 (blue-green / canary / rolling)
  - **Design**: CI/CD + 모니터링 아키텍처 (release-engineer + sre-engineer 병렬)
  - **Do**: release-engineer가 파이프라인 구축 / performance-engineer가 벤치마크
  - **QA**: 스테이징 배포 + 메트릭 검증
  - **Report**: 배포 체크리스트, 롤백 기준, 런북

**이동 처리**:
- `agents/coo/release-engineer.md`는 이미 `T` 상태 (type change). 내용이 v0.49 CTO 버전 그대로일 수 있으므로:
  - 해당 파일 frontmatter `parent: coo`로 갱신
  - 본문에서 "CTO" 언급 → "COO" 수정
  - CI/CD 도구 목록(GitHub Actions, GitLab CI, Docker, K8s) 명시
- `agents/coo/performance-engineer.md`도 동일하게 parent 갱신

---

## 3. 진입 시 신경 쓸 점

### 3.1 선행에서 보장됨
- `vais.config.json`의 `cSuite.{role}.subAgents` 배열이 v0.50 스펙 반영
- 각 C-Level의 agent path 확정

### 3.2 다음으로 넘길 보증
- 본체 markdown의 subAgents 섹션과 frontmatter 배열이 config와 100% 일치
- 신규 4 sub-agent 파일 존재 + I/O 명세 완전
- CTO 본체에서 release/performance-engineer 참조 0건 (08 grep 대비)
- CEO 본체에서 retrospective-writer 참조 0건
- COO 본체에서 technical-writer 참조 0건

### 3.3 함정
- **release-engineer 이동 시 "경로 변경만"이 아닌 "소유자 변경"**: parent frontmatter, 본문의 "CTO의 sub-agent" 문구, 관련 프롬프트 전부 교체 필요. 깜빡하면 sub-agent가 호출 시 혼란.
- **`agents/coo/performance-engineer.md`가 이미 존재**: git status에서 `M agents/coo/performance-engineer.md` 확인됨. 이미 옮겨진 것이므로 중복 복사 금지.
- **CTO 본체에 `release-engineer` 제거 시 들여쓰기 주의**: 리스트 항목 하나 빼고 주변 컨텍스트가 깨지지 않도록.
- **skill-creator 에이전트 vs skills/vais/utils/skill-creator.md**: 후자는 기존 CLI utility, 전자는 CC agent. 혼동 방지 위해 에이전트 본문에 "utility와 wrapper 관계" 명시.
- **신규 sub-agent 4개 모두 sub-plan 04(Advisor)에서 frontmatter patch 필요**: 이 단계에서 advisor 필드 넣지 말고 04에서 일괄 처리.

---

## 4. 검증

- [ ] `agents/ceo/skill-creator.md` 존재 + `parent: ceo`
- [ ] `agents/cpo/backlog-manager.md` 존재 + `parent: cpo`
- [ ] `agents/cso/secret-scanner.md` + `agents/cso/dependency-analyzer.md` 존재 + `parent: cso`
- [ ] `grep -c "release-engineer\|performance-engineer" agents/cto/cto.md` == 0 (또는 "v0.50부터 COO 소관" 히스토리 주석 제외)
- [ ] `grep -c "retrospective-writer" agents/ceo/ceo.md` == 0
- [ ] `grep -c "technical-writer" agents/coo/coo.md` == 0
- [ ] `agents/coo/release-engineer.md` frontmatter `parent: coo`
- [ ] `scripts/vais-validate-plugin.js` 통과

연결 SC: **SC-1**

---

## 5. 다음 단계

- **03** Shared Guards — 01과 함께 완료된 후 진입 (둘 다 선행)
- **06** Phase Routers — 06에서 CEO 라우터가 새 sub-agent들을 알고 있어야 함
- **08** Cleanup — retrospective-writer/technical-writer 파일 실제 삭제
