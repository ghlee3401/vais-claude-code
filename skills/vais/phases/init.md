### 🔄 init — 기존 프로젝트에 VAIS Code 적용

기존 코드베이스를 분석하여 VAIS 워크플로우 문서를 역생성합니다.
**정상 설계(forward)와 동일한 템플릿·경로·구조를 사용합니다.**

#### Step 1: 프로젝트 스캔

1. **프로젝트 구조 파악**: 폴더 구조, 주요 파일, package.json / requirements.txt 등
2. **기술 스택 감지**: 언어, 프레임워크, 라이브러리, DB, 빌드 도구
3. **기존 문서 확인**: README, docs/, API 문서 등 이미 존재하는 문서 수집

#### Step 2: AskUserQuestion으로 범위 확인

- "어떤 피처(기능)를 기준으로 문서화할까요?" (전체 / 특정 기능 선택)
- "문서 생성 범위를 선택하세요" (옵션: 전체 문서, plan+design만, plan만)

#### Step 3: 문서 역생성 (피처별)

각 피처에 대해 코드를 읽고 다음 문서를 생성합니다.
**반드시 `templates/` 디렉토리의 템플릿 구조를 따릅니다** — 섹션 순서, 표 형식, 헤딩 레벨을 템플릿과 동일하게 유지합니다.

1. **research** → `docs/01-research/{feature}.md`
   - `templates/research.template.md` 구조를 따라 작성
   - 프로젝트 개요, 사용 기술, 기존 유사 서비스 분석
   - 현재 코드에서 추출한 핵심 기능 목록
   - MVP 범위: 이미 구현된 기능 = MVP, 미구현 = 이후 버전

2. **plan** → `docs/02-plan/{feature}.md`
   - `templates/plan.template.md` 구조를 따라 작성
   - 코드에서 역추출한 **기능 목록 표** (기능, 설명, 관련 화면, 관련 파일, 우선순위, 구현 상태)
   - 각 기능의 **상세 동작** (트리거, 정상/예외 흐름)
   - 코드에서 추출한 **정책 정의** (비즈니스 규칙, 권한, 유효성 검증)
   - 기존 코드의 코딩 규칙 분석 (네이밍, 구조, 패턴)
   - UI 컴포넌트 라이브러리 현황 파악
   - 기술 스택 정리
   - Plan-Plus 검증: 역설계 시에는 "현재 구현의 의도 탐색 + 개선 대안 탐색 + YAGNI 리뷰" 관점

3. **ia** → `docs/03-ia/{feature}.md`
   - 라우트 구조, 페이지 계층, 네비게이션 분석
   - 기존 코드의 라우터/페이지 구조에서 자동 추출

4. **wireframe** → `docs/04-wireframe/{feature}.md`
   - 기존 페이지/컴포넌트의 레이아웃 구조 문서화
   - ASCII 기반 와이어프레임으로 현재 화면 구조 정리

5. **design** → `docs/05-design/{feature}.md` + `{feature}-db.md`
   - `templates/design.template.md` 구조를 따라 작성
   - 디자인 토큰, 공통 컴포넌트 명세
   - **화면별 상세 정의**: 기존 화면의 컴포넌트 + 상태 + 인터랙션 + 데이터 흐름 통합 정리
   - DB: `templates/db.template.md` 구조를 따라 기존 스키마/모델에서 ERD 역추출

#### Step 4: 피처 레지스트리 생성

**반드시** `.vais/features/{feature}.json`에 기능 목록을 구조화 저장합니다 (plan 단계와 동일한 형식):

```json
{
  "features": [
    { "id": "F1", "name": "기능명", "description": "설명", "screens": ["화면1"], "priority": "Must", "status": "완료" }
  ],
  "policies": { "auth": "...", "validation": "..." },
  "hasDatabase": true,
  "techStack": { "fe": "Next.js", "be": "..." }
}
```

- 이미 구현된 기능은 `status: "완료"`, 미구현은 `status: "미구현"`
- 이 레지스트리는 이후 모든 단계(check, review 등)에서 자동 참조됩니다

#### Step 5: 상태 초기화

1. `.vais/status.json`에 피처 등록
2. AskUserQuestion: "다음 단계를 선택하세요"
   - "Gap 분석 실행 (`/vais check {feature}`)" — 문서 vs 코드 일치 확인 → 현재 단계를 `check`으로 설정
   - "기획부터 재검토 (`/vais plan {feature}`)" — 역생성 문서를 기반으로 기획 재정비 → 현재 단계를 `plan`으로 설정
   - "특정 단계부터 개발 계속" — 원하는 단계 선택 → 선택한 단계로 설정
   - "문서만 확인" — 생성된 문서 검토 → 현재 단계를 `research`로 설정

> **참고**: init은 check/review 문서를 직접 생성하지 않습니다. 역설계 후 `/vais check {feature}`로 Gap 분석을 실행하면 `docs/06-check/{feature}.md`가, `/vais review {feature}`로 검토하면 `docs/07-review/{feature}.md`가 생성됩니다.

#### 주의사항

- 기존 코드를 **수정하지 않음** — 문서만 생성
- 대규모 프로젝트는 피처 단위로 나눠서 실행 권장
- 생성된 문서는 초안이므로, 사용자가 검토 후 보완 필요
