---
owner: ceo
artifact: working-notes
phase: ideation
feature: vais-positioning-rethink
---

# Working Notes — vais-positioning-rethink

> turn 별 핵심 흐름. 세션 재개 시 컨텍스트 회복용. 자유 형식, 자발적 누적.

## Session 1 — 2026-05-09

### Turn 1 — 사용자 화두 (3 가지)

> *"vais-code 는 내가 PO 로서 부족한 점을 채우기 위해서 agent 들을 만들고 개발 과정을 의미있게 진행하기 위한 하네스 시스템으로 만든거였어. 그런데 최근 claude-code 에서도 플랜 스킬이라든지 리뷰 스킬이 디폴트로 들어가 있고 agent 도 병렬로 처리하는 등 기본 기능이 좋아서, 지금 우리의 vais-code 가 오히려 템플릿에 의존하거나 너무 많은 문서를 만들고 있지 않나 싶어. 그리고 어떤 앱을 개발하게 되면 그 코드에서 claude.md 파일을 만든다든가, 그 코드 구조에서 사용할 context 나 convention 문서나 이런 것을 자동으로 만들어서 관리하는 것이 필요하다고 생각해. 너는 어떻게 생각해?"*

핵심 3 화두:
1. CC native (plan/review/parallel) 진화 → vais-code redundancy 우려
2. vais-code 가 템플릿 의존·doc 과다 (over-engineered) 인가
3. **target-app 컨텍스트 관리 (CLAUDE.md/conventions 자동 생성·유지) 부재**

### Turn 2 — CEO 진단 3 관찰

1. CC native 와 vais 의 진짜 차별화는 다른 축 (도메인 지식 박제, 객관적 라우팅, 비-코드 영역 커버)
2. 사용자 우려 정확한 부분: CTO PDCA ceremony 비용, doc 폭증, gap analysis 중복
3. 빠진 핵심 가치 = target-app context bootstrap → 새 가치 제안 가능성

3 가지 전략 옵션 제시: A (CTO 슬림화) / B (Target-app Bootstrap) / C (A+B 결합)
CEO candid 의견: **B 가 가장 시급**, A 는 다음, 한 번에 둘 다는 무거움.

### Turn 3 — 사용자 "더 토론" 선택

A/B/C 중 선택 거부, "다른 관점 듣고 싶음".

### Turn 4 — CEO 추가 6 관점

1. **Harness vs Platform 정체성 문제** — 원래 "1 PO 하네스" 였는데 47 sub-agent + MCP server 까지 platform 으로 비대
2. **경쟁 상대는 CC 가 아니라 "도메인 친구"** — 옆에 CFO/CMO/CSO 친구 없는 게 진짜 부재
3. **Doc 분량 = ceremony vs PM 일기** — 같은 doc 도 lifecycle 따라 의미 다름. 해법은 줄이기 X, lifecycle 개선 O
4. **CC 가 절대 안 만들 영역만 vais 차지** — 메서돌로지/페르소나/한국어 문화/long-term 컨텍스트
5. **누구를 위한 vais?** — 본인/1PO/팀/기업 따라 답이 다름
6. **메타: 이 ideation 자체가 vais 가치 검증** — vanilla CC 와 다른 답 = 가치 입증

핵심 질문 던짐: "*PO 로서 부족한 점*" 의 정확한 정체는 무엇인가?
4 후보: 다학제 도메인 지식 / 의사결정 객관화 / 컨텍스트 박제 / 다학제 페르소나 충돌 / target-app 관리

### Turn 5 — 사용자 답변: 다학제 도메인 지식

> *"PO 로서 가장 필요한 것은 다학제 도메인 지식인 것 같아. PO 로서 해야할 일들이 많이 있거든. 내가 만약에 부서를 맡았을 때 프로젝트의 A 부터 Z 까지를 기획을 해야돼. 운영은 어떻게 하고 전략은 어떻게 세우고 프로젝트 관리는 어떻게 하고 이런 것들. 그 다음에 문서는 어떻게 작성을 하고 팀원들한테는 어떻게 지시하고, 개발은 어떻게 하고 등등 이렇게 구체적으로 가는거지."*

핵심 키워드 추출:
- "부서를 맡았을 때 A → Z" — *부서장 매뉴얼* 비유 도출
- 7 개 영역 (기획/운영/전략/PM/문서/팀원지시/개발) 모두 vais 의 6 C-Level 매핑
- **"구체적으로 가는거지"** — 박제 깊이의 결정적 단서. framework 이름만 X, 실무 OJT 매뉴얼 ✓

### Turn 6 — CEO 정체성 재정의

> **vais-code = 혼자서 부서장 역할을 할 때 부족한 모든 도메인 지식·운영 매뉴얼·의사결정 패턴을 박제한 organization-in-a-box.**

이 정체성에서 도출된 4 모듈:
- M1. Knowledge Pack 강화 (가장 시급)
- M2. Delegation Protocol ("팀원 지시" 박제)
- M3. 문서 메타-가이드 ("문서 작성" 박제)
- M4. 부서장 Cadence (일/주/월/분기 자동화)

권장 로드맵 v0.66~v0.71: M1 → M2 → M3 → A (CTO 슬림화) → B (Target-app) → M4
v0.66 첫 sprint scope 좁힘: Tier-1 6 개 (각 C-Level 1 개씩, 부서장 OJT 매뉴얼 수준)

### Turn 7 — 사용자 우려: 컨텍스트 휘발

> *"로드맵은 좋아. 하지만 진행하면서 너무 길어지는 바람에 내용들을 까먹을 거 같아. 중간에 commit 하고 세션을 종료했다가 다시 시작할 수도 있으니까. 그건 어떻게 할래?"*

CEO 진단:
- 현재 메커니즘 한계 — status.json/memory.json/main.md 모두 *진행 중* ideation 안 잡음
- ideation-guard "중단 복원" 은 안내만, 회복할 *내용* 없음
- 즉, 종료하지 않은 ideation 은 commit 해도 휘발

CEO 4 보완 메커니즘:
1. ① working-notes 자동 누적 (LLM 매 turn 1~3 줄)
2. ② Decision Record append-only (확정 결정만)
3. ③ 사용자 "체크포인트" 키워드 (부분 정리, ideation 종료 X)
4. ④ session-start hook 자동 복원 (in-progress ideation 감지 시 5 줄 요약 표시)

권장 조합: ①+② 자동 + ③ 수동 + ④ 인프라.
즉시 액션 후보: 본 ideation 자체를 dogfood 박제.
로드맵 업데이트: M0 (Ideation Continuity) 를 v0.66 선결과제로 추가.

### Turn 8 — 사용자: "니가 추천을 해줘"

CEO 추천:
- 즉시 박제 (option 1) 실행
- v0.66 = M0 + M1 확정
- 근거: 의사결정 위임 발화 + compaction 시간 카운트 + 6 turn 토론 충분 + self-application 증거

즉시 실행:
1. `00-ideation/main.md` 작성 (5 섹션 인덱스)
2. `00-ideation/working-notes.md` 작성 (본 파일)
3. `.vais/status.json` 갱신 (vais-positioning-rethink 등록 + activeFeature 전환)
4. `MEMORY.md` 갱신 (1 줄 인덱스 + project memory 파일)

다음 단계: `/vais cpo plan vais-positioning-rethink` 권장 — PRD 작성으로 M0+M1 spec 구체화.

## Open Questions (미해결)

| Q | 메모 |
|---|------|
| Q1 | M1 Tier-1 6 개 박제 시 framework 선택 기준? (가장 자주 쓰는 것 vs 가장 차별화 큰 것 vs 사용자 즉각 효용 큰 것) |
| Q2 | M0 의 working-notes 자동 append 트리거? (매 turn / N turn 마다 / 사용자 명시 키워드만) |
| Q3 | "부서장 매뉴얼" 정체성을 README/AGENTS.md 에 명시할 것인가? (대외 메시지 일관성 vs 너무 좁아 보일 위험) |
| Q4 | Target-app Bootstrap (B) 우선순위 — v0.70 으로 미루는 게 맞나? 사용자 dogfood 외 외부 사용자 유입 동기로는 B 가 첫 trigger 일 수도 |
| Q5 | M2 Delegation Protocol 의 위치 — 별도 모듈 vs M1 Knowledge Pack 안에 흡수 (각 C-Level knowledge/ 에 "위임 방법" 챕터로) |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-09 | 초기 작성 — Session 1 (turn 1~8) 박제 |
