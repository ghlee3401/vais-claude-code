---
name: coo
version: 2.0.0
description: COO 에이전트 호출. 운영 프로세스, CI/CD 파이프라인, 모니터링. v2.0 Secondary — CEO 자동 라우팅 제외, 사용자 명시 호출만 활성. Mandatory phase 순서 미적용 (CTO PDCA 만 mandatory).
---

# COO Phase

`${CLAUDE_PLUGIN_ROOT}/agents/coo/coo.md`를 읽고 그 안의 지침에 따라 실행하세요.

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

- **Phase 명시**: `/vais coo plan my-feature` → phase=`plan`, feature=`my-feature`
- **Phase 생략**: `/vais coo my-feature` → phase=미지정, feature=`my-feature`

### Phase 미지정 시 동작 (v2.0 Secondary 정책)

1. `.vais/status.json`에서 해당 feature의 현재 진행 상태를 확인합니다
2. 다음 실행할 phase를 자동 판별 (순서 권장: plan → design → do → qa → report)
   - status 파일이 없거나 feature가 없으면 → `plan`부터
   - **mandatory 미적용**: COO 는 Secondary C-Level 이라 phase 스킵 경고 없음. 사용자가 자유롭게 phase 선택 가능
3. **AskUserQuestion 으로 사용자 확인**:
   ```
   "{feature}"의 다음 단계는 [{phase}]입니다. 실행할까요?
   ```
   선택지: `실행` / `다른 단계 선택` / `중단`

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
  - `현재 C-Level 다음 phase` — `/vais coo {다음phase} {feature}`
  - `종료` — 작업 종료

> ⛔ **금지**: A/B/C/D 텍스트 선택지만 출력하고 사용자 응답을 기다리는 행위. 반드시 AskUserQuestion 도구를 호출해야 합니다.

### 사용자 응답 후 자동 실행 (필수)

사용자가 AskUserQuestion에 응답하면 **즉시 해당 단계를 자동 실행**합니다. 명령어 재입력 요구 금지 — 사용자 선택 = 실행 승인.

- `{추천 C-Level} 진행` → `skills/vais/phases/{추천c레벨}.md` Read → 동일 피처로 실행
- `현재 C-Level 다음 phase` → `skills/vais/phases/coo.md` Read → `{다음phase}` 로 실행
- `다른 C-Level 선택` → 추가 AskUserQuestion → 자동 실행
- `종료` → 중단
