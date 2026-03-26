# Design: interactive-patterns — vais-code 인터랙티브 패턴 보강

- **Date**: 2026-03-26
- **Author**: ghlee0304
- **Project**: vais-claude-code
- **Version**: 1.0
- **Architecture**: Minimal Changes (phase .md 텍스트 수정만)

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | bkit PDCA에서 multiSelect/preview/scope가 효과적임을 확인 → vais-code에도 적용 |
| **WHO** | vais-code 사용자 (웹 프로젝트 개발자) |
| **RISK** | 과도한 질문으로 워크플로우 속도 저하 → phase당 최대 3회 제한 |
| **SUCCESS** | 3가지 패턴이 각각 최소 2개 phase에 적용, auto 모드 호환 |
| **SCOPE** | skills/vais/phases/*.md 11개 파일 수정 |

---

## 1. 변경 대상 및 구체적 수정 내용

### P0 — 핵심 4개 Phase

#### plan.md
1. **multiSelect**: Step 1 MVP 범위 결정 후 — 기능 목록에서 MVP 포함 기능 복수 선택
2. **preview**: UI 컴포넌트 라이브러리 선택 — 각 라이브러리별 코드 예시 preview

#### design.md
1. **preview**: Checkpoint 3 설계안 선택 — 3가지 Option의 폴더 구조를 preview로 비교

#### frontend.md
1. **scope**: 구현 시작 전 — Session Guide Module Map에서 이번 세션 범위 선택
2. **multiSelect**: scope 내 컴포넌트/페이지 구현 순서 복수 선택

#### backend.md
1. **scope**: 구현 시작 전 — API 엔드포인트 그룹별 구현 범위 선택
2. **단일선택**: 구현 승인 체크포인트 추가

### P1 — 보강 4개 Phase

#### qa.md
1. **scope**: 검사 시작 — 전체 vs 카테고리별(빌드/갭/코드리뷰) 범위 선택
2. **multiSelect**: Review Decision에서 수정할 이슈 개별 선택

#### init.md
1. **multiSelect**: 기존 프로젝트 피처 선택 — 감지된 피처 중 VAIS 적용할 것 복수 선택

#### architect.md
1. **preview**: DB 타입 선택 — DB별 설정 코드/폴더 구조 preview 비교

#### commit.md
1. **preview**: 버전 범프 확인 — 변경될 파일/버전 diff preview

### P2 — 미사용 Phase에 AskUserQuestion 추가

#### manager.md
1. **단일선택**: 영향 분석 결과 후 실행 여부 확인

#### next.md
1. **단일선택**: 추천 다음 단계 + 대안 제시

#### status.md
1. **단일선택**: 상태 확인 후 바로 실행할 액션 선택

---

## 2. auto 모드 호환 규칙

모든 신규 체크포인트에 auto 모드 fallback 지침 포함:

```
auto 모드: {기본 동작} (체크포인트 스킵)
```

| 패턴 | auto 모드 기본 동작 |
|------|-------------------|
| multiSelect | Must/P0 우선순위 전체 선택 |
| preview | Recommended 옵션 자동 선택 |
| scope | 전체 범위 |
| 단일선택 확인 | "바로 실행" 자동 선택 |

---

## 3. Implementation Order

| 순서 | 파일 | 패턴 | 예상 변경량 |
|------|------|------|-----------|
| 1 | plan.md | multiSelect + preview | +20줄 |
| 2 | design.md | preview | +12줄 |
| 3 | frontend.md | scope + multiSelect | +20줄 |
| 4 | backend.md | scope + 단일선택 | +25줄 |
| 5 | qa.md | scope + multiSelect | +15줄 |
| 6 | init.md | multiSelect | +8줄 |
| 7 | architect.md | preview | +12줄 |
| 8 | commit.md | preview | +8줄 |
| 9 | manager.md | 단일선택 | +12줄 |
| 10 | next.md | 단일선택 | +12줄 |
| 11 | status.md | 단일선택 | +12줄 |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-26 | ghlee0304 | 초기 Design 문서 작성 |
