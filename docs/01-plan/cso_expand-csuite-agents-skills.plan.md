# CSO Plan — expand-csuite-agents-skills

## 위협 범위

| 위협 영역 | 적용 | 근거 |
|----------|------|------|
| OWASP Top 10 (Gate A) | N/A | 실행 코드 변경 없음 (.md, .json만) |
| 플러그인 구조 검증 (Gate B) | **적용** | 에이전트 frontmatter, SKILL.md, vais.config.json 구조 변경 |
| 독립 코드 리뷰 (Gate C) | **적용** | 에이전트 정의 품질, 보안 도구 제한, 역할 일관성 |
| Compliance | **적용** | disallowedTools 일관성, 위험 명령 차단 검증 |

## 검토 대상

- 신규 에이전트 12개 (frontmatter 검증, disallowedTools 검증)
- 수정 C-Level 6개 (PDCA 테이블 일관성, 위임 규칙 안전성)
- 신규 스킬 6개 (구조 검증)
- 수정 스킬 8개 (description 일관성)
- 프로젝트 문서 3개 (CLAUDE.md, AGENTS.md, vais.config.json)

## 검증 체크리스트

### Gate B — 플러그인 구조
- [ ] 모든 에이전트 frontmatter 필수 필드 (name, version, description, model, tools)
- [ ] disallowedTools에 위험 명령 포함 (rm -rf, git push)
- [ ] 스킬 frontmatter 필수 필드 (name, description)
- [ ] package.json claude-plugin 구조 유효
- [ ] vais.config.json 구조 유효

### Gate C — 품질 리뷰
- [ ] 역할 분리 일관성 (tester vs qa, devops vs architect, sre vs canary)
- [ ] 모든 sub-agent Triggers에 "직접 호출 금지" 명시
- [ ] model 필드 일관성 (C-Level: opus, sub-agent: sonnet)
- [ ] 크로스 호출 에이전트 양쪽 문서에 참조 존재
- [ ] 에이전트 수 일관성 (CLAUDE.md = AGENTS.md = vais.config.json)

### Compliance
- [ ] Bash 도구 접근 제한 적절성
- [ ] 위험 명령 차단 패턴 일관성 (rm -rf, git push, git reset --hard, DROP)

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-04 | 초기 작성 — Gate B+C+Compliance 범위 설정 |
