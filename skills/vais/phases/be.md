### ⚙️ be — 백엔드 구현

#### Upstream Context Loading

1. Plan 문서 **전체** 읽기 (`docs/01-plan/{feature}.md`) — Context Anchor, Success Criteria, 정책 정의, 코딩 규칙 확인
2. Design 문서 **전체** 읽기 (`docs/02-design/{feature}.md`) — Architecture Option 선택 근거, API 설계, Session Guide 확인
3. Decision Record 표시:
   ```
   📋 Decision Record
   [Plan] 기술 스택: {선택} — {근거}
   [Plan] DB: {선택} — {근거}
   [Design] Architecture: Option {X} — {근거}
   ```

#### Code Comment Convention

구현 시 아래 주석 패턴을 핵심 결정 지점에 적용:
- 모듈/파일 수준: `// Design Ref: §{섹션} — {설계 결정 근거}`
- 핵심 로직: `// Plan SC: {성공 기준 내용}`

1. **피처 레지스트리 참조** (`.vais/features/{feature}.json`) — 구현해야 할 기능 목록(`features[]`) 전체 확인. 각 기능 구현 후 `status`를 `"진행중"` → `"완료"`로 업데이트
2. **기획서의 코딩 규칙 참조** (`docs/01-plan/{feature}.md`)
3. **Interface Contract 참조** (`docs/02-design/{feature}-ic.md`) — API 엔드포인트별 구현 스펙 (Method, Path, Request, Response, Auth)
4. **인프라 문서 참조** (`docs/03-infra/{feature}.md`) — DB 스키마, ORM 모델, 환경 설정 확인
5. 기획서의 데이터 요구사항 분석
6. **API 구현** — Interface Contract 기준:
   - 엔드포인트 구현 (기획서 API 컨벤션 준수)
   - 인증/인가 전략 적용
   - 에러 핸들링 (기획서 에러 처리 패턴 준수)
7. **데이터 접근 레이어 구현** (Infra에서 생성한 ORM 모델 활용):
   - CRUD 서비스/리포지토리
   - 트랜잭션 처리
8. 유효성 검증, 에러 핸들링 포함
9. 실제 코드 생성

**에이전트**: backender
