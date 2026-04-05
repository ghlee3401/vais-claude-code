# CTO Do — agent-description-normalization

## 1. 구현 결정사항

- 37개 에이전트 frontmatter `description`을 3인칭 영어 + "Use when:" 형식으로 변환
- C-Suite 에이전트(7개)는 기존 `Triggers:` 키워드 라인 유지
- 실행 에이전트(30개)는 `Triggers: (직접 호출 금지 — ...)` 라인 제거
- `## 역할` → `## Role` + 영어 요약 (해당 섹션이 있는 에이전트만: ceo, cto, cso + 기존 22개)
- Design 변환 맵을 그대로 적용, 이탈 없음

## 2. 변경 파일 목록

### CEO 조직 (3)
| 파일 | 변경 |
|------|------|
| `agents/ceo/ceo.md` | description + `## 역할` → `## Role` |
| `agents/ceo/absorb-analyzer.md` | description |
| `agents/ceo/retro.md` | description |

### CFO 조직 (3)
| 파일 | 변경 |
|------|------|
| `agents/cfo/cfo.md` | description |
| `agents/cfo/cost-analyst.md` | description |
| `agents/cfo/pricing-modeler.md` | description |

### CMO 조직 (4)
| 파일 | 변경 |
|------|------|
| `agents/cmo/cmo.md` | description |
| `agents/cmo/seo.md` | description |
| `agents/cmo/copywriter.md` | description |
| `agents/cmo/growth.md` | description |

### COO 조직 (5)
| 파일 | 변경 |
|------|------|
| `agents/coo/coo.md` | description |
| `agents/coo/canary.md` | description |
| `agents/coo/benchmark.md` | description |
| `agents/coo/sre.md` | description |
| `agents/coo/docs-writer.md` | description |

### CPO 조직 (7)
| 파일 | 변경 |
|------|------|
| `agents/cpo/cpo.md` | description |
| `agents/cpo/pm-discovery.md` | description |
| `agents/cpo/pm-strategy.md` | description |
| `agents/cpo/pm-research.md` | description |
| `agents/cpo/pm-prd.md` | description |
| `agents/cpo/ux-researcher.md` | description |
| `agents/cpo/data-analyst.md` | description |

### CSO 조직 (5)
| 파일 | 변경 |
|------|------|
| `agents/cso/cso.md` | description + `## 역할` → `## Role` |
| `agents/cso/security.md` | description |
| `agents/cso/validate-plugin.md` | description |
| `agents/cso/code-review.md` | description |
| `agents/cso/compliance.md` | description |

### CTO 조직 (10 + cto 본인)
| 파일 | 변경 |
|------|------|
| `agents/cto/cto.md` | description + `## 역할` → `## Role` |
| `agents/cto/architect.md` | description |
| `agents/cto/backend.md` | description |
| `agents/cto/frontend.md` | description |
| `agents/cto/design.md` | description |
| `agents/cto/qa.md` | description |
| `agents/cto/tester.md` | description |
| `agents/cto/devops.md` | description |
| `agents/cto/database.md` | description |
| `agents/cto/investigate.md` | description |

## 3. Design 이탈 항목

없음. Design 변환 맵을 100% 적용.

### 문서 동기화 (추가 작업)

| 파일 | 변경 |
|------|------|
| `CLAUDE.md` | C-Suite + Execution 테이블 Role 열 영어화 |
| `AGENTS.md` | C-Suite + Execution 테이블 역할 열 영어화 |
| `README.md` | 에이전트 역할 테이블 영어화 + 누락 하위 에이전트 추가 + 에이전트 수 37개로 갱신 |

## 4. 미완료 항목

없음.

## 5. 발견한 기술 부채

| 우선순위 | 항목 |
|---------|------|
| Low | 일부 에이전트 `version` 필드가 1.0.0에서 변경되지 않음 (patch bump 미적용) |
| Low | README.md 조직도 ASCII art가 하위 에이전트 전체를 반영하지 않음 (표시 공간 제약) |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | 초기 작성 — 37개 에이전트 description 정규화 완료 |
| v1.1 | 2026-04-05 | CLAUDE.md, AGENTS.md, README.md 동기화 추가 |
