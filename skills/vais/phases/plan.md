### 📋 plan — 기획 (Research + Plan-Plus 통합)

#### Step 1: 아이디어 탐색 (Research 흡수)

1. 사용자의 아이디어를 경청하고 정리
2. AskUserQuestion으로 파악: 무엇을 만들고 싶은지, 타겟 사용자, 해결할 문제
3. 핵심 기능 브레인스토밍 + **MVP 범위 결정**:
   - 중요도/난이도 매트릭스로 우선순위
   - MVP 최소 기능 선별, 이후 버전으로 미룰 기능 분류
4. **피처명은 영어** (kebab-case: `login`, `payment`, `chat`)
5. 경쟁/참고 서비스 간단 분석

#### Step 2: 기획서 작성

1. 프로젝트 기존 코드와 구조 파악
2. `templates/plan.template.md` 템플릿 기반으로 기획서 작성
3. **Plan-Plus 3단계 검증**:
   - **의도 탐색**: "이 기능이 정말 해결하려는 문제가 뭔가?"
   - **대안 탐색**: "기존 라이브러리나 다른 접근법은 없나?"
   - **YAGNI 리뷰**: "지금 당장 필요한 것만 포함했나?"
4. AskUserQuestion으로 검증 결과 확인 → **핑퐁 루프**: 사용자가 수정 요청 시 반영 후 수정 결과를 보여주고, "계속"/"추가 수정"/"중단" 중 선택. "계속"을 선택할 때까지 반복
5. **DB 필요 여부 판단** → 기획서에 기록 (`hasDatabase: true/false`)
6. **코딩 규칙 정의** → 기획서에 포함:
   - 네이밍 컨벤션, 폴더 구조, 코드 스타일
   - 커밋 컨벤션, API 컨벤션, 에러 처리 패턴
7. **UI 컴포넌트 라이브러리 선택**:
   - **auto 모드**: 기술 스택에 따라 자동 추천 (React/Next.js → shadcn/ui, Vue → 직접 구현)
   - **수동 모드**: AskUserQuestion으로 선택:
     1. "shadcn/ui (추천 — Radix + Tailwind, 커스터마이징 자유)"
     2. "Ant Design (관리자/대시보드에 강함)"
     3. "Material UI (Google Material Design)"
     4. "직접 구현 (라이브러리 없이)"
   - 선택 결과를 기술 스택 표에 기록

#### Step 3: 데이터 모델 & API 개요

8. **데이터 모델 개요** — 엔티티 목록, 관계, 핵심 필드를 기획서에 포함 (Infra 단계에서 상세 스키마로 확장됨)
9. **API 엔드포인트 개요** — 주요 엔드포인트, Method, 설명을 기획서에 포함 (Gate 2에서 Interface Contract로 확정됨)

#### Step 4: 저장

10. `docs/01-plan/{feature}.md`에 저장
11. **피처 레지스트리 저장** — 기획서 작성 후 반드시 `.vais/features/{feature}.json`에 기능 목록을 구조화 저장:
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
    - 이 레지스트리는 이후 **모든 단계**(design~qa)에서 자동 참조됩니다

**기획서 필수 포함 항목:**
- 아이디어 개요 및 배경
- 타겟 사용자 및 사용자 시나리오
- MVP 범위 및 우선순위
- 기능 요구사항 — **기능 목록 표** (기능, 설명, 관련 화면, 관련 파일, 우선순위, 구현 상태) + **기능 상세** (트리거, 정상/예외 흐름, 산출물)
- 정책 정의 — 비즈니스 규칙, 권한 정책, 유효성 검증 규칙
- 비기능 요구사항 (성능, 보안)
- 기술 스택 결정
- 데이터 모델 개요 (엔티티, 관계)
- API 엔드포인트 개요
- DB 필요 여부
- 코딩 규칙 (네이밍, 구조, 스타일)
- UI 컴포넌트 라이브러리 선택
- YAGNI 검증 결과
- 변경 이력 (version, date, change 표)
