### 📋 plan — 기획 + Plan-Plus

1. research 문서가 있으면 먼저 읽기 (`docs/01-research/{feature}.md`)
2. 프로젝트 기존 코드와 구조 파악
3. `templates/plan.template.md` 템플릿 기반으로 기획서 작성
4. **Plan-Plus 3단계 검증**:
   - **의도 탐색**: "이 기능이 정말 해결하려는 문제가 뭔가?"
   - **대안 탐색**: "기존 라이브러리나 다른 접근법은 없나?"
   - **YAGNI 리뷰**: "지금 당장 필요한 것만 포함했나?"
5. AskUserQuestion으로 검증 결과 확인 → **핑퐁 루프**: 사용자가 수정 요청 시 반영 후 수정 결과를 보여주고, "계속"/"추가 수정"/"중단" 중 선택. "계속"을 선택할 때까지 반복
6. **DB 필요 여부 판단** → 기획서에 기록 (`hasDatabase: true/false`)
7. **코딩 규칙 정의** → 기획서에 포함:
   - 네이밍 컨벤션, 폴더 구조, 코드 스타일
   - 커밋 컨벤션, API 컨벤션, 에러 처리 패턴
8. **UI 컴포넌트 라이브러리 선택**:
   - **auto 모드**: 기술 스택에 따라 자동 추천 (React/Next.js → shadcn/ui, Vue → 직접 구현)
   - **수동 모드**: AskUserQuestion으로 선택:
     1. "shadcn/ui (추천 — Radix + Tailwind, 커스터마이징 자유)"
     2. "Ant Design (관리자/대시보드에 강함)"
     3. "Material UI (Google Material Design)"
     4. "직접 구현 (라이브러리 없이)"
   - 선택 결과를 기술 스택 표에 기록
9. `docs/02-plan/{feature}.md`에 저장
10. **피처 레지스트리 저장** — 기획서 작성 후 반드시 `.vais/features/{feature}.json`에 기능 목록을 구조화 저장:
    ```json
    {
      "features": [
        { "id": "F1", "name": "기능명", "description": "설명", "screens": ["화면1"], "priority": "Must", "status": "미구현" },
        { "id": "F2", "name": "기능명2", "description": "설명2", "screens": ["화면2"], "priority": "Nice", "status": "미구현" }
      ],
      "policies": { "auth": "...", "validation": "..." },
      "hasDatabase": true,
      "techStack": { "fe": "Next.js", "be": "..." }
    }
    ```
    - 기획서의 **기능 목록 표**에서 모든 기능을 `features` 배열로 추출
    - 이 레지스트리는 이후 **모든 단계**(ia~review)에서 자동 참조됩니다

**기획서 필수 포함 항목:**
- 기능 개요 및 목적
- 사용자 스토리
- 기능 요구사항 — **기능 목록 표** (기능, 설명, 관련 화면, 관련 파일, 우선순위, 구현 상태) + **기능 상세** (트리거, 정상/예외 흐름, 산출물)
- 정책 정의 — 비즈니스 규칙, 권한 정책, 유효성 검증 규칙
- 비기능 요구사항 (성능, 보안)
- 기술 스택 결정
- DB 필요 여부
- 코딩 규칙 (네이밍, 구조, 스타일)
- UI 컴포넌트 라이브러리 선택
- YAGNI 검증 결과
- 변경 이력 (version, date, change 표)
