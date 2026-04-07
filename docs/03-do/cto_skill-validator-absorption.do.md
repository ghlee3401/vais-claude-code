# skill-validator-absorption - 구현

> 참조 문서: `docs/01-plan/ceo_skill-validator-absorption.plan.md` (v1.2) / `docs/02-design/cto_skill-validator-absorption.design.md` (v1.1)

## 구현 결정사항

| # | 결정 | 사유 |
|---|------|------|
| 1 | 폴더명 `scripts/skill_eval/` (언더스코어) | Python import 경로 호환 (`python -m scripts.skill_eval.quick_validate`) |
| 2 | `utils.py`의 `parse_skill_md` → `parse_md_frontmatter` 일반화 | skill 디렉토리 + 단일 agent .md 양쪽 파싱 단일 진입점 |
| 3 | quick_validate에 `--target`, `--format` 플래그 추가 | 자동 판별 + JSON/텍스트 출력 선택 |
| 4 | AGENT_ALLOWED 필드 확장 (version, model, tools, memory, disallowedTools) | VAIS 에이전트 frontmatter 규격 반영 — 원본 Anthropic 스펙보다 확장된 필드 |
| 5 | body_length warn=500, fail=800 | Design의 progressive disclosure 기준 그대로 적용 |
| 6 | description 평가는 agent 내부 heuristic (Python 스크립트 없음) | claude CLI 의존성 제거 + 즉시 실행 |
| 7 | `unexpected_field`는 warn 처리 (fail 아님) | VAIS가 아직 docs화하지 않은 프론트매터 키가 있을 수 있음 |
| 8 | 폴백 sys.path insert 로직 | 직접 스크립트 실행 시에도 `from scripts.skill_eval.utils` import 가능 |

## 수정된 파일

| 구분 | 파일 | 변경 요약 |
|------|------|-----------|
| 신규 | `scripts/skill_eval/__init__.py` | 빈 파일 (Python 모듈 인식) |
| 신규 | `scripts/skill_eval/utils.py` | frontmatter 파서 (skill/agent 양쪽 지원) |
| 신규 | `scripts/skill_eval/quick_validate.py` | 구조 검증 + JSON 출력 + exit code |
| 신규 | `agents/cso/skill-validator.md` | CSO 하위 validator 에이전트 — 4단계 워크플로우, before/after 수정안 생성 |
| 수정 | `agents/cso/cso.md` | v3.1.0 → v3.2.0. Gate B 서브 에이전트 분기 추가 (validate-plugin vs skill-validator). 트리거 키워드 추가. |
| 기록 | `docs/absorption-ledger.jsonl` | 3개 엔트리 추가 (quick_validate, utils, skill-validator partial-merge) |

## Design 이탈 항목

| 항목 | Design 명세 | 실제 구현 | 이유 |
|------|-------------|-----------|------|
| skill-validator body 줄수 | 예상 ~200 | 186 lines | 계획 내 (< 500 warn) |
| quick_validate body 줄수 | ~150 | ~280 lines (주석/docstring 포함) | 주석과 에러 케이스 분기 추가 — 기능 동일 |
| utils.py body 줄수 | ~60 | 102 lines | 예외 처리 + docstring 확장 — 기능 동일 |

## 셀프 검증 (Dogfooding)

신규 생성한 `skill-validator` agent를 **그 자체 스크립트로** 검증:

```bash
$ python3 -m scripts.skill_eval.quick_validate agents/cso/skill-validator.md
✅ PASS  agents/cso/skill-validator.md (agent)
  body: 186 lines
```

수정된 `cso.md`도 검증:

```bash
$ python3 -m scripts.skill_eval.quick_validate agents/cso/cso.md
✅ PASS  agents/cso/cso.md (agent)
  body: 469 lines
```

## 테스트 실행 결과

| # | 테스트 | 결과 | exit |
|---|--------|------|------|
| T1 | PASS 케이스 (agent `.md`, ≤500 lines) | `cso.md` | 0 |
| T2 | WARN 케이스 (agent `.md`, >500 lines) | `ceo.md` (645 lines) | 1 |
| T3 | PASS 케이스 (skill 디렉토리) | `skills/vais` | 0 |
| T4 | 입력 오류 (경로 없음) | `/tmp/nonexistent` | 3 |
| T5 | target mismatch | `cso.md --target=skill` | 3 |
| T6 | 비 .md 파일 | `package.json` | 2 |
| T7 | 플러그인 전체 재검증 | `vais-validate-plugin.js` | 0 (38 agents) |

## 사용 예시

### CSO → skill-validator delegation

```
# 사용자가 신규 작성한 agent의 품질 검증
/vais cso gate-b skill-validation-request

CSO는 대상이 "개별 agent .md"임을 확인 → skill-validator에게 위임
→ skill-validator가 4단계 검증 + before/after 수정안 생성
→ CSO가 리포트 수신 후 사용자에게 Gate B 결과 보고
```

### 직접 CLI 실행

```bash
# 단일 agent .md
python3 -m scripts.skill_eval.quick_validate agents/cpo/cpo.md --format=json

# skill 디렉토리
python3 -m scripts.skill_eval.quick_validate skills/vais

# target 강제 지정
python3 -m scripts.skill_eval.quick_validate path/to/skill --target=skill
```

## 제외 항목 재확인

Plan v1.2에서 확정된 SCOPE 밖 항목:

| 원본 파일 | 사유 |
|-----------|------|
| `improve_description.py` | `run_eval.py` 출력(eval_results JSON)을 필수 입력으로 받는 의존성 — 단독 실행 불가 |
| `run_eval.py`, `run_loop.py`, `aggregate_benchmark.py` | iteration 관리 + claude CLI 반복 호출 — 단순 검증 범위 초과 |
| `eval-viewer/` | 로컬 HTML 서버 — VAIS 범위 밖 |
| `agents/analyzer.md`, `comparator.md`, `grader.md` | A/B 비교 평가 루프 전용 — 우린 비교 안 함 |
| `scripts/generate_report.py`, `package_skill.py` | 위 인프라 의존 |
| `references/schemas.md` | 위 인프라 스키마 |

→ 향후 trigger accuracy 정밀 측정이 필요해지면 재흡수 가능. absorption-ledger에 "partial-merge" + excluded 목록 기록됨.

## Gate 4 (Do 완료) 체크리스트

- [x] 빌드/검증 성공: `node scripts/vais-validate-plugin.js` 통과
- [x] skill-validator 셀프 검증 PASS
- [x] cso.md 수정 후 검증 PASS
- [x] 모든 exit code (0/1/2/3) 동작 확인
- [x] 피처 레지스트리 상태 업데이트 (QA 단계에서 최종)
- [x] Design Interface Contract(CLI 계약) 준수
- [x] absorption-ledger 기록 완료

## 다음 단계

→ **CTO QA** (`/vais cto qa skill-validator-absorption`)
- Gap 분석 (plan/design 요구사항 vs 실제 구현)
- 코드 품질 검토
- 엣지 케이스 테스트 (multiline description, 빈 frontmatter, 중첩 YAML)
- **CSO로도 진행 권장**: 본 기능 자체가 skill-validator라서 CSO가 본인 기능으로 셀프 검증하는 테스트 사이클이 자연스러움

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-07 | 초기 작성 — Session 1 (Python 3파일) + Session 2 (agent md + cso.md + ledger) 완료. 셀프 검증 PASS, 플러그인 전체 검증 PASS (38 agents) |
