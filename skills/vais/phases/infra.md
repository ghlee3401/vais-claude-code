### 🔧 infra — 인프라 설정

1. **기획서 읽기** (`docs/01-plan/{feature}.md`) — 데이터 모델, 기술 스택, `hasDatabase` 확인
2. **피처 레지스트리 확인** (`.vais/features/{feature}.json`) — 기능 목록, 정책, 기술 스택 참조
3. **설계 문서 읽기** (`docs/02-design/{feature}.md`) — 화면별 데이터 요구사항 확인
4. **DB 필요 시 → DB 종류 선택**:
   - **auto 모드**: 기본값 SQLite
   - **수동 모드**: AskUserQuestion으로 선택:
     1. "SQLite (추천 — 설정 없이 바로 시작)"
     2. "PostgreSQL / MySQL (로컬 또는 Docker)"
     3. "Supabase / Firebase (클라우드 BaaS)"
   - 외부 서비스 선택 시 `.env` 변수명 안내
5. **DB 스키마 설계**:
   - ERD (Mermaid)
   - 테이블 스키마 — 컬럼, 타입, 제약조건, 기본값
   - 인덱스 정의 — 성능을 위한 인덱스
   - 관계 정의 — FK, ON DELETE 규칙
   - ORM 권장: SQLite→better-sqlite3/Drizzle, PostgreSQL→Prisma, Supabase→@supabase/supabase-js
6. **마이그레이션 파일 생성** — SQL 또는 ORM 마이그레이션
7. **ORM 모델/스키마 생성** — 선택한 ORM에 맞는 모델 파일
8. **환경 변수 템플릿** — `.env.example` 생성
9. **프로젝트 설정 확인** — package.json, tsconfig 등 필요한 설정 추가/확인
10. `docs/03-infra/{feature}.md`에 인프라 문서 저장 (`templates/infra.template.md` 구조)

**에이전트**: infra-dev

**산출물:**
- `docs/03-infra/{feature}.md` — 인프라 설계 문서 (ERD, 스키마, 환경 설정)
- 마이그레이션 파일, ORM 모델 파일 (실제 코드)
- `.env.example` (환경 변수 템플릿)
