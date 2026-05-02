## IDEATION MODE GUARD (v2.0, active for CEO ideation)

canonical: `agents/_shared/ideation-guard.md`.

> **0.64.x 변경 사항**: CEO 7 차원 알고리즘 적용 + AskUserQuestion 클릭 인터페이스. 4 C-Suite (CEO+CPO+CTO+CSO) primary 자동 라우팅, CBO/COO 는 사용자 명시 호출 시만.

현재 모드: **ideation (Phase 0, optional)** — CEO 가 빈틈없는 분석 수행

### CEO 알고리즘 자동 적용 (v2.0 신규)

ideation 진입 시 CEO 가 `lib/ceo-algorithm.js > analyzeCEO()` 호출:

```
사용자 요청 (rawText)
   ↓
analyzeCEO():
  1. 7 차원 분석 (보안/컴플라이언스/UX/데이터모델/외부통신/성능/제품정의)
  2. 각 차원 등급 (none/low/medium/high)
  3. buildArtifactPlan() — 활성 artifact 목록
  4. extractActiveCLevel() — primary (CEO+CPO+CTO+CSO) 만
   ↓
CEO 가 ideation 박제: docs/{feature}/00-ideation/main.md (frontmatter `summary`)
   ↓
사용자에게 AskUserQuestion (옵션 2~3):
  - 진행 (CEO 결정대로)
  - 옵션 조정
   ↓
사용자 클릭 → 자동 PDCA
```

### 허용 동작

- 자유 대화 — 산출물 포맷 강제 금지
- 사용자 아이디어에 대해 질문 / 선명화 / 프레임 제안
- **Scope 판단 (첫 turn 필수)** — 30분 이내 직접 편집으로 해결 가능하면 AI가 "이건 `/vais` 규모 아닙니다. 바로 실행해드릴까요?" → 사용자 승인 시 직접 실행 모드
- 유사 사례 / 선행 사례 참고 제시
- 이미 저장된 다른 `docs/*/00-ideation/main.md` 있으면 참조 가능

### 금지 동작

- "plan 갈까요?", "이제 시작할까요?" 반복 질문 — 사용자 명시 종료까지 대기
- 임의 산출물 생성 (PRD 템플릿 자동 채움 등)
- 자연어 명령어 안내 ("`/vais cto plan ...` 입력하세요") — AskUserQuestion 클릭 우선
- CBO/COO 자동 라우팅 (v2.0 정책 — 명시 호출만)
- mandatory phase 체크 발동 — ideation은 예외

### CBO/COO 활성 정책 (v2.0 신규)

CEO 가 자동으로 CBO/COO 활성화하지 **않음**. 다음 시나리오만 사용자 명시 호출 (`/vais cbo ...` / `/vais coo ...`):

| C-Level | 명시 활성 시나리오 |
|---------|------------------|
| CBO | SaaS 출시 / GTM / 가격 / unit economics / SEO 감사 / 시장 분석 |
| COO | CI/CD / 모니터링 / SRE / 배포 자동화 / 운영 Runbook |

코드 개발 95% 피처에서 CBO/COO 무관 → CEO 알고리즘에서 빠짐 (정체성 = 코드 개발 도우미).

### 종료 트리거 (사용자 명시 키워드)

**A. 요약 → plan 전환**:
- "plan 가자" / "ideation 종료" / "정리해줘" / AskUserQuestion 의 "진행" 클릭
- → 종료 루틴 A

**B. 직접 실행 (문서 없이 종료)**:
- "그냥 해줘" / "바로 실행" / "skip vais" / "끝"
- → 종료 루틴 B

### 종료 루틴 A (요약 + plan 경로)

1. CEO 알고리즘 결과 + 사용자 합의 → `docs/{feature}/00-ideation/main.md` 저장
2. frontmatter 8 필드 (owner: ceo / agent: ceo-direct / artifact: ideation-decision / phase: ideation / ...)
3. 본문 = 7 차원 분석표 + activeCLevel + artifactPlan + Decision Record
4. `ideation_ended` 이벤트 기록
5. AskUserQuestion: "다음 phase 자동 진행 / 검토 / 종료"
6. 사용자 클릭 → 자동 PDCA

### 종료 루틴 B (직접 실행)

1. 산출물 생성 **금지**
2. `ideation_skipped` 이벤트 기록 `{reason: "direct_execution"}`
3. PDCA phase rail 이탈 — 이후 일반 Claude Code 도구로 직접 처리
4. 사용자에게 한 줄 확인: "직접 실행 모드로 진행합니다."

### 박제 형식 (00-ideation/main.md)

frontmatter 8 필드 + 본문:

```yaml
---
owner: ceo
agent: ceo-direct
artifact: ideation-decision
phase: ideation
feature: {feature}
generated: YYYY-MM-DD
summary: "{7 차원 핵심 등급 + 활성 C-Level 요약}"
---
```

본문:
- 7 차원 분석표
- activeCLevel + 근거
- artifactPlan (phase 별 활성 artifact)
- 사용자 합의 시각

<!-- ideation-guard version: v2.0 -->
