# Vendor Dependencies

이 디렉토리는 VAIS Code 플러그인에서 사용하는 외부 라이브러리를 포함합니다.

## UI/UX Pro Max Design System

### 개요

**UI/UX Pro Max**는 VAIS 자체 개발 디자인 시스템으로, 일관되고 전문적인 사용자 인터페이스를 구현하기 위한 포괄적인 디자인 토큰, 컴포넌트, 가이드라인을 제공합니다.

| 항목 | 내용 |
|------|------|
| **경로** | `ui-ux-pro-max/` |
| **출처** | VAIS Voice (자체 디자인 시스템) |
| **라이선스** | MIT (VAIS Code 플러그인과 함께 배포) |
| **버전** | v0.45.2 |

### 주요 콘텐츠

| 항목 | 수량 | 설명 |
|------|------|------|
| **스타일** | 50+ | 색상, 타이포그래피, 간격, 그림자, 테두리 등 |
| **컬러 팔레트** | 161개 | Primary, Secondary, Neutral, Semantic 색상 |
| **폰트 페어링** | 57개 | 제목 + 본문 폰트 조합 권장사항 |

### 사용 방법

#### 1. Design 단계에서 접근

VAIS Code의 **design** 단계에서 MCP Tool Search를 통해 lazy load됩니다.

```bash
/vais design [feature-name]
```

#### 2. MCP 도구를 통한 검색

다음 MCP 도구를 활용하여 필요한 디자인 요소를 검색합니다:

| 도구 | 설명 | 용도 |
|------|------|------|
| `design_search` | 컬러, 폰트, 스타일 검색 | 특정 디자인 토큰 찾기 |
| `design_system_generate` | 커스텀 디자인 생성 | 프로젝트별 디자인 토큰 세트 자동 생성 |
| `design_stack_search` | 디자인 스택 검색 | 특정 기술 스택에 맞는 권장 스타일 조회 |

#### 3. 설계서에 통합

`docs/{feature}/02-design/main.md` 문서의 **Part 3: UI 설계** 섹션에서 다음을 정의합니다:

- **3.1 디자인 토큰**
  - 색상 팔레트 (161개 중 선택)
  - 타이포그래피 규칙 (57개 폰트 페어링 중 선택)
  - 간격 시스템
- **3.2 사용 컴포넌트 라이브러리**
  - 선택한 UI 라이브러리 (shadcn/ui, Ant Design, MUI 등)
  - 디자인 시스템과의 통합 방식

### 주요 디자인 토큰

#### 색상 체계

- **Primary (주요 색상)**: 브랜드 신원, CTA 강조
- **Secondary (보조 색상)**: 보조 액션, 정보성 요소
- **Neutral (중립 색상)**: 배경, 텍스트, 분리선
- **Semantic (의미 색상)**: Success (녹색), Error (빨강), Warning (주황), Info (파랑)

#### 타이포그래피

- **제목**: H1 (2rem) ~ H3 (1.25rem)
- **본문**: Body (1rem), Caption (0.875rem), Small (0.75rem)
- **굵기**: 400 (Regular) ~ 700 (Bold)

#### 간격 시스템

```
xs: 4px    (아이콘 간격)
sm: 8px    (요소 내부)
md: 16px   (요소 간)
lg: 24px   (섹션 간)
xl: 32px   (페이지 패딩)
```

### 기술 사양

- **용도**: `design` 단계에서 MCP Tool Search를 통해 lazy-loaded
- **검색 엔진**: BM25 기반 Python 스크립트 (`scripts/search.py`)
- **요구사항**: Python 3.8+

### 활성화 조건

- MCP 서버 설정에서 `lazy_load: true`로 구성
- `design` 단계에서만 자동 활성화 (IA + 와이어프레임 + UI 설계 통합)
- 다른 단계에서는 로드되지 않아 리소스 절약

### 크기 정보

- CSV 데이터셋: ~5MB
- Python 스크립트: ~50KB
- 전체: ~6MB

### 설계 워크플로우

```
기획서 (plan)
    ↓
    설계서 (design)
        ├─ Part 1: IA (사이트맵, 네비게이션)
        ├─ Part 2: 와이어프레임
        └─ Part 3: UI 설계
            ├─ 디자인 토큰 선택 (UI/UX Pro Max)
            ├─ 컴포넌트 라이브러리 선택
            └─ 화면별 상세 정의
    ↓
    개발 단계 (프론트엔드/백엔드)
```

---

**최종 수정**: 2026-04-05
**버전**: v0.45.2 (VAIS Code와 동기화)
