### 🎨 design — UI + DB 병렬 설계

UI 설계와 DB 설계를 **병렬로** 진행합니다.

1. **피처 레지스트리 확인** (`.vais/features/$1.json`) — 기능 목록, 정책, 기술 스택, `hasDatabase` 플래그 참조
2. **DB 필요 시 → DB 종류 선택**:
   - **auto 모드**: 기본값 SQLite
   - **수동 모드**: AskUserQuestion으로 선택:
     1. "SQLite (추천 — 설정 없이 바로 시작)"
     2. "PostgreSQL / MySQL (로컬 또는 Docker)"
     3. "Supabase / Firebase (클라우드 BaaS)"
   - 외부 서비스 선택 시 `.env` 변수명 안내
3. **DB 필요 시** → 병렬 실행:
   - **UI 설계** (designer 에이전트):
     - 디자인 토큰, 공통 컴포넌트 명세
     - **화면별 상세 정의**: 각 화면의 와이어프레임 참조 + 사용 컴포넌트 + 상태 + 인터랙션 + 데이터 흐름 통합
     - 기획서(plan)의 기능 목록 및 정책 정의 참조
     - `docs/05-design/$1.md`에 저장
   - **DB 설계** (backend-dev 에이전트):
     - ERD (Mermaid), 스키마, 인덱스, 관계
     - ORM 권장: SQLite→better-sqlite3/Drizzle, PostgreSQL→Prisma, Supabase→@supabase/supabase-js
     - `docs/05-design/$1-db.md`에 저장
4. **DB 불필요 시** → UI 설계만

**에이전트 매핑:**
| 에이전트 A | 에이전트 B |
|-----------|-----------|
| designer → UI 설계 | backend-dev → DB 설계 |
