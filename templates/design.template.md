# {feature} - 설계

> ⛔ **Design 단계 범위**: 이 문서는 설계 결정만 기록합니다. 프로덕트 파일 생성·수정은 Do 단계에서 수행하세요.
> 참조 문서: `docs/{feature}/01-plan/main.md`
> <!-- size budget: main.md ≤ 200 lines 권장 (workflow.cLevelCoexistencePolicy.mainMdMaxLines). 초과 시 topic 문서로 분리. -->

## Decision Record (multi-owner)

<!-- 각 C-Level 이 자기 결정 행을 append. 이전 행 수정·삭제 금지. Owner 컬럼 필수.
     C-Level 별 H2 섹션 플레이스홀더: ## [CBO]/[CPO]/[CTO]/[CSO]/[COO] {도메인 요약} -->

| # | Decision | Owner | Rationale | Source topic |
|---|----------|:-----:|-----------|--------------|
| 1 | {설계 결정} | cto | {근거} | `{topic}.md` |

## Context Anchor

(Plan 문서에서 복사)

| Key | Value |
|-----|-------|
| **WHY** | |
| **WHO** | |
| **RISK** | |
| **SUCCESS** | |
| **SCOPE** | |

---

## Architecture Options

| Option | 설명 | 복잡도 | 유지보수 | 구현 속도 | 리스크 | 선택 |
|--------|------|:------:|:--------:|:---------:|:------:|:----:|
| A. Minimal | 기존 코드 최대 재사용. 빠르나 결합도 ↑ | 낮음 | 낮음 | 빠름 | 중 | |
| B. Clean | 관심사 분리 최적. 파일 多 + 리팩토링 多 | 높음 | 높음 | 느림 | 낮음 | |
| C. Pragmatic | 적절한 경계, 과도한 설계 회피 (기본 추천) | 중 | 중 | 중 | 낮음 | ✓ |

**Rationale**: {선택 근거 1줄}

---

## Part 1: IA (Information Architecture)

### 1.1 사이트맵

```mermaid
graph TD
```

### 1.2 네비게이션 구조

| 유형 | 구성 요소 | 설명 |
|------|----------|------|
| GNB/LNB | | 사이트맵(§1.1)과 함께 읽을 것 |

### 1.3 태스크 기반 유저플로우

#### T1: {태스크명}
- **사용자 목표**: / **시작점**: / **종료 조건**:

```mermaid
flowchart TD
```

#### 크로스 태스크 의존성
| 태스크 A | 관계 | 태스크 B | 공유 상태 |
|---------|------|---------|----------|

### 1.4 화면 목록

| # | 화면명 | URL | 설명 | 관련 태스크 |
|---|-------|-----|------|-----------|

---

## Part 2: 와이어프레임

### 2.1 와이어프레임 개요

| 디바이스 | 너비 | 기준 |
|---------|------|------|
| Mobile | 375px | 40칸 |
| Tablet | 768px | 60칸 |
| Desktop | 1280px | 80칸 |

### 2.2 화면별 와이어프레임

#### {화면명} (Mobile)

```
┌──────────────────────────────────────┐
│                                      │
│  (ASCII 와이어프레임)                 │
│                                      │
└──────────────────────────────────────┘
```

**컴포넌트 어노테이션:**
| 컴포넌트 | data-component | data-props |
|---------|---------------|------------|

### 2.3 공통 컴포넌트

| 컴포넌트 | 사용 화면 | 설명 |
|---------|----------|------|

---

## Part 3: UI 설계

### 3.1 디자인 토큰

#### 3.1.1 색상
| 용도 | 토큰명 | 값 | 비고 |
|------|--------|-----|------|
| Primary | --color-primary | | 메인 강조 |
| Secondary | --color-secondary | | 보조 |
| Background | --color-bg | | 배경 |
| Text | --color-text | | 본문 |
| Error | --color-error | | 에러 |
| Success | --color-success | | 성공 |

#### 3.1.2 타이포그래피
| 용도 | 크기 | 굵기 | 행간 | 비고 |
|------|------|------|------|------|
| H1 | 2rem (32px) | 700 | 1.3 | 페이지 제목 |
| H2 | 1.5rem (24px) | 600 | 1.35 | 섹션 제목 |
| H3 | 1.25rem (20px) | 600 | 1.4 | 하위 제목 |
| Body | 1rem (16px) | 400 | 1.5 | 본문 |
| Caption | 0.875rem (14px) | 400 | 1.4 | 보조 텍스트 |
| Small | 0.75rem (12px) | 400 | 1.4 | 라벨, 힌트 |

#### 3.1.3 간격 (Spacing)
| 토큰 | 값 | 용도 |
|------|-----|------|
| xs | 4px | 아이콘 간격 |
| sm | 8px | 요소 내부 |
| md | 16px | 요소 간 |
| lg | 24px | 섹션 간 |
| xl | 32px | 페이지 패딩 |

### 3.2 사용 컴포넌트 라이브러리

> 기획서의 "UI 컴포넌트 라이브러리" 선택을 참조합니다.

- **라이브러리**: (plan 문서에서 참조)
- **설치 방법**: (예: `npx shadcn@latest init`)
- **사용할 컴포넌트 목록**: (예: Button, Input, Card, Dialog, Toast, ...)

### 3.3 공통 컴포넌트 명세

#### 3.3.1 버튼
| 변형 | 용도 | 상태 | 라이브러리 컴포넌트 |
|------|------|------|------------------|
| Primary | CTA | default, hover, active, disabled | |
| Secondary | 보조 액션 | default, hover, active, disabled | |
| Ghost | 최소 강조 | default, hover, active, disabled | |

#### 3.3.2 입력 필드
| 유형 | 상태 | 비고 | 라이브러리 컴포넌트 |
|------|------|------|------------------|
| Text | default, focus, error, disabled | | |
| Password | | 표시/숨김 토글 | |
| Select | | | |
| Textarea | | | |

### 3.4 화면별 상세 정의

> 각 화면의 구조(IA) + 레이아웃(와이어프레임) + 컴포넌트(설계)를 통합합니다.

#### 3.4.1 {화면명}

**화면 정보**

| 항목 | 내용 |
|------|------|
| 화면 ID | |
| URL 패턴 | (예: `/login`) |
| 유형 | page / modal / drawer |
| 접근 권한 | (예: 비회원 가능, 로그인 필요) |
| 진입 경로 | (예: GNB → 로그인 버튼) |
| 관련 기능 | (plan 4.1의 기능 번호 참조: F1, F2) |

**와이어프레임** (Part 2 참조)

```
┌──────────────────────────────────────┐
│                                      │
│  레이아웃 요약 또는 wireframe 참조   │
│                                      │
└──────────────────────────────────────┘
```

**사용 컴포넌트**

| 영역 | 컴포넌트 | 라이브러리 | props | 비고 |
|------|---------|-----------|-------|------|
| | (예: LoginForm) | (예: shadcn Card) | | |
| | (예: EmailInput) | (예: shadcn Input) | | |

**상태 정의**

| 상태 | 조건 | UI 표현 |
|------|------|---------|
| 기본 | 최초 진입 | |
| 로딩 | API 호출 중 | 스피너/스켈레톤 |
| 에러 | 요청 실패 / 유효성 오류 | 에러 메시지 표시 |
| 빈 상태 | 데이터 없음 | 안내 문구 |
| 성공 | 처리 완료 | 토스트/리다이렉트 |

**인터랙션**

| # | 트리거 | 동작 | 피드백 | 이동 |
|---|--------|------|--------|------|
| 1 | (예: 로그인 버튼 클릭) | API 호출 | 로딩 → 토스트 | (예: /dashboard) |

**데이터 흐름**

| 입력 데이터 | 출력 데이터 | API 엔드포인트 | 비고 |
|------------|------------|---------------|------|
| | | (예: POST /api/auth/login) | |

---

#### 3.4.2 {화면명}

(위와 동일한 구조 반복)

### 3.5 반응형 브레이크포인트

| 이름 | 범위 | 레이아웃 변화 |
|------|------|-------------|
| Mobile | ~767px | 1컬럼, 바텀 네비 |
| Tablet | 768~1023px | 2컬럼 |
| Desktop | 1024px~ | 사이드바 + 컨텐츠 |

### 3.6 접근성 요구사항

- [ ] 키보드 네비게이션 지원
- [ ] 스크린 리더 호환 (ARIA labels)
- [ ] 충분한 색상 대비 (4.5:1 이상)
- [ ] 포커스 표시 명확
- [ ] alt 텍스트 제공

---

> ⛔ **다음 Part 4/5는 CTO 전용입니다.**
> CTO 외 C-Level(CPO/CSO/CMO/COO/CFO)이 design.template를 사용할 때는 Part 4/5 두 섹션을 통째로 생략하거나 각 섹션을 `(N/A — CTO 전용)` 한 줄로 대체하세요.

## Part 4: Tech Stack Lock (CTO 전용)

> **빈 양식 원칙**: 셀은 `{placeholder}`로 비워두고 feature마다 채웁니다. 해당 없으면 빈 셀 허용. 미결정은 do 단계 진입 전 채워야 합니다.

| 영역 | Lang/Framework | 핵심 라이브러리 | 데이터/스토리지 | 금지 |
|------|----------------|----------------|----------------|------|
| Backend | {Lang/Framework} | {ORM/DI/Validator} | {DB/Cache/Queue} | {도입 금지 기술} |
| Frontend | {Lang/Framework} | {State/Router/UI Lib} | {Local Storage/IndexedDB} | {도입 금지 기술} |
| Auth/Infra | {Auth Method} | {SDK/Provider} | {Session/Token Store} | {도입 금지 기술} |

---

## Part 5: Implementation Contract (CTO 전용)

> **부분 채움 허용**: 확정된 항목만 채우고 do 단계에서 보강 가능.

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
> 도메인에 명시적 상태 전이가 있을 때만 `From | Event | To | Guard | Side Effect` 표 작성. 없으면 "(N/A)".

---

## Session Guide

### Module Map

| Module | Files | Description |
|--------|-------|-------------|
| module-1 | {파일 목록} | {설명} |
| module-2 | {파일 목록} | {설명} |

### Recommended Session Plan

| Session | Modules | Description |
|---------|---------|-------------|
| Session 1 | module-1 | {핵심 구조} |
| Session 2 | module-2 | {세부 구현} |

<!-- v0.57 subdoc-section begin -->

---

## Topic Documents (v0.57+)

> C-Level 이 `_tmp/*.md` scratchpad 를 읽고 주제별로 합성한 topic 문서 인덱스. 피처 크기에 따라 선택.

| Topic | 파일 | 한 줄 요약 | 참조 scratchpad |
|-------|------|-----------|----------------|
| | `{topic}.md` | | |

<!-- Phase 별 권장 topic 프리셋: vais.config.json > workflow.topicPresets.02-design -->

## Scratchpads (v0.57+)

> sub-agent 가 작성한 `_tmp/*.md` 인벤토리. `scripts/doc-validator.js` 가 Author/Phase 헤더 + size 검증.

| Agent | 경로 | 크기 | 갱신 |
|-------|------|:----:|-----|
| | `_tmp/{agent-slug}.md` | | |

<!-- v0.57 subdoc-section end -->


---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | | 초기 작성 |
| v1.1 | 2026-04-08 | Part 4/5 (Tech Stack Lock + Implementation Contract) 추가, Architecture Options 표 압축, 네비/사이트맵 통합 |

<!-- template version: v0.58.0 (v0.57+ subdoc / v0.58+ clevel-coexistence 포함) -->
