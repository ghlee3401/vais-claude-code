# Vendor Dependencies

이 디렉토리는 VAIS Code 플러그인에서 사용하는 외부 라이브러리를 포함합니다.

## UI/UX Pro Max Design System

- **경로**: `ui-ux-pro-max/`
- **라이선스**: MIT
- **설명**: 50+ 디자인 스타일, 161 컬러 팔레트, 57 폰트 페어링을 포함한 디자인 시스템
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
