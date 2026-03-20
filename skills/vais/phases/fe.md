### 💻 fe — 프론트엔드 구현

1. **피처 레지스트리 참조** (`.vais/features/{feature}.json`) — 구현해야 할 기능 목록(`features[]`) 전체 확인. 각 기능 구현 후 `status`를 `"진행중"` → `"완료"`로 업데이트
2. **기획서 참조** (`docs/01-plan/{feature}.md`) — 정책 정의, 코딩 규칙, UI 컴포넌트 라이브러리 확인
3. **디자인 시스템 참조** (`design-system/{feature}/MASTER.md`) — 색상, 타이포, 간격, 스타일 토큰. 화면별 오버라이드가 있으면 `design-system/{feature}/pages/` 우선
4. **설계 문서의 화면별 상세 정의 참조** (`docs/02-design/{feature}.md`) — IA, 와이어프레임, 화면별 컴포넌트, 상태, 인터랙션, 데이터 흐름 확인
5. **Interface Contract 참조** (`docs/02-design/{feature}-ic.md`) — API 엔드포인트, 요청/응답 스키마, 에러 코드 확인
6. **인프라 문서 참조** (`docs/03-infra/{feature}.md`) — 프로젝트 설정, 환경 변수 확인
7. **UI 컴포넌트 라이브러리 설정**:
   - 기획서에서 선택된 라이브러리 확인
   - **라이브러리가 있으면**: 설치 및 초기화 (예: `npx shadcn@latest init`)
   - 화면별 상세 정의의 컴포넌트 매핑표 기반으로 필요한 컴포넌트 추가
8. **화면별로 구현** — 설계 문서의 화면별 상세 정의 순서대로:
   - 라이브러리 컴포넌트를 우선 사용 (Button, Input, Card, Dialog 등)
   - 라이브러리에 없는 컴포넌트만 커스텀 구현
   - 상태 정의(로딩/에러/빈 상태) 반영
   - 인터랙션 패턴과 데이터 흐름 구현
   - 정책 정의(유효성 검증, 권한)를 화면에 반영
   - **Interface Contract의 API 엔드포인트에 맞춰** API 호출 구현
9. **CSS/스타일 파일 확인**:
   - Glob으로 기존 CSS 탐색 (`**/*.css`, `**/*.scss`, `**/tailwind.config.*`)
   - **auto 모드**: CSS 없으면 design 토큰 기반 자동 생성
   - **수동 모드**: AskUserQuestion으로 선택
10. 반응형, 접근성 구현
11. 실제 코드 생성
