# skill-validator-absorption — CSO 위협 분석 / 검증 범위 (Plan)

> 참조: `docs/01-plan/ceo_skill-validator-absorption.plan.md` (v1.2)
> `docs/02-design/cto_skill-validator-absorption.design.md` (v1.1)
> `docs/03-do/cto_skill-validator-absorption.do.md` (v1.0)
> `docs/04-qa/cto_skill-validator-absorption.qa.md` (v1.0)

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Attack Surface** | 신규 Python 스크립트 2개(quick_validate, utils) + 신규 agent md 1개. 외부 입력은 CLI argparse `path` 인자만. 네트워크/DB/secret 접근 없음 |
| **Top Threat** | path traversal — 사용자 임의 경로의 .md 파일을 read하므로 호출자(skill-validator agent)가 신뢰 경계 책임 |
| **Current Posture** | YAML safe_load 사용, subprocess 없음, eval/exec 없음. CTO QA에서 코드 품질 PASS. **Gate A/B 정밀 점검 필요** |
| **Target** | scripts/skill_eval/, agents/cso/skill-validator.md, 수정된 cso.md |

📊 검사 대상 파일: 5개 (신규 3 + 수정 2)
📍 주요 검사 영역:
- **Gate A**: 입력 검증, path traversal, YAML 파싱 안전성, 정보 노출
- **Gate B**: skill-validator dogfooding (skill/agent 38개 일괄 검증)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 신규 흡수 코드의 OWASP 점검 + 신규 skill-validator의 self-dogfooding 통합 검증 |
| **WHO** | CSO(Gate A 보안 / Gate B 품질), security-auditor / skill-validator delegation |
| **RISK** | path traversal (skill-validator는 임의 경로를 받음) / unexpected 필드 화이트리스트 누락으로 인한 false-warn |
| **SUCCESS** | Gate A: OWASP 8/10 + Critical 0건 / Gate B: 38개 agent 0 fail (현재 36 PASS + 2 WARN) |
| **SCOPE** | 본 피처에서 추가/수정된 5개 파일만. 기존 ceo.md/cto.md WARN(>500 lines)은 별도 리팩토링 이슈로 분리 |

---

## Gate A — 보안 검토 범위

### 점검 대상 OWASP 항목

| OWASP 카테고리 | 적용 여부 | 점검 포인트 |
|---------------|-----------|-------------|
| A01: Broken Access Control | ⚠️ 적용 | 임의 .md 파일 read 권한 — skill-validator가 받는 path 신뢰 경계 |
| A02: Cryptographic Failures | ❌ N/A | 암호화 사용 없음 |
| A03: Injection | ✅ 적용 | YAML injection (safe_load 사용 확인), command injection (subprocess 없음 확인) |
| A04: Insecure Design | ✅ 적용 | exit code 차등 처리 설계 검토, fail-safe 기본값 |
| A05: Security Misconfig | ✅ 적용 | argparse 기본값 안전성 (--target=auto, --format=text) |
| A06: Vulnerable Components | ✅ 적용 | PyYAML 버전 ≥6.0 권장 (CVE-2017-18342 이전 버전 차단) |
| A07: Auth Failures | ❌ N/A | 인증 없음 |
| A08: Software Integrity | ⚠️ 적용 | 흡수 출처 명시 검증 (Co-Authored 주석 + ledger) |
| A09: Logging Failures | ❌ N/A | 로깅 없음 |
| A10: SSRF | ❌ N/A | 네트워크 호출 없음 |

### 핵심 점검 포인트

1. **Path Traversal** (`scripts/skill_eval/quick_validate.py`)
   - 사용자가 `../../etc/passwd`를 넘기면? → `.suffix == ".md"` 체크로 비-md 파일은 거부되지만, 임의 .md 파일은 read 가능
   - 영향: 정보 노출 (read-only). write/exec 없음
   - 완화: skill-validator agent 워크플로우에 "신뢰된 경로만 전달" 명시 필요 여부 검토

2. **YAML 파싱 안전성** (`scripts/skill_eval/utils.py`)
   - `yaml.safe_load` 사용 확인 ✅ (yaml.load 위험 함수 미사용)

3. **PyYAML 버전 의존성**
   - 현재 시스템: 6.0.1 ✅
   - skill-validator agent의 환경 요구사항 섹션에 ≥6.0 명시 확인

4. **License/Attribution**
   - 원본 출처: `references/skills/skills/skill-creator/scripts/{quick_validate,utils}.py`
   - utils.py 모듈 docstring에 출처 명시 ✅
   - quick_validate.py 모듈 docstring에 출처 명시 ✅
   - LICENSE 호환성: 원본 LICENSE.txt 확인 필요 (Gate A Do 단계)

---

## Gate B — 플러그인 검증 범위

### 서브 에이전트 분기 결정

cso.md v3.2.0의 Gate B 분기표에 따라:

| 대상 | 사용 에이전트 | 사유 |
|------|---------------|------|
| 본 피처 5개 신규/수정 파일 | **skill-validator** | 개별 skill/agent .md 작성 품질 |
| (옵션) 플러그인 전체 38 agents | **skill-validator** 일괄 | 회귀 검증 + dogfooding |
| 마켓플레이스 배포 검증 | validate-plugin | 본 phase 범위 밖 |

### 셀프 Dogfooding 검증 매트릭스

| 검증 대상 | 기대 결과 | 사유 |
|-----------|-----------|------|
| `agents/cso/skill-validator.md` | ✅ PASS | 본인이 본인을 검증 — 신뢰성 핵심 지표 |
| `agents/cso/cso.md` (수정본) | ✅ PASS | Gate B 분기 추가 후 frontmatter 무결성 |
| `skills/vais/SKILL.md` (직접 경로) | ✅ PASS skill 모드 | QA G2 픽스 회귀 |
| `skills/vais` (디렉토리 경로) | ✅ PASS skill 모드 | 정상 케이스 |
| `agents/*/*.md` 38개 일괄 | ✅ 0 FAIL | 회귀 보장 (현재 36 PASS + 2 WARN) |

### Gate B 판정 기준

| 결과 | 조건 | 액션 |
|------|------|------|
| ✅ Pass | 본 피처 5개 파일 PASS + 38 agent 0 fail + 셀프 dogfooding PASS | 통과 선언 |
| ⚠️ 조건부 | 본 피처는 PASS but 기존 파일에 WARN 유지 | 통과 + 별도 이슈로 분리 권장 |
| ❌ Fail | 본 피처 파일 중 1건이라도 FAIL | CTO 핸드오프 |

---

## 위험도 평가

| 위험 항목 | 가능성 | 영향 | 종합 |
|-----------|--------|------|------|
| Path traversal로 정보 노출 | 중 | 낮 (read-only, 호출자 신뢰 경계) | 🟡 Important |
| PyYAML CVE 노출 | 낮 | 중 | 🟢 Info (≥6.0 명시 권장) |
| LICENSE 호환성 미확인 | 낮 | 중 | 🟡 Important (Gate A Do에서 확인) |
| skill-validator 자체 description heuristic 우회 | 매우 낮 | 낮 | 🟢 Info |
| 38개 agent 회귀 실패 | 낮 | 높 | 🟡 Important (Gate B에서 자동 탐지) |

Critical 항목 없음 → CP-C 트리거 안 함 (현 시점).

---

## Do 단계 위임 계획

| 단계 | 실행자 | 작업 | 산출물 |
|------|--------|------|--------|
| Do | security-auditor | OWASP A01/A03/A04/A05/A08 정밀 점검 (위 5개 파일) | `docs/03-do/cso_{feature}.do.md` (Gate A 섹션) |
| Do | skill-validator | 본 피처 5개 + 38 agent dogfooding 일괄 검증 | `docs/03-do/cso_{feature}.do.md` (Gate B 섹션) |

> **CP-2 멈춤 지점**: Plan 승인(본 문서) 후, Do 시작 전 사용자에게 `[CP-2]` AskUserQuestion 호출

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-07 | 초기 작성 — Gate A + B 범위 정의, OWASP 매핑, dogfooding 매트릭스, Critical 없음 확인 |
