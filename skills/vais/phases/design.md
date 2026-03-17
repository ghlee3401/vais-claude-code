### 🎨 design — UI + DB 병렬 설계

UI 설계와 DB 설계를 **병렬로** 진행합니다.

1. **피처 레지스트리 확인** (`.vais/features/{feature}.json`) — 기능 목록, 정책, 기술 스택, `hasDatabase` 플래그 참조
2. **UI/UX Pro Max로 디자인 토큰 생성** (필수 — designer 에이전트보다 먼저 실행):
   - `vendor/ui-ux-pro-max/SKILL.md`의 워크플로우를 따릅니다
   - 기획서의 기술 스택·제품 유형·스타일 키워드를 기반으로 디자인 시스템 생성:
     ```bash
     python3 vendor/ui-ux-pro-max/scripts/search.py "<제품유형> <키워드>" --design-system --persist -p "{feature}"
     ```
   - 생성 결과: `design-system/{feature}/MASTER.md` (색상, 타이포그래피, 스타일, 컴포넌트 가이드)
   - 필요 시 화면별 오버라이드 추가:
     ```bash
     python3 vendor/ui-ux-pro-max/scripts/search.py "<키워드>" --design-system --persist -p "{feature}" --page "<화면명>"
     ```
   - 추가 도메인 검색 (필요 시):
     ```bash
     python3 vendor/ui-ux-pro-max/scripts/search.py "<키워드>" --domain <color|typography|ux|style|chart>
     ```
3. **DB 필요 시 → DB 종류 선택**:
   - **auto 모드**: 기본값 SQLite
   - **수동 모드**: AskUserQuestion으로 선택:
     1. "SQLite (추천 — 설정 없이 바로 시작)"
     2. "PostgreSQL / MySQL (로컬 또는 Docker)"
     3. "Supabase / Firebase (클라우드 BaaS)"
   - 외부 서비스 선택 시 `.env` 변수명 안내
4. **DB 필요 시** → 병렬 실행:
   - **UI 설계** (designer 에이전트):
     - `design-system/{feature}/MASTER.md`의 디자인 토큰을 **그대로 사용** (직접 토큰을 만들지 않음)
     - 토큰 기반으로 **화면별 상세 정의**: 각 화면의 와이어프레임 참조 + 사용 컴포넌트 + 상태 + 인터랙션 + 데이터 흐름 통합
     - 기획서(plan)의 기능 목록 및 정책 정의 참조
     - `templates/design.template.md` 구조를 따라 작성
     - `docs/05-design/{feature}.md`에 저장
   - **DB 설계** (backend-dev 에이전트):
     - ERD (Mermaid), 스키마, 인덱스, 관계
     - ORM 권장: SQLite→better-sqlite3/Drizzle, PostgreSQL→Prisma, Supabase→@supabase/supabase-js
     - `docs/05-design/{feature}-db.md`에 저장
5. **DB 불필요 시** → UI 설계만

**역할 분리:**
| 역할 | 담당 | 산출물 |
|------|------|--------|
| **디자인 토큰 생성** | UI/UX Pro Max (search.py) | `design-system/{feature}/MASTER.md` |
| **화면별 상세 설계** | designer 에이전트 | `docs/05-design/{feature}.md` |
| **DB 설계** | backend-dev 에이전트 | `docs/05-design/{feature}-db.md` |
