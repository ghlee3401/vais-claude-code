---
name: cfo
description: CFO 에이전트 호출. 재무 분석, ROI 계산, 가격 책정 전략. finops-analyst/pricing-analyst 위임 가능.
---

# CFO Phase

`${CLAUDE_PLUGIN_ROOT}/agents/cfo/cfo.md`를 읽고 그 안의 지침에 따라 실행하세요.

## 인자 파싱

전달 인자 원본: `$1`

### Phase 분리 규칙

`$1`의 **첫 단어**가 아래 목록에 해당하면 phase로 분리합니다:

| 키워드 | phase |
|--------|-------|
| `plan` | plan |
| `design` | design |
| `do` | do |
| `qa` | qa |
| `report` | report |

- **Phase 명시**: `/vais cfo plan my-feature` → phase=`plan`, feature=`my-feature`
- **Phase 생략**: `/vais cfo my-feature` → phase=미지정, feature=`my-feature`

### Phase 미지정 시 동작

1. `.vais/status.json`에서 해당 feature의 현재 진행 상태를 확인합니다
2. 다음에 실행할 phase를 판별합니다 (순서: plan → design → do → qa → report)
   - status 파일이 없거나 feature가 없으면 → `plan`부터
   - 이전 phase가 완료되어 있으면 → 다음 phase
   - **mandatory phase 스킵 금지**: plan, design, do, qa는 반드시 순서대로 실행. 이전 mandatory phase가 미완료면 해당 phase부터 실행
3. **AskUserQuestion으로 사용자에게 확인**합니다:
   ```
   "{feature}"의 다음 단계는 [{phase}]입니다. 실행할까요?
   ```
   선택지: `실행` / `다른 단계 선택` / `중단`
4. 사용자가 "다른 단계 선택"을 고르면 phase 목록을 보여주고 선택받습니다
5. 사용자가 mandatory phase를 건너뛰려는 경우, 경고를 표시합니다:
   ```
   ⚠️ [{스킵하려는 phase}]는 필수 단계입니다. 이전 단계를 먼저 완료해주세요.
   ```

## 에이전트 전달

- action: `$0`
- phase: (위에서 결정된 phase)
- feature: (위에서 분리된 feature)

## 완료 후 CEO 추천

에이전트가 phase를 완료한 뒤, SKILL.md 아웃로의 **"다음 스텝"** 섹션에서 CEO 추천을 수행합니다:

1. `docs/` 폴더를 Glob으로 스캔하여 `*_{feature}.*.md` 파일 존재 여부로 완료된 C-Level 파악
2. 현재 피처의 성격 분석 (피처명 + 사용자 컨텍스트)
3. `vais.config.json`의 `launchPipeline.dependencies`에서 의존성 확인
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
  - `현재 C-Level 다음 phase` — `/vais cfo {다음phase} {feature}`
  - `종료` — 작업 종료

> ⛔ **금지**: A/B/C/D 텍스트 선택지만 출력하고 사용자 응답을 기다리는 행위. 반드시 AskUserQuestion 도구를 호출해야 합니다.

### 사용자 응답 후 자동 실행 (필수)

사용자가 AskUserQuestion에 응답하면 **즉시 해당 단계를 자동 실행**합니다. 명령어 재입력 요구 금지 — 사용자 선택 = 실행 승인.

- `{추천 C-Level} 진행` → `skills/vais/phases/{추천c레벨}.md` Read → 동일 피처로 실행
- `현재 C-Level 다음 phase` → `skills/vais/phases/cfo.md` Read → `{다음phase}` 로 실행
- `다른 C-Level 선택` → 추가 AskUserQuestion → 자동 실행
- `종료` → 중단
