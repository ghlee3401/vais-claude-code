---
name: vais-validate-plugin
description: >
  ⚠️ DEPRECATED: v2.0.0부터 CSO 에이전트 Gate B로 통합되었습니다. `/vais cso {feature}` 사용.
  Claude Code 플러그인 검증 스킬. 플러그인 코드가 마켓플레이스 및 플러그인 배포 요구사항에 맞는지 검사합니다.
  Triggers: validate, 검증, 플러그인 체크, plugin check, marketplace, 배포, 패키징,
  plugin.json, hooks.json, marketplace.json, 플러그인 검사, 배포 준비.
  Do NOT use for: 일반 개발 워크플로우, 코드 리뷰, 테스트
argument-hint: "[plugin-path]"
allowed-tools: Read, Bash, Glob, Grep, TodoWrite
---

# ⚠️ DEPRECATED: vais-validate-plugin → CSO Gate B

> **v2.0.0부터 플러그인 검증은 CSO 에이전트 Gate B에 통합되었습니다.**

## 자동 리다이렉트

```
/vais-validate-plugin {path}   →  /vais cso {feature}
/vais validate-plugin          →  CSO Gate B 자동 실행 (권장)
```

이 스킬을 호출하면 자동으로 CSO Gate B가 실행됩니다.

**CSO 사용법:**
```bash
/vais cso {feature}            # 보안 검토(Gate A) + 플러그인 검증(Gate B)
/vais cto:cso {feature}        # CTO 구현 → CSO 검증
/vais ceo:cto:cso {feature}    # 전체 C-Suite 체이닝
```

완전한 가이드: `skills/vais/phases/cso.md` 및 `agents/cso.md`

---

# 🔍 Claude Code 플러그인 검증 (레거시 참조용)

플러그인 코드가 Claude Code 플러그인 및 마켓플레이스 배포 요구사항에 부합하는지 검사합니다.

## 사용법

```
/vais-validate-plugin              # 현재 프로젝트 검증
/vais-validate-plugin /path/to    # 특정 경로 검증
```

## 실행 절차

### 1. 대상 경로 결정

- 인자로 경로가 주어지면 해당 경로 사용
- 인자 없으면 현재 프로젝트 루트(`.`) 사용

### 2. 검증 스크립트 실행

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/vais-validate-plugin.js <대상경로>
```

### 3. 결과 해석

스크립트는 exit code 0이면 통과, 1이면 실패입니다.
CLI 출력을 사용자에게 그대로 전달하고, 오류가 있으면 수정 방법을 안내하세요.

## 검증 카테고리 (11개)

| 카테고리 | 주요 검사 항목 |
|---------|-------------|
| 구조 | `.claude-plugin/` 존재, plugin.json 위치, 디렉토리 배치 오류 |
| plugin.json | 필수 필드(name, description, version), kebab-case, semver, author, license |
| hooks.json | 유효 이벤트명(7종), handler 구조, timeout, command |
| skills | SKILL.md 존재 및 프론트매터, 본문 충분성 |
| agents | .md 파일 존재, 내용 충분성 |
| marketplace.json | 필수 필드, 예약된 이름 차단, owner, source 타입별 검증 |
| settings.json | agent 참조 유효성 |
| .mcp.json | 서버 command 존재 |
| .lsp.json | 서버 command, extensionToLanguage 매핑 |
| 스크립트 참조 | hooks에서 참조하는 스크립트 파일 존재 여부 |
| 문서 | README.md 존재 |

## 유효한 Hook 이벤트 (공식 스펙)

SessionStart, PreToolUse, PostToolUse, Notification, Stop, UserPromptSubmit, SubagentStop

## plugin.json 필수 필드

- `name` — kebab-case, 공백 없음
- `description` — 플러그인 설명
- `version` — semver (예: 1.0.0)

## marketplace.json 필수 필드

- `name` — kebab-case (예약된 이름 사용 불가)
- `owner` — `{ "name": "..." }` 객체
- `plugins` — 배열, 각 항목에 name + source 필수

## 예약된 마켓플레이스 이름 (사용 불가)

claude-code-marketplace, claude-code-plugins, claude-plugins-official,
anthropic-marketplace, anthropic-plugins, agent-skills, life-sciences

## JSON 출력 모드

프로그래밍 방식으로 사용할 때:

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/vais-validate-plugin.js <경로> --json
```

## 오류 발견 시 안내

오류 목록을 보여주고, 자동 수정 가능한 항목은 수정 제안을 포함합니다.
사용자에게 각 오류의 수정 방법을 구체적으로 안내하세요.
