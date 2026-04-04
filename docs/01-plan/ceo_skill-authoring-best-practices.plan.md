# CEO Plan — skill-authoring-best-practices

## 개요

Claude Code 공식 Agent Skill best practices 문서를 분석하여, VAIS Code 플러그인의 스킬/에이전트 작성 시 참조할 가이드라인으로 흡수한다.

## 소스

| 파일 | 설명 |
|------|------|
| `references/claude_code_agent_skill/best_practices.md` | Claude Code 공식 스킬 작성 모범사례 |
| `references/claude_code_agent_skill/overview.md` | Agent Skills 개요 |
| `references/claude_code_agent_skill/quickstart.md` | API 퀵스타트 (참고용) |

## 핵심 원칙 추출 (best_practices.md)

### 1. Conciseness (간결성)
- SKILL.md body 500줄 이하
- Claude가 이미 아는 것은 설명하지 않음
- 모든 토큰이 context window를 공유함을 인식

### 2. Degrees of Freedom (자유도 설정)
- High: 텍스트 기반 지시 (여러 접근법 유효)
- Medium: 의사코드/스크립트 (선호 패턴 존재)
- Low: 정확한 스크립트 (오류 민감, 일관성 필수)

### 3. Description 작성법
- 3인칭으로 작성 ("Processes…", not "I can…")
- what + when 명시 (무엇을 하는지 + 언제 쓰는지)
- 최대 1024자, 구체적 키워드 포함

### 4. Progressive Disclosure
- SKILL.md = 개요 + 네비게이션
- 상세 내용은 별도 파일로 분리
- 참조는 **1단계 깊이**까지만 (중첩 참조 금지)

### 5. Workflow/Feedback Loop
- 복잡 작업은 체크리스트 패턴
- validate→fix→repeat 피드백 루프
- 중간 산출물을 검증 가능한 형태로

### 6. 모델별 고려
- Haiku: 충분한 가이드 제공
- Sonnet: 명확하고 효율적
- Opus: 과도한 설명 지양

### 7. Anti-patterns
- Windows 경로 금지 (항상 forward slash)
- 과다한 선택지 제공 금지 → 기본값 + escape hatch
- 시간 의존 정보 금지

## 현재 VAIS Code 대비 Gap 분석 (예비)

| 항목 | 공식 권장 | VAIS 현재 | 상태 |
|------|----------|----------|------|
| SKILL.md 줄 수 | < 500줄 | 확인 필요 | 🔍 |
| Description 3인칭 | 필수 | 혼재 가능성 | 🔍 |
| Progressive disclosure | 1단계 참조 | phases/utils 분리 | ✅ |
| Naming convention | gerund/kebab | `vais` 단일 | ⚠️ (변경 비용 높음) |
| 모델별 테스트 가이드 | 필수 | 미존재 | ❌ |
| Evaluation 시스템 | 3개 이상 시나리오 | 미존재 | ❌ |

## 권장 absorb 전략

1. **reference 유지** — `references/claude_code_agent_skill/` 그대로 보존
2. **가이드라인 문서 생성** — 핵심 원칙을 VAIS 맥락에 맞게 요약한 참조 문서
3. **기존 SKILL.md Gap 분석** — 공식 권장 대비 개선점 리포트
4. **필요시 SKILL.md 개선** — Gap이 발견되면 수정 (CP-A에서 결정)

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-05 | 초기 작성 |
