# ncai-add-absorb - 구현 로그 (Do)

> 입력: `docs/01-plan/ceo_ncai-add-absorb.plan.md` (v1.1), `docs/02-design/cto_ncai-add-absorb.design.md`
> 범위: `templates/design.template.md` 단일 파일 확장 + 동시 다이어트
> 비범위: CHANGELOG 엔트리, 버전 범프(7곳) — `/vais commit` 단계에서 처리

---

## 1. 구현 결정사항

| # | 결정 | 근거 |
|---|------|------|
| D-1 | Architecture Options 산문 A/B/C 3단락 + Comparison 표 + Selected 블록을 **단일 비교 표**로 통합 | Design §4.2 — 22줄 → 9줄 |
| D-2 | 1.2 네비게이션 표의 GNB/LNB 2행을 "GNB/LNB" 1행으로 압축 | Design §4.3 D-4 |
| D-3 | 1.4 화면 흐름도 섹션 완전 삭제, 1.5 화면 목록을 **1.4로 리넘버링** | Design §4.3 D-5 — 1.1 사이트맵이 동일 역할 수행 |
| D-4 | Part 4/5 직전에 CTO 전용 통합 격리 박스 4줄 배치 (옵션 B) | Design §3.3 |
| D-5 | Part 4 Tech Stack Lock: Backend/Frontend/Auth·Infra 3행 × 5컬럼(영역/Lang/라이브러리/데이터/금지) | Design §1.2 |
| D-6 | **모든 Tech Stack Lock 셀은 `{placeholder}` 빈 양식** — 특정 기술명(FastAPI/React 등) default 0건 | Plan HC-1 빈 양식 흡수 원칙 |
| D-7 | Part 5.1 Layer Responsibility 3행(Router/Service/Repository) | Design §2.2 |
| D-8 | Part 5.2 API Contract 6컬럼(Method/Path/Request/Response/Auth/Errors) + 1행 샘플 | Design §2.4 |
| D-9 | Part 5.3 State Machine을 **inline 1줄 안내**로 최대 압축 (표 없음, 작성 시에만 추가) | Design §6.1 줄수 예산 필요 시 압축 허용 |
| D-10 | 변경 이력에 v1.1 엔트리 1줄 추가 (2026-04-08) | Design §5 최종 섹션 순서 |

### Design 대비 이탈 항목

| # | 이탈 | 이유 |
|---|------|------|
| I-1 | Design §6에서 예상한 최종 308 → 300줄로 더 타이트하게 압축 | Plan HC-4 "≤300줄 이내" 가드 엄수. Part 5.3 표를 제거하고 1줄 inline 안내로 대체 (Design §6.1이 명시적으로 허용한 압축 경로) |
| I-2 | 1.4 화면 흐름도 삭제로 1.5 화면 목록이 1.4로 리넘버링됨 | Design §4.3에서 예고된 통합. 기존 `docs/02-design/*.design.md` 산출물은 Part 4/5와 무관하므로 호환성 영향 없음 (리넘버링은 template 전용) |
| I-3 | T1 유저플로우 목록(사용자 목표/시작점/종료 조건)을 1줄 슬래시 구분으로 압축 | 300줄 가드 충족을 위한 추가 트리밍. 의미 손실 없음 |

---

## 2. 변경 파일 목록

### Modified
- `templates/design.template.md` (286 → 300줄, +14)

### Created
- `docs/03-do/cto_ncai-add-absorb.do.md` (본 문서)

### Deleted
- 없음

---

## 3. 검증 결과

### 3.1 줄수 검증 (Plan HC-4)

| 항목 | 값 |
|------|---|
| 시작 | 286 |
| 종료 | **300** |
| 순증 | +14 |
| 목표 | 290~300 |
| 통과 | ✅ 상한 정확히 충족 |

검증 명령: Grep `.*` count → 300

### 3.2 회사명/출처 0건 검증 (Plan HC-2, §1.4)

검증 명령:
```bash
grep -i "ncai\|nano\|ncsoft" templates/design.template.md
```

결과: **0건** (Grep 도구로 검증 완료, "No matches found")

### 3.3 빈 양식 검증 (Plan HC-1)

추가 검증으로 대표 기술명 grep:
```bash
grep -E "FastAPI|React|PostgreSQL|Spring|Vue|Django|MySQL|MongoDB|Redis" templates/design.template.md
```

결과: **0건** — Tech Stack Lock 모든 셀이 `{placeholder}` 빈 양식.

### 3.4 Plan Success Criteria 체크

| # | Criteria | 상태 | 근거 |
|---|---------|------|------|
| 1 | `templates/design.template.md`가 290~300줄 이내 | ✅ | 300줄 |
| 2 | Part 4 Tech Stack Lock 표에 backend/frontend/auth 3행 + 금지 컬럼 | ✅ | 라인 248-252 |
| 3 | Part 4 셀이 모두 빈 양식 `{placeholder}` | ✅ | §3.3 검증 |
| 4 | Part 5 Implementation Contract에 Router/Service/Repository 3행 + API Contract 표 | ✅ | 라인 260-272 |
| 5 | 비-CTO C-Level용 "(N/A — CTO 전용)" 격리 박스 존재 | ✅ | 라인 241-242 |
| 6 | Architecture Options 섹션 다이어트 (산문 → 비교 표) | ✅ | 라인 20-28 |
| 7 | 네비게이션 + 사이트맵 섹션 통합 | ✅ | 1.4 화면 흐름도 삭제, 1.2 네비 압축 |
| 8 | 기존 `docs/02-design/*.design.md` 산출물 영향 없음 (Part 4/5 빈 셀 허용) | ✅ | Part 4/5는 신규 추가로 기존 문서는 빈 채 valid |
| 9 | 변경 이력 표 갱신 | ✅ | v1.1 행 추가 |
| 10 | `grep -i "ncai\|nano\|ncsoft" templates/design.template.md` → 0건 | ✅ | §3.2 |
| 11 | CHANGELOG 엔트리 (v0.48.2) | ⏸️ 범위 외 | /vais commit 단계 |
| 12 | 5곳 버전 범프 | ⏸️ 범위 외 | /vais commit 단계 |
| 13 | 커밋 메시지에 외부 회사명/제품명 미포함 | ⏸️ 범위 외 | /vais commit 단계 |

---

## 4. 미완료 항목 (다음 세션/단계 인계)

| # | 항목 | 인계 대상 |
|---|------|----------|
| 1 | `CHANGELOG.md` v0.48.2 엔트리 ("Tech Stack Lock + Implementation Contract 섹션 추가" 기능 중심 표기, 회사명 0건) | `/vais commit` |
| 2 | 버전 범프 7곳 (`package.json`, `vais.config.json`, `CLAUDE.md`, `README.md` 등 — feedback_version_bump.md 체크리스트 참조) | `/vais commit` |
| 3 | 커밋 메시지 작성 시 `ncai\|nano\|ncsoft` grep 재검증 + `git diff --cached` 회사명 스캔 | `/vais commit` |
| 4 | QA phase (qa-engineer 위임) — gap 분석, 구조/기능/계약 검증 | `/vais cto qa ncai-add-absorb` |

---

## 5. 발견한 기술 부채

| 우선순위 | 항목 | 비고 |
|---------|------|------|
| Low | design.template의 v1.1 엔트리에 날짜 하드코딩 (2026-04-08) — 향후 template 수정 시 수동 갱신 필요 | Plan.template / do.template 등 타 템플릿도 동일 패턴이라 일관성 유지 |
| Low | Part 5.3 State Machine은 inline 안내 1줄로 축소되어 "사용 시 직접 표 작성" 부담이 있음 | Plan §5-3 Open Question 결론대로 선택 항목. 실제 사용 빈도 모니터링 후 v1.2에서 full 표 복원 고려 |
| Low | 1.4 화면 목록 리넘버링으로 향후 design 산출물이 과거 "1.5 화면 목록" 참조 시 혼란 가능 | 실제 기존 `docs/02-design/*.design.md` 중 1.5 참조 없음 확인됨. 영향 없음 |

---

## 6. CP 위임 안내

본 에이전트는 sub-agent 환경에서 실행되어 AskUserQuestion 도구를 호출할 수 없습니다. CP-2(Do 시작 전)와 CP는 부모 오케스트레이터(CEO)가 담당하며, do phase는 이미 design 문서(CP-D option B 승인 완료)에 따라 실행되었습니다.

**다음 권장 스텝**:
1. `/vais cto qa ncai-add-absorb` — QA phase로 진입 (qa-engineer 위임, gap 분석)
2. 또는 곧바로 `/vais commit` — CHANGELOG 엔트리 + 버전 범프 7곳 일괄 처리

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-08 | 초기 Do 로그 — templates/design.template.md 286→300줄 확장 (Part 4/5 추가 + 다이어트), 회사명 0건·빈 양식 검증 완료 |
