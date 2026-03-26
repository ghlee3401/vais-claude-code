### ✅ review — 빌드 검증 + Gap 분석 + 코드 리뷰

**빌드/실행 검증 → Gap 분석 → 보안 스캔 → QA 시나리오 → 코드 리뷰 → 리턴 경로 산출** 순서로 진행합니다.

#### Step 1: 빌드/실행 검증

1. 의존성 설치 확인 (`npm install` 등)
2. 빌드 확인 (`npm run build` 등)
3. 서버 시작 확인 (dev server 기동)
4. 핵심 동작 확인 (메인 페이지 로드, API 응답)
5. **빌드 실패 시**: 에러 분석 → 수정 시도. Gap 분석으로 넘어가지 않음.

#### Step 2: Gap 분석

1. **피처 레지스트리 로드** (`.vais/features/{feature}.json`) — plan에서 정의된 기능 목록을 기준으로 Gap 분석
2. **설계 문서 수집**: plan, design, architect 문서 읽기
3. **구현 코드 수집**: 해당 피처 코드 전체 읽기
4. **자동 비교**: 레지스트리의 `features[]` 각 항목 vs 코드 구현 여부. 구현된 기능은 레지스트리 `status`를 `"완료"`로 업데이트
5. **일치율**: `(구현된 수 / 전체 수) x 100` — 레지스트리 기준
6. **Gap은 패치 단위로 출력**:
   ```markdown
   | # | 미구현 항목 | 출처 | 수정 대상 파일 | 수정 범위 | 수정 내용 |
   ```
7. **Gap 방향 판단**: Gap 항목을 유형별로 그룹화(코드 미구현 / 설계-코드 불일치 / 문서 누락)하여 **그룹 단위로** AskUserQuestion 호출. 그룹별로 "구현을 설계에 맞출지 / 설계를 구현에 맞출지" 선택 요청
8. **자동 반복**: 일치율 `gapAnalysis.matchThreshold`(기본 90%) 미만 → 미구현 항목 자동 구현 시도 (최대 `gapAnalysis.maxIterations`회, 기본 5회)

#### Step 2.5: Architecture & Convention Compliance

1. Plan의 코딩 규칙 vs 실제 코드 비교 (네이밍, 폴더 구조, import 순서)
2. Design의 Architecture Option 선택 vs 실제 구조 비교 (계층, 의존성 방향)
3. 결과를 qa.template.md의 Architecture Compliance / Convention Compliance 섹션에 기록
4. Compliance Score 산출

#### Step 2.6: Success Criteria Evaluation

1. Plan의 **Success Criteria** 각 항목 읽기
2. 구현 코드에서 증거 수집 (파일:라인 또는 테스트 결과)
3. 각 항목을 **✅ Met / ⚠️ Partial / ❌ Not Met** 평가
4. Success Rate 산출: `(Met 수 / 전체 수) × 100%`
5. ❌ Not Met 항목은 자동으로 Critical 이슈로 분류

#### Step 3: 보안 스캔

1. OWASP Top 10 체크리스트 기반 검사
2. 인증/인가, SQL Injection, XSS, CSRF 점검
3. 환경 변수 민감 정보 노출 확인

#### Step 4: QA 시나리오 검증

1. **기획서(plan) 읽기** → 기능 요구사항 추출
2. **핵심 기능 시나리오**: 각 요구사항별 사용자 관점 테스트 시나리오 (P0/P1/P2)
3. **엣지 케이스**: 빈 입력, 경계값, 권한 없음, 네트워크 오류 등 예외 상황
4. **UI/UX 검증**: 반응형, 로딩 상태, 에러 상태, 빈 상태
5. 각 시나리오를 코드 기반으로 검증 (Pass/Fail 판정)
6. QA 통과율 산출: (Pass / 전체) x 100

#### Step 5: 코드 품질 리뷰

1. 기획서의 코딩 규칙 준수 여부
2. 네이밍, 중복, 에러 핸들링, 접근성
3. 성능 (N+1 쿼리, 메모리 누수, 불필요한 렌더링, 번들 사이즈)
4. 테스트 커버리지

#### Step 5.5: Expert Code Review (Google Staff Engineer Critique)

코드 품질 리뷰 결과를 바탕으로, **Google Staff Engineer (L7)** 관점에서 심층 크리틱을 수행합니다.

1. **8개 관점 순회**: 가독성, 단순성, 신뢰성, 테스트 가능성, 성능, 보안, 설계 패턴, API 설계
2. **대화체 리뷰**: 실제 구글 코드 리뷰처럼 이야기하듯 작성 — 테이블/점수 없이 서술형
3. **Nit vs Must-fix 구분**: 사소한 지적과 반드시 수정할 항목을 명확히 분리
4. **우선 수정 항목 1가지** 제시
5. 결과는 QA 보고서 내 "코드 품질 리뷰" 섹션에 포함

#### Step 6: 리턴 경로 산출

발견된 이슈마다 **수정 대상 에이전트**와 **수정 힌트**를 명시합니다:

```markdown
### 이슈 목록

| # | 이슈 | 심각도 | 대상 에이전트 | 카테고리 | 수정 힌트 |
|---|------|--------|-------------|---------|----------|
| 1 | 설명 | P0/P1/P2 | frontend/backend/architect | 분류 | 구체적 수정 방향 |

**return_to**: {P0 이슈 최다 에이전트}
```

Manager는 `return_to` 값으로 해당 에이전트에게 이슈를 라우팅합니다.

#### Checkpoint 5 — 리뷰 결정

Critical/Important 이슈를 심각도별로 정리하여 AskUserQuestion:
- **"지금 모두 수정"** — 전체 이슈 수정 후 재검증
- **"Critical만 수정"** — Critical 이슈만 수정
- **"그대로 진행"** — 현 상태 수용, Report로 이동
사용자 선택에 따라 분기.

#### 최종 판정

| 판정 | 조건 |
|------|------|
| **Pass** | Critical 0건 + Gap ≥ 90% + QA ≥ 90% |
| **Conditional** | Warning만, Critical 없음 |
| **Needs Revision** | Critical 존재 또는 Gap < 90% |

`docs/04-review/{feature}.md`에 저장 (`templates/qa.template.md` 구조)

**에이전트**: review
