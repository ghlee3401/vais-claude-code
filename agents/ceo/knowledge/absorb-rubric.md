# Absorb Rubric (CEO)

외부 레퍼런스 흡수 (absorb 모드) 시 절차. absorb-analyzer 와 함께 사용.

## 진입 트리거

자연어 키워드 또는 경로:
- "흡수", "absorb", "외부 레퍼런스" 키워드
- `references/_inbox/` 또는 사용자 지정 경로 언급

## Inbox 컨벤션

- raw 파일은 `references/_inbox/{topic}/` 에 배치 (임시, .gitignore)
- 흡수 결과는 `agents/`, `skills/`, `references/` (루트) 등 적절 위치 배치
- Do 완료 후 `_inbox/` 원본 삭제 (CP-A 에서 확인)

## absorb 모드 PDCA

| 단계 | 실행자 | 내용 | 산출물 |
|------|--------|------|--------|
| Plan | 직접 | 외부 파일 스캔 + 핵심 기능 추출 + 전략 판단 | `docs/{feature}/01-plan/main.md` |
| Design | absorb-analyzer | 중복 분석 + C레벨 배분 맵 + MCP 적합성 심화 분석 | (선택) |
| Do | 직접 | 배분 맵 기반 분기 실행 | `docs/{feature}/03-do/main.md` |
| Check | 직접 | 추가된 서브에이전트/MCP Tool 위치 검증 + 충돌 확인 | `docs/{feature}/04-qa/main.md` |
| Cleanup | 직접 | `_inbox/` 원본 삭제 + 사용자 확인 | — |
| Report | 직접 | `docs/absorption-ledger.jsonl` + 최종 보고 | (선택) |

## absorb Do 분기 (action 값 기반)

| action | 동작 |
|--------|------|
| `absorb` | 기존 방식, 배분 맵 기반 `agents/{c-level}/*.md` 또는 `skills/` 수정 |
| `absorb-mcp` | **MCP 경로** → `mcp/{name}-server.json` 생성 + `vendor/{name}/` 에 소스 배치 |
| `merge` | 기존 파일에 병합 |
| `reject` | 흡수 거부, Ledger 에 reject 기록 |

## MCP 경로 상세 (`absorb-mcp`)

1. 소스 배치 — `vendor/{name}/` 복사
2. `templates/mcp-server.template.json` 기반으로 `mcp/{name}-server.json` 생성 (name / tools.command / activation_phases / lazy_load=true)
3. Ledger 에 `absorb-mcp` + mcpMeta 기록
4. CP-A 에서 MCP 정보 (tool 이름 / 활성화 단계 / 커맨드) 표시

## CP-A — absorb 배분 맵 확인

**출력**: 상세 배분 테이블 (# / 대상 C레벨·MCP / action / 배치 경로 / 품질 점수 0~100 / 내용 요약) + 요약 (absorb N / merge N / reject N) + (MCP) Tool 이름·활성화 단계·커맨드 패턴.

**옵션**: A. 예 (배분 맵대로) / B. 수정 (번호 지정) / C. 취소 (absorb 중단)
