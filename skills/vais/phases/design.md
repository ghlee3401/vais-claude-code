### 🎨 design — IA + 와이어프레임 + UI 설계 통합

IA 설계, 와이어프레임, UI 설계를 **하나의 단계**에서 통합 수행합니다.

#### Upstream Context Loading

1. Plan 문서를 **전체** 읽기 (`docs/01-plan/{feature}.md`) — 요약이 아닌 전문. Executive Summary, Context Anchor, Success Criteria, Impact Analysis 모두 확인
2. Plan의 **Context Anchor**를 Design 문서 상단에 **복사** (WHY/WHO/RISK/SUCCESS/SCOPE)
3. Plan의 **Success Criteria**를 인지하고 설계 결정에 반영

#### Architecture Options 제시

Plan 읽기 완료 후, 3가지 설계안을 제시:
- **Option A — Minimal Changes**: 기존 코드 최대 재사용. 빠르지만 결합도 높을 수 있음
- **Option B — Clean Architecture**: 관심사 분리 최적. 유지보수 최고. 파일 많고 리팩토링 필요
- **Option C — Pragmatic Balance**: 적절한 경계. 과도한 설계 없이 좋은 구조. 기본 추천

비교 테이블 (복잡도/유지보수/구현 속도/리스크) 포함.

#### Checkpoint 3 — 설계안 선택

AskUserQuestion **(preview 포함)**: "3가지 설계안 중 어떤 걸 선택하시겠습니까?"
- 각 Option에 **폴더 구조/파일 목록을 preview로 표시** (monospace, 10줄 이내)
- preview 예시: 주요 폴더 트리 + 핵심 파일 + 예상 파일 수
- 추천안에 "(Recommended)" 표시
- 사용자가 구조를 시각적으로 비교한 뒤 선택
- 사용자 선택 후 해당 Option 기반으로 설계 문서 작성

#### Part 1: IA 설계

1. **기획서 읽기** (`docs/01-plan/{feature}.md`)
2. **피처 레지스트리 확인** (`.vais/features/{feature}.json`) — plan에서 정의된 기능 목록·화면·정책을 참조하여 누락 없이 IA에 반영
3. 사이트맵, 네비게이션 구조 설계 — 레지스트리의 모든 기능(`features[]`)과 화면(`screens[]`)을 포함
4. **태스크 기반 유저플로우 작성** — 레지스트리의 각 기능을 사용자 태스크로 분해. 태스크별로:
   - 사용자 목표, 시작점, 종료 조건 정의
   - Step별 사용자 행동 → 시스템 반응 → 분기(성공/실패/예외) Mermaid 다이어그램 작성
   - 크로스 태스크 의존성(선후 관계, 공유 상태) 정리
5. 화면 흐름도 — 태스크 플로우에서 도출된 화면 간 이동 경로

#### Part 2: 와이어프레임

6. 각 화면의 와이어프레임 생성 — 레지스트리의 `screens[]` 기준, 태스크 플로우의 성공/실패/예외 상태를 모두 반영
7. 반응형 레이아웃 (모바일/태블릿/데스크탑)
8. **컴포넌트 어노테이션**: `data-component`, `data-props` 속성 추가
   ```html
   <div data-component="LoginForm" data-props="onSubmit, isLoading, error">...</div>
   ```

**와이어프레임 형식 (기본: ASCII)**
- 박스는 `┌─┐│└─┘` 문자 사용
- 버튼은 `[ Button ]`, 입력필드는 `[____________]`
- 디바이스별 규격: Mobile 40칸 / Tablet 60칸 / Desktop 80칸
- `(*)` 필수입력, `(→ 화면명)` 화면이동, `(popup)` 팝업/모달

#### Part 3: UI 설계

9. **UI/UX Pro Max로 디자인 토큰 생성** (필수 — 와이어프레임 이후 실행):
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
10. **화면별 상세 정의** — 디자인 토큰 기반으로:
    - `design-system/{feature}/MASTER.md`의 디자인 토큰을 **그대로 사용** (직접 토큰을 만들지 않음)
    - 각 화면의 와이어프레임 참조 + 사용 컴포넌트 + 상태 + 인터랙션 + 데이터 흐름 통합
    - 기획서(plan)의 기능 목록 및 정책 정의 참조
#### Session Guide 생성

설계 문서 완성 후:
1. 구현해야 할 모듈을 **Module Map**으로 정리 (module-1, module-2, ...)
2. 세션별 추천 구현 순서를 **Recommended Session Plan**으로 작성
3. `## Session Guide` 섹션으로 문서 하단에 추가

> Session Guide는 이후 `/vais frontend`, `/vais backend` 실행 시 구현 순서를 안내합니다.


11. `docs/02-design/{feature}.md`에 저장 (`templates/design.template.md` 구조)

| **디자인 리뷰** | design 에이전트 | `docs/02-design/{feature}-review.md` |

**에이전트**: design
