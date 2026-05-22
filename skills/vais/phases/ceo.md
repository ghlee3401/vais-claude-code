---
name: ceo
version: 2.0.0
description: CEO 에이전트 호출. 7 차원 알고리즘 (`lib/ceo-algorithm.js`) + 4 Primary 자동 라우팅 + ideation 분기 + 10+1 시나리오 매핑 + absorb. CBO/COO 는 명시 호출만 활성.
---

# CEO Phase

`${CLAUDE_PLUGIN_ROOT}/agents/ceo/ceo.md`를 읽고 그 안의 지침에 따라 실행하세요.

> **진입 시 필수**: CEO 는 사용자 입력을 받으면 반드시 `agents/ceo/ceo.md` 의 "CEO 진입 절차" 4 단계 (`analyzeCEO()` 호출 → 7 차원 표 출력 → activeCLevel 인용 → AskUserQuestion) 를 따른다. LLM 자체 라우팅 금지 (algorithm 결과 인용 후 보강만 허용).

## 인자 파싱

전달 인자 원본: `$1`

### Phase 분리 규칙

`$1`의 **첫 단어**가 아래 목록에 해당하면 phase로 분리합니다:

| 키워드 | phase |
|--------|-------|
| `ideation` | ideation |
| `plan` | plan |
| `design` | design |
| `do` | do |
| `qa` | qa |
| `report` | report |

- **Phase 명시**: `/vais ceo plan my-feature` → phase=`plan`, feature=`my-feature`
- **Phase 생략**: `/vais ceo my-feature` → phase=미지정, feature=`my-feature`

### Phase 미지정 시 동작

CEO 는 mandatory PDCA owner 가 아닙니다. phase 가 생략되면 `phase=ideation` 으로 간주하고 routing entry 를 실행합니다.

1. 사용자 입력 전체를 feature/topic 후보로 사용합니다.
2. `agents/ceo/ceo.md` 의 "CEO 진입 절차" 4 단계를 수행합니다.
   - `lib/ceo-algorithm.js` 의 `analyzeCEO(request)` 호출
   - 7 차원 등급 표를 응답에 직접 출력
   - `activeCLevel` / `artifactPlan` 을 baseline 으로 인용
   - AskUserQuestion 으로 다음 실행을 확인
3. CTO phase 순서 강제는 하지 않습니다. CTO mandatory PDCA 는 `/vais cto ...` 라우터의 책임입니다.

### Phase 명시 시 동작

- `ideation`: 아래 Ideation 분기로 이동합니다.
- `plan|design|do|qa|report`: CEO 가 직접 해당 phase 를 mandatory 실행하지 않습니다. 명시 phase 는 routing context 로만 사용하고, `analyzeCEO()` 결과에 따라 활성 C-Level/phase 를 AskUserQuestion 으로 확인합니다.
- 사용자가 기술 구현 phase 를 명시했으면 기본 추천은 `/vais cto {phase} {feature}` 입니다.

### Ideation 분기

Phase가 `ideation`인 경우:
1. `${CLAUDE_PLUGIN_ROOT}/skills/vais/phases/ideation.md`를 Read하고 그 지침에 따라 실행
2. CEO 페르소나로 ideation 대화 진행
3. 종료 시 다음 C-Level 추천 생성 → AskUserQuestion 승인 → 자동 전환

### 시나리오 매핑 (S-0 ~ S-10)

CEO는 사용자 입력을 분석하여 아래 시나리오 중 가장 적합한 것을 식별하고, 해당 흐름에 따라 C-Level을 순차 추천합니다.

| ID | 트리거 | 권장 흐름 |
|----|--------|-----------|
| S-0 | 아이디어 모호, 탐색 필요 | CEO ideation → 추천 C-Level |
| S-1 | 신규 서비스 풀 개발 | CEO routing → CPO→CTO→CSO. CBO/COO 는 사용자 명시 시 제안 |
| S-2 | 기능 추가, 기존 서비스 확장 | CEO routing → CPO→CTO→CSO. COO 는 사용자 명시 시 제안 |
| S-3 | 버그/UX 개선/리팩터 | branch별 (CTO or CPO) |
| S-4 | 프로덕션 장애 | CTO(incident-responder)→CSO. COO 는 사용자 명시 시 제안 |
| S-5 | 성능 최적화 / 비용 절감 | CTO(perf). FinOps 사업 분석은 CBO 명시 호출 제안 |
| S-6 | 보안 감사 / 컴플라이언스 | CSO↔CTO loop (max 2) |
| S-7 | 마케팅 캠페인 / GTM | CBO 명시 호출 제안 → 필요 시 CPO/CTO |
| S-8 | 시장 분석 / 사업 분석 | CBO 명시 호출 제안 → 필요 시 CPO |
| S-9 | skill/agent 생성 / 흡수 | CEO(skill-creator)→CSO |
| S-10 | 정기 운영 / 기술부채 | CTO. COO 는 사용자 명시 시 제안 |

## 에이전트 전달

- action: `$0`
- phase: (위에서 결정된 phase)
- feature: (위에서 분리된 feature)

## 완료 후 CEO 추천

에이전트가 phase를 완료한 뒤, SKILL.md 아웃로의 **"다음 스텝"** 섹션에서 CEO 추천을 수행합니다:

1. `docs/{feature}/**/*.md` 를 Glob으로 스캔하여 완료된 C-Level/artifact 파악
2. 현재 피처의 성격 분석 (피처명 + 사용자 컨텍스트)
3. `vais.config.json`의 `dependencies`에서 의존성 확인
4. 아직 실행되지 않은 C-Level 중 다음으로 적합한 것을 추천
5. **추천 요약을 응답에 직접 출력**한 뒤, **반드시 AskUserQuestion 도구로 사용자 응답을 받습니다** (텍스트 선택지로만 표시 금지).

### 출력 형식 (요약 블록)

```
📍 **CEO 추천 — 다음 단계**
📊 완료: {완료된 C-Level 목록} | 미실행: {미실행 C-Level 목록}
💡 추천: **{추천 C-Level}** — {이유 1문장}
```

### AskUserQuestion 호출 (필수)

요약 출력 직후 아래 형식으로 AskUserQuestion을 호출합니다:

- **question**: `다음 단계를 선택해주세요. (추천: {추천 C-Level})`
- **options**:
  - `{추천 C-Level} 진행` — `/vais {추천c레벨} {feature}`
  - `다른 C-Level 선택` — 사용자가 직접 C-Level 지정
  - `현재 C-Level 다음 phase` — `/vais ceo {다음phase} {feature}`
  - `종료` — 작업 종료

> ⛔ **금지**: A/B/C/D 텍스트 선택지만 출력하고 사용자 응답을 기다리는 행위. 반드시 AskUserQuestion 도구를 호출해야 합니다.

### 사용자 응답 후 자동 실행 (필수)

사용자가 AskUserQuestion에 응답하면 **즉시 해당 단계를 자동 실행**합니다. 명령어 재입력 요구 금지 — 사용자 선택 = 실행 승인.

- `{추천 C-Level} 진행` → `skills/vais/phases/{추천c레벨}.md` Read → 동일 피처로 실행
- `현재 C-Level 다음 phase` → `skills/vais/phases/ceo.md` Read → `{다음phase}` 로 실행
- `다른 C-Level 선택` → 추가 AskUserQuestion → 자동 실행
- `종료` → 중단
