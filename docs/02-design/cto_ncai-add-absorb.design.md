# ncai-add-absorb - 설계

> ⛔ **Design 단계 범위**: 이 문서는 `templates/design.template.md` 확장 설계만 기록합니다. 실제 템플릿 파일 수정은 Do 단계에서 수행합니다.
> 입력: `docs/01-plan/ceo_ncai-add-absorb.plan.md` (v1.1)

---

## Context Anchor (Plan v1.1에서 복사)

| Key | Value |
|---|---|
| **WHY** | CTO design phase가 UX 중심이어서 백엔드 결정 모호성이 do 단계로 흘러감 |
| **WHO** | CTO + 하위 backend-engineer/frontend-engineer/qa-engineer |
| **RISK** | 비대화 / 비-CTO 부담 / 회사명 유출 / 특정 스택 강요로 범용성 훼손 |
| **SUCCESS** | 290~300줄 이내 + 빈 양식 + 회사명 0건 + (N/A) 시각 격리 |
| **SCOPE** | `templates/design.template.md` 단일 파일 확장 + 동시 다이어트 |

---

## 0. 설계 원칙 (Hard Constraints)

| # | 원칙 | 강제 수단 |
|---|------|----------|
| HC-1 | 빈 양식 흡수 — 표 셀은 모두 `{placeholder}`. 특정 기술명 default 0건 | 본 문서 §1, §2의 모든 표 |
| HC-2 | 회사명/출처 0건 — 외부 레퍼런스 추상화로만 표기 | 본 문서 전체 + Do grep 가드 |
| HC-3 | 표 위주, 산문 금지 — Part 4/5는 모두 마크다운 표 | 본 문서 §1, §2 |
| HC-4 | 순증 ≤15줄 — 286 → 290~300줄 | 본 문서 §6 줄수 예산 |
| HC-5 | CTO 외 C-Level은 (N/A) 1줄 + 시각 격리 | 본 문서 §3 |

---

## 1. Part 4 — Tech Stack Lock 정확한 레이아웃

### 1.1 삽입 위치

`templates/design.template.md`의 **Part 3 (UI 설계) 종료 직후, Session Guide 섹션 직전**에 삽입.
근거: CTO design phase의 의미상 IA/UX(Part 1~3)를 거쳐 "구현 직전 락"을 거는 흐름이 자연스럽고, Session Guide(파일 분할 계획)는 락 결정 이후에 와야 한다.

### 1.2 정확한 마크다운

```markdown
---

## Part 4: Tech Stack Lock (CTO 전용)

> CTO design 전용. 외 C-Level은 §3의 격리 박스를 따르세요.
> **빈 양식 원칙**: 셀은 `{placeholder}`로 비워두고 feature마다 채웁니다. 해당 없으면 빈 셀 허용.

| 영역 | Lang/Framework | 핵심 라이브러리 | 데이터/스토리지 | 금지 |
|------|----------------|----------------|----------------|------|
| Backend | {Lang/Framework} | {ORM/DI/Validator} | {DB/Cache/Queue} | {도입 금지 기술} |
| Frontend | {Lang/Framework} | {State/Router/UI Lib} | {Local Storage/IndexedDB} | {도입 금지 기술} |
| Auth/Infra | {Auth Method} | {SDK/Provider} | {Session/Token Store} | {도입 금지 기술} |

> 빈 셀 = "해당 없음 또는 미결정". 미결정은 do 단계 진입 전 채워야 합니다.
```

### 1.3 컬럼·행 결정 근거

| 항목 | 결정 | 이유 |
|------|------|------|
| 행: 3행 (Backend/Frontend/Auth·Infra) | 채택 | Plan §3 Success Criteria 명시 ("backend/frontend/auth 3행") |
| 컬럼: Lang/Framework | 채택 | 외부 레퍼런스 TRD §3의 최소 단위 |
| 컬럼: 핵심 라이브러리 | 채택 | ORM/DI/State 같은 "결정해야만 하는" 두 번째 축 |
| 컬럼: 데이터/스토리지 | 채택 | DB/Cache/Queue 결정 분리 |
| 컬럼: 금지 | 채택 | Plan §1.2 ("Part 6 Out-of-Scope를 금지 컬럼으로 흡수") |
| 행: DevOps/CI 별도 | **제외** | COO/release-engineer 영역, design 범위 외 |

### 1.4 빈 셀 허용 규칙

- `{placeholder}` 표기는 **반드시** 중괄호로 감쌈 (구체 기술명 금지)
- "해당 없음"이면 빈 셀 또는 `-` 허용
- "금지" 컬럼은 정책 없으면 빈 셀 OK (Plan Open Question §5-2 해결)

---

## 2. Part 5 — Implementation Contract 정확한 레이아웃

### 2.1 삽입 위치

Part 4 직후. Part 4가 "무엇으로 만들지(스택)"이라면 Part 5는 "어떻게 책임을 나눌지(레이어/계약)"이므로 인접 배치가 자연스럽다.

### 2.2 정확한 마크다운

```markdown
---

## Part 5: Implementation Contract (CTO 전용)

> CTO design 전용. 외 C-Level은 §3의 격리 박스를 따르세요.
> **부분 채움 허용**: 확정된 항목만 채우고 do 단계에서 보강 가능 (Plan Open Question §5-1).

### 5.1 Layer Responsibility

| Layer | 책임 | 의존 방향 | 금지 사항 |
|-------|------|----------|----------|
| Router/Controller | {요청 수신, 입력 검증, 응답 직렬화} | → Service | {비즈니스 로직 작성 금지} |
| Service/UseCase | {비즈니스 규칙, 트랜잭션 경계} | → Repository | {HTTP/DB 직접 접근 금지} |
| Repository/Adapter | {영속성, 외부 API 어댑터} | → Storage/External | {도메인 규칙 작성 금지} |

### 5.2 API Contract

| Method | Path | Request | Response | Auth | Errors |
|--------|------|---------|----------|------|--------|
| {GET/POST/...} | {/api/...} | {body/query 스키마 요약} | {200 응답 스키마 요약} | {Y/N + 권한} | {4xx/5xx 코드} |

### 5.3 State Machine (선택)

> 도메인에 명시적 상태 전이가 있을 때만 작성. 없으면 "(N/A)".

| From | Event | To | Guard | Side Effect |
|------|-------|-----|-------|-------------|
| {state} | {event} | {state} | {조건} | {emit/persist} |
```

### 2.3 표 구성 결정 근거

| 표 | 행 수 | 결정 근거 |
|----|-------|----------|
| 5.1 Layer Responsibility | 3행 (Router/Service/Repo) | Plan §3 Success Criteria 명시 |
| 5.2 API Contract | 가변 (1행 sample) | 부분 채움 허용 (Plan Open Question §5-1) |
| 5.3 State Machine | 가변 (선택) | Plan Open Question §5-3 결정에 따라 Part 5 내부 하위 항목 |

### 2.4 5.2 컬럼 선택

Method/Path/Request/Response/Auth/Errors 6컬럼은 design 단계에서 backend-engineer가 구현 시 즉시 사용 가능한 최소 집합. Rate-limit, Idempotency 등은 비기능 요구사항(plan §6)에 위임.

---

## 3. CTO 전용 시각 격리 박스 (정확한 마크다운)

### 3.1 패턴 출처

`templates/plan.template.md` §0.7 (라인 70-97) 패턴 복제. 그 패턴은:
- 섹션 헤더에 `(CTO 전용)` 명시
- blockquote(`>`)로 안내문 삽입
- "외 C-Level은 ... (N/A — CTO 전용) 한 줄로 채우거나 섹션 자체를 생략" 안내

### 3.2 design.template에 적용할 정확한 박스 마크다운

각 Part 4/5 시작 직후 이미 `>` 안내문이 있으므로, **별도 박스를 추가하지 않고 헤더의 `(CTO 전용)` 표기 + 첫 blockquote 1줄로 격리**한다. 추가 박스는 줄수 낭비.

또한 비-CTO C-Level이 design.template를 사용할 때 통째로 스킵할 수 있도록 다음 안내를 **Part 4 시작 직전에 1회만** 추가:

```markdown
---

> ⛔ **다음 Part 4/5는 CTO 전용입니다.**
> CTO 외 C-Level(CPO/CSO/CMO/COO/CFO)이 design.template를 사용할 때는 Part 4/5 두 섹션을 통째로 생략하거나 각 섹션을 `(N/A — CTO 전용)` 한 줄로 대체하세요.
```

이 박스는 Part 3 종료 직후 `---` 다음, Part 4 헤더 직전에 4줄 차지.

### 3.3 결정: 격리 강도

| 옵션 | 줄수 | 채택 |
|------|------|------|
| A. 박스 없음 (헤더 표기만) | +0 | X — Plan Success Criteria "격리 박스 존재" 미충족 |
| **B. 1회 통합 박스 (Part 4 직전)** | +4 | **채택** — 줄수 절약 + 명확한 신호 |
| C. Part 4와 5 각각 박스 | +8 | X — 중복, 줄수 초과 |

---

## 4. 기존 design.template 다이어트 대상 (정확한 줄 범위)

현재 286줄 기준 줄 번호로 식별.

### 4.1 다이어트 대상

| ID | 대상 | 현재 줄 범위 | 현재 줄수 | 변환 후 줄수 | 절감 |
|----|------|------------|----------|-------------|------|
| D-1 | Architecture Options 산문(A/B/C 3개 단락) → 표 통합 | 22-29 | 8 | 0 (표에 흡수) | -8 |
| D-2 | "Selected: Option {X}" + Rationale 단락 | 40-42 | 3 | 1 (Comparison 표 마지막 행) | -2 |
| D-3 | 1.1 사이트맵 (mermaid stub) | 48-52 | 5 | 5 (유지) | 0 |
| D-4 | 1.2 네비게이션 구조 표 | 54-59 | 6 | 통합 후 4 | -2 |
| D-5 | 1.4 화면 흐름도 (mermaid stub) | 76-80 | 5 | 0 (1.1 사이트맵에 통합) | -5 |
| **합계 절감** | | | | | **-17** |

### 4.2 D-1/D-2: Architecture Options 변환 후 정확한 표 형식

기존 22-43 (22줄)을 다음 11줄로 압축:

```markdown
## Architecture Options

| Option | 설명 | 복잡도 | 유지보수 | 구현 속도 | 리스크 | 선택 |
|--------|------|:------:|:--------:|:---------:|:------:|:----:|
| A. Minimal | 기존 코드 최대 재사용. 빠르나 결합도 ↑ | 낮음 | 낮음 | 빠름 | 중 | |
| B. Clean | 관심사 분리 최적. 파일 多 + 리팩토링 多 | 높음 | 높음 | 느림 | 낮음 | |
| C. Pragmatic | 적절한 경계, 과도한 설계 회피 (기본 추천) | 중 | 중 | 중 | 낮음 | ✓ |

**Rationale**: {선택 근거 1줄}
```

기존 22줄 → 신규 11줄 = **-11줄 절감** (D-1+D-2 합산)

### 4.3 D-4/D-5: 네비/사이트맵 통합

기존 1.1 사이트맵(48-52) + 1.2 네비(54-59) + 1.4 화면 흐름도(76-80)는 모두 "화면 간 구조"를 표현하는 중복. 다음과 같이 통합:

- 1.1 사이트맵 mermaid는 **유지** (5줄)
- 1.2 네비게이션 표는 사이트맵 직후로 이동, "유형/구성 요소/설명" 3컬럼 그대로 (6→4줄, GNB/LNB 행 압축)
- 1.4 화면 흐름도는 **삭제** (1.1 사이트맵이 동일 역할)

**합산 절감**: D-4(-2) + D-5(-5) = **-7줄**

### 4.4 다이어트 합계

| 항목 | 절감 |
|------|------|
| Architecture Options 표화 (D-1+D-2) | -11 |
| 네비/사이트맵 통합 (D-4+D-5) | -7 |
| **다이어트 총 절감** | **-18** |

---

## 5. 삽입 위치 최종 정리

design.template 최종 섹션 순서:

```
1. 헤더 + Context Anchor
2. Architecture Options (다이어트 적용)
3. Part 1: IA (네비/사이트맵 통합)
4. Part 2: 와이어프레임
5. Part 3: UI 설계
6. [신규] CTO 전용 격리 박스 (4줄)
7. [신규] Part 4: Tech Stack Lock
8. [신규] Part 5: Implementation Contract
9. Session Guide
10. 변경 이력 (v1.0 → v1.1 갱신)
```

---

## 6. 줄수 예산 검증

| 항목 | 줄수 변화 |
|------|----------|
| 현재 design.template | 286 |
| **추가** | |
| + CTO 격리 박스 (§3.2) | +4 |
| + Part 4 헤더 + 안내 + 표 + 빈 셀 주석 (§1.2) | +12 |
| + Part 5 헤더 + 안내 + 5.1 표 (§2.2) | +9 |
| + Part 5.2 API Contract 표 | +6 |
| + Part 5.3 State Machine 표 (선택) | +8 |
| + 변경 이력 v1.1 행 | +1 |
| 추가 소계 | **+40** |
| **다이어트 (§4)** | |
| − Architecture Options 표화 (D-1+D-2) | -11 |
| − 네비/사이트맵 통합 (D-4+D-5) | -7 |
| 다이어트 소계 | **-18** |
| **순증** | **+22** |
| **최종 예상** | **308** |

### 6.1 가드 검증: 308 > 300 → 추가 다이어트 필요

300 이내 목표 달성을 위해 추가 8줄 절감 항목:

| 추가 다이어트 | 절감 | 비고 |
|-------------|------|------|
| Part 5.3 State Machine을 "(N/A) 1행만 + 주석 1줄"로 압축 | -5 | 8줄 → 3줄 |
| Part 4 빈 셀 주석 1줄 제거 (안내 blockquote와 중복) | -1 | |
| Part 5 안내 blockquote 1줄로 압축 | -2 | |
| **추가 소계** | **-8** | |

### 6.2 최종 줄수

| | 줄수 |
|---|---|
| 베이스 286 + 순증 22 - 추가 다이어트 8 | **300** |

✅ Plan Success Criteria "290~300 이내" 충족.

> Do 단계에서 실제 작성 시 ±2줄 변동 가능. 304줄을 초과하면 Part 5.3을 완전 제거하고 "선택 항목" 안내 1줄로 대체.

---

## 7. 회사명/출처 0건 검증 (설계 차원)

본 design 문서 자체에 외부 회사명/제품명 검색:

| 검증 항목 | 결과 |
|----------|------|
| "외부 레퍼런스" 추상화 표기 사용 | ✅ |
| 본문에 회사/제품 고유명사 0건 | ✅ (직접 확인) |
| Do 단계 grep 가드 명시 | ✅ Plan §1.4 + Success Criteria |

---

## 8. Open Items → Do 인계

| # | 항목 | Do 단계 처리 |
|---|------|-------------|
| 1 | Part 5.3 State Machine 압축 강도 (3줄 vs 8줄) | 줄수 304 임계 시 압축 |
| 2 | design.template 변경 이력 v1.1 ↔ v1.2 표기 | Do에서 현재 v 확인 후 +1 |
| 3 | template version 마커 (`v0.18.0`) 갱신 여부 | Do에서 plugin 버전 정책에 맞춰 결정 |

---

## 9. Success Criteria (Design 단계)

- [x] Part 4 정확한 마크다운 결정 (§1.2)
- [x] Part 5 정확한 마크다운 결정 (§2.2)
- [x] CTO 전용 격리 박스 정확한 마크다운 결정 (§3.2)
- [x] 다이어트 대상 줄 범위 식별 (§4.1)
- [x] Architecture Options 변환 후 표 결정 (§4.2)
- [x] 삽입 위치 결정 (§5)
- [x] 줄수 예산 300줄 이내로 검증 (§6.2)
- [x] 회사명/출처 0건 (§7)

---

## 변경 이력

| version | date | change |
|---|---|---|
| v1.0 | 2026-04-08 | 초기 설계 — Part 4/5 레이아웃, 다이어트 대상 줄 범위, 줄수 예산 300줄 검증 |
