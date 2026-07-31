---
owner: ceo
agent: ceo
artifact: ideation-summary
phase: 00-ideation
feature: vais-v1-rewrite
source: 사용자-AI 대화 (2026-05-07 ideation 세션)
generated: 2026-05-07
summary: vais-code 자체 회고 ideation. 사용자 진단("시간 먹는 하마") + 사용 데이터(plan:do=26:3, 자산 사용률 17~27%) 검증 + 프론트엔드 마찰 6지점 식별 → v1.0 코치 모델 방향 도출.
---

# Ideation Summary: ceo / vais-v1-rewrite

> 진행일: 2026-05-07
> 진행자 C-Level: ceo
> 소요 대화 turns: 5 (사용자 4발화 + AI 4응답 + 진단 2회)
> Status: summarized → cto plan 진입

---

## Key Points

1. **원래 의도와 현실의 큰 갭** — 사용자(비개발자 PO)는 "탄탄한 앱을 만들 때 옆에서 빼먹는 걸 잡아주는 코치"를 원했으나, 현재 VAIS는 "조직 시뮬레이션 + 문서 박제 강제 시스템"이 됨. 사용자 표현: "시간 먹는 하마".

2. **사용 데이터가 진단 검증** — 만든 자산의 80~90%가 실사용 0회/저빈도:
   - C-Level 6 → 실호출 1 (CTO만, event-log 89개 중 13회)
   - Sub-agents 37 → 자기 정의 외 0회 호출 sub-agent 10+개
   - Templates 51 → 자기 정의 외 1회 미만 참조 41개
   - Phase 전환 89 이벤트 중 1회만 발생
   - **결정타: plan:do = 26:3** (계획만 8.7배, 실행 부족)

3. **프론트엔드 마찰 6지점 식별** — UI iteration 본질(빠른 변경) ↔ PDCA 본질(사전 정의·승인·검증)의 구조적 충돌:
   - Mandatory 게이트 강제 (cto.md:36 "스킵 금지")
   - AskUserQuestion phase 확인 매번 반복
   - ui-designer(241) + frontend-engineer(195) = 436줄 직렬 호출
   - wireframe/ia-design/visual-design-spec 박제 강제
   - design-system MCP Hard fail (단순 픽스에도 트리거)
   - 0회 호출 sub-agent 다수 (release-engineer 5분해 후 5개 다 죽음)

4. **타깃 다양성** — vais-code를 플러그인으로 쓸 "다른 앱"이 B2C 웹/모바일 + B2B SaaS + 1인 사이드/MVP **세 가지 모두**. 단일 default profile 불가능 → 공통 코어 + 옵션 모듈 구조 필요.

5. **사용자가 원하는 "코치"의 정의** = **전체 동반형** (기획-실행 보조 + 리뷰-제안 + 막힘 풀이 동시).

## Decisions

1. **방향 D (깊은 진단 먼저) 채택 → 진단 충분히 모임 → 즉시 v1.0 plan 진입.**
2. **v1.0 핵심 통찰: PDCA는 옵트인, 자유 흐름이 default.**
3. **Frontend iteration 모드 도입** — ui-designer + frontend-engineer 통합한 단일 코치 agent (가칭 ui-coach), MCP는 background 자동 사용, 디자인 크리틱은 명시 호출 시만.
4. **자산 정리 매트릭스 1차 확정**:
   - 보존: security-auditor / code-reviewer / qa-engineer / incident-responder / ui-designer / infra-architect / backend-engineer / frontend-engineer
   - 통합/제거: 0회 호출 sub-agent 10+개, 41개 미사용 templates, 6 C-Level 메타포어 → 1 코치, PDCA mandatory 게이트
   - 핵심 가치 보존: design-system MCP, pre-commit path 차단, design-mcp-trigger hook
5. **CLAUDE.md mandatory rules 14 → 5로 압축 목표.**

## Open Questions

(plan 단계에서 다룰 것)

1. **v1.0 이름 결정** — `vais-code` v1.0 vs 새 이름(예: `code-coach` 등) — plan 초반에 확정.
2. **공통 코어 + 옵션 모듈 구조 구체화** — 모듈 단위(예: `core` / `b2c-frontend` / `b2b-saas` / `mvp-fast`)? activation 방식?
3. **마이그레이션 전략** — 기존 0.64.x 사용자(주로 본인 도그푸딩)의 docs/ 산출물 + .vais/ 상태 어떻게 이전?
4. **Backend / QA 마찰도 frontend와 동일 패턴인지 추가 검증 필요할 수 있음** (이번 세션은 frontend만 깊이 봤음).
5. **사용자(PO)의 직접 호출 인터페이스** — `/vais` 슬래시 명령 유지? 아니면 더 가볍게 자연어 진입?
6. **"빼먹은 것 알려주기" 메커니즘** — 체크리스트는 어디에 박제? (CLAUDE.md 룰? sub-agent? output style?)
7. **PDCA 옵트인 트리거** — 사용자가 명시 호출(`/vais plan {feature}`)한 경우만? 아니면 코치 agent가 "이건 큰 작업이니 plan 먼저 할까요?" 제안?

## Next Step

- **C-Level**: cto
- **Phase**: plan
- **Feature**: vais-v1-rewrite
- **이유**: 진단 충분, 즉시 설계 진입. CTO가 plan에서 v1.0 아키텍처(공통 코어 + 옵션 모듈) + 마이그레이션 전략 + 자산 정리 우선순위 도출.

---

## Raw Context (사용자 핵심 발화)

> "AI가 자기 마음대로 진행하지 말고 context 폴더를 그 안에 사용자가 파일을 넣고 소통하면서 개발. 그리고 어떤 것들을 했는지 사용자한테 보고하고 사용자는 궁금한 거 있으면 물어보고 문서 정리하고 이런 것을 원했는데 지금은 그것보다 과하다."

> "프론트엔드 개발 시에 좀 그런 비효율을 많이 느꼈어. 나는 비 개발자로 탄탄한 앱을 만드는데 vais-code가 코치로서 함께하길 바라는데 오히려 시간 먹는 하마 느낌이야."

> "지금 만들어진 플러그인 full로 만들어진 거라면 실제로 사용가능하고 편하고 나이스한 플러그인이 되기 위한 개선이 필요해."

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-07 | 초기 작성 — ideation 진단 박제 (CEO ideation 1세션, 데이터 진단 2회) |
