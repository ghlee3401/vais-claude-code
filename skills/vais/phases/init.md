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
**반드시 `templates/` 디렉토리의 템플릿 구조를 따릅니다.**

1. **plan** → `docs/01-plan/{feature}.md`
   - `templates/plan.template.md` 구조를 따라 작성
   - 프로젝트 개요, 아이디어 배경, 타겟 사용자, MVP 범위
   - 코드에서 역추출한 **기능 목록 표** (기능, 설명, 관련 화면, 관련 파일, 우선순위, 구현 상태)
   - 각 기능의 **상세 동작** (트리거, 정상/예외 흐름)
   - 코드에서 추출한 **정책 정의** (비즈니스 규칙, 권한, 유효성 검증)
   - 기존 코드의 코딩 규칙 분석, UI 컴포넌트 라이브러리 현황, 기술 스택 정리
   - 데이터 모델 개요, API 엔드포인트 개요

2. **design** → `docs/02-design/{feature}.md`
   - `templates/design.template.md` 구조를 따라 작성
   - Part 1 IA: 라우트 구조, 페이지 계층, 네비게이션 분석 (기존 라우터에서 추출)
   - Part 2 와이어프레임: 기존 페이지/컴포넌트 레이아웃 구조 문서화
   - Part 3 UI 설계: 디자인 토큰, 공통 컴포넌트 명세, 화면별 상세 정의

3. **architect** → `docs/03-architect/{feature}.md`
   - `templates/infra.template.md` 구조를 따라 작성
   - 기존 DB 스키마/모델에서 ERD 역추출
   - 마이그레이션 현황, 환경 설정

#### Step 4: 피처 레지스트리 생성

**반드시** `.vais/features/{feature}.json`에 기능 목록을 구조화 저장합니다:

```json
{
  "features": [
    { "id": "F1", "name": "기능명", "description": "설명", "screens": ["화면1"], "priority": "Must", "status": "완료" }
  ],
  "policies": { "auth": "...", "validation": "..." },
  "hasDatabase": true,
  "techStack": { "frontend": "Next.js", "backend": "..." }
}
```

- 이미 구현된 기능은 `status: "완료"`, 미구현은 `status: "미구현"`

#### Step 5: 상태 초기화

1. `.vais/status.json`에 피처 등록
2. AskUserQuestion: "다음 단계를 선택하세요"
   - "리뷰 실행 (`/vais review {feature}`)" — 문서 vs 코드 일치 확인 → 현재 단계를 `review`로 설정
   - "기획부터 재검토 (`/vais plan {feature}`)" — 역생성 문서를 기반으로 기획 재정비 → 현재 단계를 `plan`으로 설정
   - "특정 단계부터 개발 계속" — 원하는 단계 선택 → 선택한 단계로 설정
   - "문서만 확인" — 생성된 문서 검토 → 현재 단계를 `plan`으로 설정

> **참고**: init은 리뷰 문서를 직접 생성하지 않습니다. 역설계 후 `/vais review {feature}`로 리뷰를 실행하면 `docs/04-review/{feature}.md`가 생성됩니다.

#### 주의사항

- 기존 코드를 **수정하지 않음** — 문서만 생성
- 대규모 프로젝트는 피처 단위로 나눠서 실행 권장
- 생성된 문서는 초안이므로, 사용자가 검토 후 보완 필요
