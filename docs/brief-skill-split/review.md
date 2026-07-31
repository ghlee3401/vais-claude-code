---
feature: brief-skill-split
updated: 2026-07-31
---

# brief-skill-split — Review

## 완료 조건 대조 (4/4)

- [x] `npm test` green + validator 통과 — 76/76 pass, 검증 경고 0건
- [x] `/vais brief` 라우팅 존재 — SKILL.md 액션 표 27행 + 실행 절 35행 + Triggers, `skills/brief/SKILL.md` 생성 확인
- [x] report SKILL.md 주제 모드 잔재 없음 — `{주제|feature}` 표기 제거, 남은 "주제" 언급 2건은 brief 안내 문구
- [x] help/README/CLAUDE.md 커맨드 목록에 brief 반영, report/deck 은 피처 전용 표기 — grep 대조 확인

## 남은 일

- 없음. (security-auditor 스킵 — markdown 스킬 문서만 변경, 인증/입력 처리/의존성 무관)
- 결함 교정 1건 포함: `phases/plan.md` 의 status 갱신 예시가 존재하지 않는 `setPhase` 로 기재 → `initFeature`/`updatePhase` 로 교정

## 교훈

- 커맨드가 소재(피처 문서 vs 임의 자료)에 따라 이중 모드가 되면 도구 성격이 흐려진다 — 소재가 다르면 스킬을 분리하는 편이 명료
- 스킬 문서의 코드 예시가 실제 lib export 와 어긋난 채 방치돼 있었다 (setPhase) — 승격 후보

승격: 문서 속 코드·API 예시는 실제 export 와 대조 후 기재 → doc-conventions.md
