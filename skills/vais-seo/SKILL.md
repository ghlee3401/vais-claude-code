---
name: vais-seo
description: >
  SEO 감사 및 최적화 스킬. 웹 프로젝트의 HTML 파일을 분석하여 Google SEO 기본 가이드 기준으로
  검색엔진 최적화 상태를 점검하고 개선안을 제시합니다.
  Triggers: seo, SEO, 검색엔진, 검색 최적화, meta tag, 메타태그, title tag, sitemap, 사이트맵,
  robots.txt, canonical, 구조화 데이터, structured data, og tag, 오픈그래프,
  alt text, 대체 텍스트, 스니펫, snippet, 크롤링, indexing, 색인.
  Do NOT use for: 일반 개발 워크플로우, 코드 리뷰, 테스트, 플러그인 검증
argument-hint: "[path-or-url]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, TodoWrite
---

# 🔍 VAIS SEO — 검색엔진 최적화 감사

Google SEO 기본 가이드(Google Search Central)를 기준으로 웹 프로젝트의 SEO 상태를 점검합니다.

## 사용법

```
/vais-seo                     # 현재 프로젝트 전체 감사
/vais-seo src/pages           # 특정 디렉토리만 감사
/vais-seo index.html          # 단일 파일 감사
```

## 실행 절차

### 1. 대상 파일 탐색

- 인자가 있으면 해당 경로 사용
- 없으면 현재 프로젝트에서 HTML 파일 탐색: `**/*.html`, `**/*.htm`, `**/*.jsx`, `**/*.tsx`
- Next.js/Nuxt 등 프레임워크 감지 시 `pages/`, `app/`, `src/` 등 관련 디렉토리 탐색
- `package.json`에서 프레임워크 감지 (next, nuxt, gatsby, astro 등)

### 2. SEO 감사 스크립트 실행

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/seo-audit.js <대상경로>
```

### 3. 결과 분석 후 개선안 제시

검사 결과를 카테고리별로 분류하고, 우선순위에 따라 개선안을 제시합니다.

---

## 검사 카테고리 (Google SEO 기본 가이드 기반)

### A. 크롤링 & 색인 기초

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| robots.txt | 파일 존재 여부, 주요 페이지 차단 여부 | 높음 |
| sitemap.xml | 파일 존재 여부, 유효한 XML 형식 | 높음 |
| canonical | `<link rel="canonical">` 설정 여부, 중복 콘텐츠 | 중간 |
| noindex | 의도치 않은 `noindex` 메타태그 | 높음 |

### B. `<title>` 태그

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| 존재 여부 | 모든 페이지에 `<title>` 있는지 | 높음 |
| 고유성 | 페이지별 고유한 제목인지 (중복 검출) | 높음 |
| 길이 | 30~60자 권장 범위 | 중간 |
| 내용 품질 | 페이지 콘텐츠를 정확히 설명하는지 | 중간 |

### C. 메타 설명 (snippet)

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| 존재 여부 | `<meta name="description">` 있는지 | 중간 |
| 고유성 | 페이지별 고유한 설명인지 | 중간 |
| 길이 | 70~160자 권장 범위 | 낮음 |

### D. 제목 태그 구조 (h1~h6)

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| h1 존재 | 페이지당 h1 태그 존재 여부 | 높음 |
| h1 고유성 | 페이지당 h1이 1개인지 (다수 경고) | 중간 |
| 계층 구조 | h1→h2→h3 순서 건너뛰기 여부 | 낮음 |

### E. URL 구조

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| 설명적 URL | 의미 있는 단어 포함 여부 (임의 ID 경고) | 중간 |
| 디렉토리 구조 | 주제별 논리적 그룹화 | 낮음 |

### F. 이미지 최적화

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| alt 텍스트 | `<img>` 에 `alt` 속성 있는지 | 높음 |
| alt 품질 | 빈 문자열이 아닌 설명적 텍스트인지 | 중간 |
| 파일명 | 이미지 파일명이 설명적인지 (IMG_001 등 경고) | 낮음 |

### G. 링크 품질

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| 앵커 텍스트 | "여기를 클릭", "더보기" 등 비설명적 앵커 | 중간 |
| nofollow | 내부 링크에 불필요한 nofollow | 낮음 |
| 깨진 링크 | href="#" 또는 빈 링크 | 중간 |

### H. 구조화 데이터

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| JSON-LD | `<script type="application/ld+json">` 존재 여부 | 중간 |
| 필수 속성 | schema.org 기본 속성 포함 여부 | 낮음 |

### I. OG 태그 & 소셜 미디어

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| og:title | Open Graph 제목 | 중간 |
| og:description | Open Graph 설명 | 중간 |
| og:image | Open Graph 이미지 | 중간 |
| twitter:card | Twitter Card 메타태그 | 낮음 |

### J. 모바일 & 성능

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| viewport | `<meta name="viewport">` 설정 | 높음 |
| 반응형 | CSS 미디어 쿼리 또는 반응형 프레임워크 사용 | 중간 |

### K. 보안 & 접근성

| 항목 | 검사 내용 | 심각도 |
|------|---------|--------|
| HTTPS | 링크에서 http:// 사용 여부 | 중간 |
| lang 속성 | `<html lang="...">` 설정 | 중간 |

---

## 프레임워크별 추가 검사

스킬은 프로젝트의 프레임워크를 자동 감지하여 추가 검사를 수행합니다.

### Next.js / React

- `next/head` 또는 `next/metadata`에서 SEO 메타태그 설정 확인
- `generateMetadata` 또는 `metadata` export 여부
- `next-sitemap` 또는 수동 sitemap 설정

### Nuxt / Vue

- `useHead()` 또는 `nuxt.config` SEO 설정
- `@nuxtjs/sitemap` 모듈 사용 여부

### 정적 HTML

- 각 HTML 파일 직접 검사

---

## 결과 출력 형식

```
╔═ SEO Audit ═══════════════════════════════════════════
║ 📊 점수: 72/100
║ ❌ 오류: 5  ⚠️ 경고: 8  ℹ️ 정보: 3
╚═══════════════════════════════════════════════════════

── 높은 심각도 (반드시 수정) ─────────────────────────────
  ❌ [title] 3개 페이지에 <title> 태그가 없습니다
  ❌ [img-alt] 12개 이미지에 alt 속성이 없습니다
  ...

── 중간 심각도 (권장 수정) ──────────────────────────────
  ⚠️ [meta-desc] 5개 페이지에 메타 설명이 없습니다
  ...

── 개선 제안 ────────────────────────────────────────────
  💡 sitemap.xml 자동 생성을 위해 next-sitemap 패키지 추천
  💡 구조화 데이터(JSON-LD) 추가로 리치 결과 활성화 가능
```

---

## 참조 문서

- Google SEO 기본 가이드: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Google 검색 Essentials: https://developers.google.com/search/docs/essentials
- 구조화 데이터: https://developers.google.com/search/docs/appearance/structured-data
- Search Console: https://search.google.com/search-console
