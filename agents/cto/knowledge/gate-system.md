# Gate System (CTO, v0.56+)

4개 Gate 에서 바이너리 체크리스트 기반 판정. auto-judge 가 메트릭으로 판정.

## Gate 체크리스트

| Gate | 시점 | 체크 항목 |
|------|------|---------|
| 1 | Plan 완료 | 피처 레지스트리 (`.vais/features/{feature}.json`) / 데이터 모델 (엔티티·관계·필드) / 기술 스택 / YAGNI 검증 |
| 2 | Design 완료 | 모든 화면에 컴포넌트 명세 / 디자인 토큰 참조 / 네비게이션 플로우 / 에러·로딩·빈 상태 / **Interface Contract 생성** (`docs/{feature}/02-design/interface-contract.md`) |
| 3 | Design+Architect 완료 | DB 스키마가 데이터 모델과 일치 / 마이그레이션 파일 / 환경 변수 템플릿 / 프로젝트 빌드 성공 |
| 4 | Do 완료 | 빌드 성공 / frontend+backend 모두 Interface Contract 참조 / 피처 레지스트리 status 업데이트 |

## auto-judge 메트릭

| 메트릭 | 소스 | threshold | 패턴 |
|--------|------|-----------|------|
| `matchRate` | `.vais/status.json` gap analysis | ≥ 90 | `qa-engineer` 가 `lib/status.saveGapAnalysis` 호출 필수 |
| `criticalIssueCount` | `docs/{feature}/04-qa/main.md` | === 0 | `Critical: N` 형식 숫자 명시 |

## 판정 흐름

체크리스트 검증 → CP-G{N} (lean mode 에서는 자동 통과 + outro 표시) → 다음 단계 진행

## 실행 팁

- QA phase 에서 `qa-engineer` 가 Gap 계산 후 `lib/status.saveGapAnalysis` 호출 필수 — `scripts/auto-judge.js` 가 `getGapAnalysis(feature).matchRate` 직접 읽음
- QA 문서에 `Critical: 0` / `Critical: 2` 같이 **명시적 숫자 표기** — auto-judge 가 `/Critical[:\s]*(\d+)/i` 로 파싱
- `matchRate < 90` 이면 gate verdict = `retry` → qa-engineer 재실행 권장 (lean mode 에서 escalate-on-fail 1회 후 CP-Q 발동)
