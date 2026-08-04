---
owner: ceo
artifact: codex-repo-analysis
phase: ideation
feature: multimodel-repo-analysis
agent: codex
generated: 2026-05-12
summary: "vais-code 전체 구조를 검토하고 강점, 핵심 리스크, 개선 우선순위를 정리한 1차 분석"
---

# Codex 1차 repo 분석

## 한 줄 결론

이 repo 는 단순 Claude Code 플러그인이라기보다 **PO 가 Claude Code 안에서 가상 C-Suite 조직을 굴리기 위한 운영 하네스**에 가깝다. 핵심 아이디어와 뼈대는 강하지만, v0.65 → v0.66 전환 흔적 때문에 정책·문서·코드·검증기가 일부 엇갈려 있다.

## 검증 결과

| 항목 | 결과 |
|------|------|
| `npm test` | 통과 — 281 tests, 278 pass, 3 skipped |
| `npm run lint` | 통과 |
| `node scripts/vais-validate-plugin.js .` | 통과 |
| git status | clean |
| 기존 docs 검증 | `docs/vais-positioning-rethink` 에 W-MRG-03 / W-SCOPE 경고 존재 |

## 강점

- `CLAUDE.md` / `ONBOARDING.md` / `skills/vais/SKILL.md` 의 역할 분리가 명확하다.
- `vais.config.json` 이 C-Suite, phase, gate, artifact mapping 의 중심 SoT 역할을 한다.
- Bash guard, path traversal 방지, project-profile secret scan, MCP 입력 검증 등 하네스 안전장치가 실용적이다.
- "organization-in-a-box / 부서장 OJT 매뉴얼" 포지셔닝은 vanilla Claude Code 와 차별점이 분명하다.
- 테스트 커버리지가 하네스 성격에 비해 넓다.

## 핵심 리스크

| 우선순위 | 리스크 | 근거 |
|----------|--------|------|
| P0 | CEO 알고리즘 호출 예시가 실제 코드와 불일치 | `agents/ceo/ceo.md` 는 `analyzeCEO({input})` 예시를 쓰지만, `lib/ceo-algorithm.js` 는 `rawText` 를 읽는다. CEO 핵심 가치인 7차원 라우팅이 실제 요청을 못 볼 수 있다. |
| P0 | 버전/메타 문서가 갈라짐 | `package.json` / `vais.config.json` 은 0.66.0, README/ONBOARDING 은 0.65.3. marketplace 설명은 frontmatter 8 fields 라고 말하지만 v2.1 정책은 4 fields. |
| P1 | COO 가 레거시 `release-engineer` 를 아직 참조 | 실제 config 는 `ci-cd-configurator`, `container-config-author`, `migration-planner`, `runbook-author`, `release-notes-writer` 로 분해됐지만 `agents/coo/coo.md` 와 일부 whitelist 는 과거 명칭을 유지한다. |
| P1 | v2.1 main.md 정책과 doc-validator 가 완전히 합쳐지지 않음 | 현 정책은 main.md 5섹션 인덱스인데 validator 는 topic 파일 2개 이상일 때 `## [CPO]` 식 owner H2 섹션을 요구한다. |
| P1 | 사용자에게 보이는 명령어 안내 일부가 레거시 | `hooks/session-start.js` 는 `/vais auto`, `/vais plan` 을 보여주지만 output style 은 `/vais {c-level} {phase} {feature}` 4-token 을 엄격히 요구한다. |
| P2 | design-system MCP 산출 위치가 모호 | `lib/mcp-validator.js` 는 plugin root 기준 `design-system/{feature}/MASTER.md` 에 쓰는데 target app 산출물인지 plugin cache 인지 정책이 불명확하다. |

## 개선 우선순위

1. P0 — CEO 호출 버그 수정: `input` / `rawText` 호환 또는 문서 예시 수정 + 회귀 테스트 추가.
2. P0 — README / ONBOARDING / marketplace / version / frontmatter 설명 정렬.
3. P1 — COO 문서와 `agent-start.js` whitelist 를 config 기반으로 자동화.
4. P1 — doc-validator 를 v2.1 main.md 정책에 맞게 정리.
5. P1 — SessionStart 명령어 안내를 `/vais ceo|cto phase feature` 체계로 정리.
6. P2 — MCP generated design-system 위치를 target project vs plugin cache 중 하나로 결정.
7. P2 — 테스트의 `MaxListenersExceededWarning` 과 skipped prompt-handler 잔여 테스트 정리.

## 논의용 질문

- CEO 알고리즘은 `rawText` 만 정본으로 둘 것인가, `input` alias 를 backward-compatible 하게 받을 것인가?
- `main.md = 5섹션 인덱스` 정책에서 owner H2 섹션은 완전히 폐기할 것인가, multi-owner 충돌 시에만 optional 로 둘 것인가?
- COO release-engineer 분해 후 명칭은 config 를 유일한 SoT 로 삼고 문서/whitelist 를 생성형으로 맞출 것인가?
- design-system MCP 는 plugin 내부 지식 캐시인가, target app 에 남는 산출물인가?

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-12 | Codex 1차 전체 분석 저장 |
