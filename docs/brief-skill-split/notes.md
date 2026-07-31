---
feature: brief-skill-split
updated: 2026-07-31
---

# brief-skill-split — Notes

- 2026-07-31: 이름 `brief` 확정 — 임원 보고(briefing) 의미 직관적, 기존 report 와 혼동 없음 (AskUserQuestion)
- 2026-07-31: 기존 report/deck 은 피처 전용으로 축소하기로 — 주제/피처 이중 모드가 혼란 원인이라는 사용자 지적
- 2026-07-31: phases/plan.md 의 status 갱신 예시가 setPhase 로 적혀 있으나 실제 API 는 initFeature/updatePhase — do 단계에서 예시 문구 교정 검토
- 2026-07-31: brief 산출 기본 경로 reports/{YYYY-MM-DD}-{slug}.html — 피처 assets 와 분리, 아웃라인 승인 때 경로 확정
- 2026-07-31: report 스킬 1단계에 미등록 피처 가드 추가 — 오타 시 비슷한 피처 제시 후 brief 안내 (이전 논의의 모드 선언 빈틈 해소)
- 2026-07-31: validator 는 skills/vais/SKILL.md 만 검사 — brief 신설에 validator 수정 불필요 확인
- 2026-07-31: 결함 교정 - phases/plan.md setPhase 예시를 initFeature/updatePhase 로 수정, 교훈은 doc-conventions 로 승격
