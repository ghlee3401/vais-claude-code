# Plan: vais-seo-v2 — SEO 감사 스킬 대규모 보강

- **Date**: 2026-03-26
- **Author**: ghlee0304
- **Project**: vais-claude-code
- **Version**: 1.0

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **Problem** | vais-seo가 정적 메타태그만 검사하여, voice-ai의 "비로그인 시 return null → Googlebot 빈 페이지" 같은 런타임 크롤링 이슈를 탐지하지 못함 |
| **Solution** | 5개 신규 검사 카테고리 추가: 크롤러 접근성, SSR/CSR 렌더링 분석, Core Web Vitals 힌트, 국제화(i18n) SEO, 점수 시스템 개선 |
| **Function UX Effect** | SEO 감사 범위가 메타태그 수준에서 "Googlebot이 실제로 보는 콘텐츠" 수준으로 확장, 점수 신뢰도 향상 |
| **Core Value** | 실제 검색엔진 크롤링 문제를 사전 탐지하여, Google Search Console 등록 후 "정보 없음" 사태를 예방 |

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | voice-ai에서 vais-seo 감사를 통과했지만 Googlebot이 빈 페이지를 봄 — 정적 분석의 사각지대 |
| **WHO** | vais-seo 사용자 (Next.js/React 프로젝트 개발자) |
| **RISK** | JSX/TSX 정적 분석의 한계 — 모든 런타임 이슈를 잡을 수는 없음 (false negative 가능) |
| **SUCCESS** | voice-ai 동일 패턴 탐지 가능 + 5개 카테고리 추가 + 점수 시스템 카테고리별 가중치 반영 |
| **SCOPE** | scripts/seo-audit.js + skills/vais-seo/SKILL.md |

---

## 1. Overview

### 1.1 Purpose

현재 vais-seo는 Google SEO 기본 가이드 기준 11개 카테고리(A~K)를 검사한다. 그러나 모두 **정적 파일 분석** 수준이며, 실제 검색엔진 크롤러가 페이지를 방문했을 때 **무엇을 보는지**는 검사하지 않는다.

voice-ai 사례에서 드러난 것처럼, 메타태그가 완벽해도 컴포넌트가 `return null`하면 Googlebot은 빈 페이지를 인덱싱한다. 이런 "크롤러 접근성" 이슈를 정적 분석으로 탐지하는 것이 핵심 목표이다.

### 1.2 Background

- **발단**: voice-ai 프로젝트에서 `/vais-seo` 실행 → 이슈 없음 → 그러나 Google에서 "이 페이지에 관한 정보가 없습니다" 표시
- **원인**: `PageContent.tsx`에서 비로그인 사용자에게 `return null` → Googlebot(비로그인 상태)이 빈 HTML을 받음
- **교훈**: 메타태그 검사만으로는 실제 SEO 문제의 절반도 못 잡음

### 1.3 Related Documents

- voice-ai SEO 수정 Plan: `/home/ghlee0304-ubuntu/workspace/voice-ai/docs/01-plan/features/google-seo-crawl-fix.plan.md`
- 현재 seo-audit.js: `scripts/seo-audit.js` (738줄)
- 현재 SKILL.md: `skills/vais-seo/SKILL.md` (189줄)

---

## 2. Scope

### 2.1 In Scope

| # | 항목 | 설명 |
|---|------|------|
| 1 | **L. 크롤러 접근성 (Crawlability)** | 조건부 return null, 인증 게이트, 리다이렉트, 빈 렌더링 탐지 |
| 2 | **M. SSR/CSR 렌더링 분석** | 'use client' SEO 영향도, dynamic import, Suspense/loading 패턴 |
| 3 | **N. Core Web Vitals 힌트** | 이미지 크기/포맷, 폰트 로딩, 레이아웃 시프트 유발 패턴 (정적 분석) |
| 4 | **O. 국제화(i18n) SEO** | hreflang 태그, 다국어 URL 구조, locale 설정, alternateLinks |
| 5 | **점수 시스템 개선** | 카테고리별 가중치 반영, 100점 만점 정규화, 심각도별 감점 차등화 |
| 6 | **SKILL.md 업데이트** | 신규 카테고리 문서화, 검사 항목 테이블 추가 |

### 2.2 Out of Scope

| 항목 | 사유 |
|------|------|
| 실제 브라우저 렌더링 (Puppeteer/Playwright) | 런타임 의존성 추가는 과도함, 정적 분석으로 충분 |
| Lighthouse API 연동 | 외부 API 의존성, 별도 스킬로 분리 가능 |
| 서버 응답 코드 검사 (HTTP status) | 런타임 필요, 정적 분석 범위 밖 |
| Vue/Svelte/Astro 프레임워크 크롤러 접근성 | 현재 사용 빈도 낮음, Next.js/React 우선 |

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | 요구사항 | 우선순위 | 상태 |
|----|---------|---------|------|
| FR-01 | 조건부 `return null` 패턴 탐지 — 페이지/레이아웃 컴포넌트에서 조건에 따라 null/빈 JSX를 반환하는 패턴 감지 | P0 | 대기 |
| FR-02 | 인증 게이트 패턴 탐지 — `useSession`, `useAuth`, `redirect('/login')` 등 인증 확인 후 리다이렉트/null 반환 | P0 | 대기 |
| FR-03 | 서버 리다이렉트 탐지 — `redirect()`, `permanentRedirect()`, `router.push`, `router.replace` 패턴 | P0 | 대기 |
| FR-04 | 'use client' SEO 영향도 분석 — 클라이언트 컴포넌트에서 주요 콘텐츠가 렌더링되는 경우 경고 | P1 | 대기 |
| FR-05 | dynamic import SEO 경고 — `next/dynamic` + `ssr: false` 패턴 탐지 | P1 | 대기 |
| FR-06 | Suspense/loading 패턴 — 주요 콘텐츠가 Suspense boundary 안에만 있는 경우 경고 | P1 | 대기 |
| FR-07 | 이미지 최적화 힌트 — next/image 미사용, width/height 누락, lazy loading 확인 | P1 | 대기 |
| FR-08 | 폰트 로딩 힌트 — next/font 미사용, @font-face preload 확인 | P2 | 대기 |
| FR-09 | 레이아웃 시프트 힌트 — 이미지/iframe의 width/height 미지정 패턴 | P2 | 대기 |
| FR-10 | hreflang 태그 검사 — HTML의 `<link rel="alternate" hreflang>` 또는 Next.js alternates 설정 | P1 | 대기 |
| FR-11 | 다국어 URL 구조 검사 — `/ko/`, `/en/` 패턴 또는 i18n 라우팅 설정 확인 | P2 | 대기 |
| FR-12 | locale 메타데이터 검사 — `og:locale`, `og:locale:alternate`, html lang 일관성 | P1 | 대기 |
| FR-13 | 점수 시스템 개선 — 카테고리별 가중치, HIGH=5점/MED=2점/LOW=1점 감점, 100점 만점 정규화 | P1 | 대기 |
| FR-14 | SKILL.md 업데이트 — 신규 5개 카테고리 문서화 | P0 | 대기 |

### 3.2 Non-Functional Requirements

| ID | 요구사항 | 기준 |
|----|---------|------|
| NFR-01 | 성능 | 500개 파일 프로젝트에서 5초 이내 완료 |
| NFR-02 | False Positive 최소화 | 의도적 패턴(404 페이지 등)을 오탐하지 않도록 컨텍스트 고려 |
| NFR-03 | 하위 호환성 | 기존 11개 카테고리(A~K) 검사 결과 변경 없음 |
| NFR-04 | 코드 구조 | 카테고리별 감사 함수 분리, 단일 파일 유지 |

---

## 4. Success Criteria

| # | 기준 | 측정 방법 |
|---|------|---------|
| SC-01 | voice-ai 동일 패턴(`return null` in page component) 탐지 가능 | voice-ai 프로젝트에 대해 seo-audit.js 실행 시 HIGH 이슈로 리포트 |
| SC-02 | 5개 신규 카테고리(L~O + 점수) 모두 구현 | 각 카테고리에서 최소 1개 이상 검사 동작 확인 |
| SC-03 | 기존 검사(A~K) 결과 변경 없음 | 기존 프로젝트에서 동일한 이슈 목록 출력 |
| SC-04 | 점수 시스템이 카테고리별 가중치 반영 | 동일 프로젝트에서 개선 전/후 점수가 차등 반영됨 |
| SC-05 | SKILL.md에 신규 카테고리 문서화 완료 | 16개 카테고리(A~O + 점수) 모두 테이블에 기록 |

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| JSX 정적 분석의 한계 — 복잡한 조건문 미탐지 | 중 | 높음 | 일반적 패턴(early return, auth check) 위주로 탐지, 복잡한 경우 "수동 확인 권장" 힌트 제공 |
| False Positive — 의도적 return null (404, error page) | 중 | 중 | 파일 경로 기반 필터링 (`not-found`, `error`, `loading` 파일 제외) |
| 점수 가중치 주관성 | 낮 | 중 | Google SEO 가이드 우선순위 기반으로 가중치 설정, 투명한 감점 로그 |
| seo-audit.js 파일 크기 증가 (738줄 → ~1200줄 예상) | 낮 | 높음 | 카테고리별 함수 분리로 가독성 유지, 단일 파일 구조 유지 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| 파일 | 변경 유형 | 변경 규모 |
|------|---------|---------|
| `scripts/seo-audit.js` | 수정 | ~500줄 추가 (5개 카테고리 + 점수 시스템) |
| `skills/vais-seo/SKILL.md` | 수정 | ~80줄 추가 (5개 카테고리 문서화) |

### 6.2 Current Consumers

| Consumer | Impact | Verification |
|----------|--------|-------------|
| `/vais-seo` 스킬 실행 | 출력에 신규 카테고리 이슈 추가됨 | 기존 프로젝트 + voice-ai에서 테스트 |
| `seo-audit.js --json` 출력 | JSON에 신규 카테고리 필드 추가 | JSON 스키마 호환성 확인 (추가만, 삭제 없음) |

---

## 7. Architecture Considerations

### 7.1 Project Level

- [x] **Starter** — 단일 스크립트 파일 수정, 프레임워크 불필요

### 7.2 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 분석 방식 | 정적 AST-like 분석 (정규식 기반) | 외부 파서 의존성 없이, 기존 패턴과 일관성 유지 |
| 파일 구조 | 단일 파일 유지 (seo-audit.js) | 카테고리별 함수 분리로 충분, 멀티 파일은 과도 |
| 점수 계산 | 가중치 기반 감점제 (100점 시작) | 직관적, Google 가이드 우선순위 반영 가능 |
| 크롤러 접근성 분석 범위 | Next.js App Router 우선 | 사용 빈도 최다, voice-ai가 Next.js |

---

## 8. Implementation Guide (High-Level)

### Phase 1: 크롤러 접근성 (FR-01 ~ FR-03) — P0

1. `auditCrawlability(content, relPath, result)` 함수 추가
2. 페이지/레이아웃 파일에서 조건부 `return null` 패턴 탐지
3. 인증 관련 import (`useSession`, `useAuth`, `getServerSession`) 후 리다이렉트/null 패턴 탐지
4. `redirect()`, `permanentRedirect()` 호출 탐지
5. not-found, error, loading 파일은 제외

### Phase 2: SSR/CSR 렌더링 분석 (FR-04 ~ FR-06) — P1

1. `auditRenderingPattern(content, relPath, result)` 함수 추가
2. `'use client'` + 주요 콘텐츠 렌더링 경고
3. `next/dynamic` + `{ ssr: false }` 탐지
4. Suspense boundary 내 주요 콘텐츠 경고

### Phase 3: Core Web Vitals 힌트 (FR-07 ~ FR-09) — P1/P2

1. `auditWebVitals(content, relPath, result)` 함수 추가
2. `<img>` vs `next/image` 사용 비교
3. 폰트 로딩 패턴 검사
4. width/height 미지정 패턴

### Phase 4: 국제화 SEO (FR-10 ~ FR-12) — P1/P2

1. `auditI18nSEO(content, relPath, result, root)` 함수 추가
2. hreflang 태그 또는 Next.js alternates 설정 검사
3. locale 관련 메타데이터 일관성 검사

### Phase 5: 점수 시스템 개선 (FR-13)

1. `calculateScore(result)` 함수 개선
2. 카테고리별 가중치 상수 정의
3. HIGH=5점/MED=2점/LOW=1점 감점
4. 100점 만점 정규화
5. 점수 breakdown 출력

### Phase 6: SKILL.md 업데이트 (FR-14)

1. 신규 카테고리 L~O 테이블 추가
2. 점수 시스템 설명 업데이트
3. 사용 예시 보강

---

## 9. Next Steps

- [ ] Design 문서 작성: `/pdca design vais-seo-v2`
- [ ] 구현: Phase 1(P0) → Phase 2~4(P1) → Phase 5~6 순서
- [ ] Gap 분석: `/pdca analyze vais-seo-v2`
- [ ] voice-ai 프로젝트에서 실제 테스트

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-26 | ghlee0304 | 초기 Plan 문서 작성 |
