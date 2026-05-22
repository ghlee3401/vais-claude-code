---
name: cpo
version: 2.0.0
description: CPO 에이전트 호출. 제품 도메인 오케스트레이션 (PRD + 로드맵 + 백로그). Primary — CEO 7 차원 알고리즘이 활성화한 phase 만 실행. main.md 인덱스 + sub-agent 직접 박제.
---

# CPO Phase

`${CLAUDE_PLUGIN_ROOT}/agents/cpo/cpo.md`를 읽고 그 안의 지침에 따라 실행하세요.

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

- **Phase 명시**: `/vais cpo plan my-feature` → phase=`plan`, feature=`my-feature`
- **Phase 생략**: `/vais cpo my-feature` → phase=미지정, feature=`my-feature`
- **Ideation**: `/vais cpo ideation my-idea` → ideation 라우터(`phases/ideation.md`)로 위임
- **Design**: prd-writer 완료 후 `backlog-manager`가 PRD → user stories + sprint plan 변환

### Phase 미지정 시 동작

CPO 는 mandatory PDCA owner 가 아닙니다. phase 가 생략되면 CEO artifactPlan 기준으로 CPO 가 맡을 다음 product artifact 를 찾습니다.

1. `docs/{feature}/00-ideation/ideation-decision.md` 또는 `docs/{feature}/00-ideation/main.md` 에서 CEO 의 `artifactPlan` / `activeCLevel` 근거를 확인합니다.
2. `artifactPlan` 안에서 `owner=cpo` 인 미완료 artifact 의 phase 를 선택합니다.
   - 예: `01-plan/prd.md`, `01-plan/persona.md`, `02-design/value-proposition-canvas.md`
3. CEO 근거가 없거나 CPO artifact 가 없으면 AskUserQuestion 으로 확인합니다.
   - `CEO 라우팅 먼저 실행` — `/vais ceo {feature}`
   - `CPO plan 명시 실행` — 사용자 명시 호출로 간주하고 `/vais cpo plan {feature}`
   - `중단`
4. CPO 는 plan/design/do/qa/report 순서 강제를 하지 않습니다. CTO mandatory PDCA 는 `/vais cto ...` 라우터의 책임입니다.

### Phase 명시 시 동작

사용자가 `/vais cpo {phase} {feature}` 를 명시하면 해당 phase 의 CPO artifact 실행을 승인한 것으로 봅니다. 단, CEO artifactPlan 이 존재하면 그 근거를 main.md "CEO 판단 근거" 섹션에 인용합니다.

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
  - `현재 C-Level 다음 phase` — `/vais cpo {다음phase} {feature}`
  - `종료` — 작업 종료

> ⛔ **금지**: A/B/C/D 텍스트 선택지만 출력하고 사용자 응답을 기다리는 행위. 반드시 AskUserQuestion 도구를 호출해야 합니다.

### 사용자 응답 후 자동 실행 (필수)

사용자가 AskUserQuestion에 응답하면 **즉시 해당 단계를 자동 실행**합니다. 명령어 재입력 요구 금지 — 사용자 선택 = 실행 승인.

- `{추천 C-Level} 진행` → `skills/vais/phases/{추천c레벨}.md` Read → 동일 피처로 실행
- `현재 C-Level 다음 phase` → `skills/vais/phases/cpo.md` Read → `{다음phase}` 로 실행
- `다른 C-Level 선택` → 추가 AskUserQuestion → 자동 실행
- `종료` → 중단
