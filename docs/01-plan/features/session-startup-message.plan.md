# Plan: SessionStart 활성화 메시지 추가

## Executive Summary

| 항목 | 내용 |
|------|------|
| Feature | session-startup-message |
| 작성일 | 2026-04-01 |
| 목표 기간 | 1시간 이내 |

### Value Delivered

| 관점 | 내용 |
|------|------|
| Problem | vais-code SessionStart가 bkit처럼 `systemMessage`를 출력하지 않아 터미널에서 플러그인 활성화 확인이 불가능 |
| Solution | response에 `systemMessage` + `hookSpecificOutput` 패턴을 추가하여 bkit과 동일한 방식으로 활성화 메시지 출력 |
| Function UX Effect | 세션 시작 시 "SessionStart:startup says: VAIS Code v0.29.0 activated (Claude Code)" 메시지가 터미널에 표시됨 |
| Core Value | bkit과 동등한 플러그인 존재감 확보. 사용자가 두 플러그인 모두 활성화됨을 명확히 인지 |

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | bkit은 `systemMessage`로 활성화 메시지를 출력하지만 vais-code는 이 필드가 없어 존재감이 약함 |
| WHO | vais-code 플러그인 사용자 |
| RISK | response 구조 변경 시 additionalContext가 누락될 수 있음 → hookSpecificOutput으로 이전 필요 |
| SUCCESS | SC-01: 세션 시작 시 "VAIS Code vX.X.X activated (Claude Code)" 메시지 표시 |
| SCOPE | `hooks/session-start.js` response 구조 변경만. 출력 내용(ctx) 변경 없음 |

---

## 1. 배경

bkit의 `session-start.js`는 다음 구조로 응답:

```js
{
  systemMessage: `bkit Vibecoding Kit v2.0.8 activated (Claude Code)`,
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: additionalContext
  }
}
```

vais-code는 현재:

```js
{ additionalContext: ctx }
```

`systemMessage` 필드가 없어 터미널 상단에 활성화 메시지가 나타나지 않음.

---

## 2. 요구사항

| ID | 요구사항 |
|----|----------|
| FR-01 | response에 `systemMessage: "VAIS Code v{VERSION} activated (Claude Code)"` 추가 |
| FR-02 | `additionalContext`를 `hookSpecificOutput.additionalContext`로 이전 (bkit 패턴 준수) |
| FR-03 | `hookSpecificOutput.hookEventName: "SessionStart"` 추가 |

---

## 3. 성공 기준

| ID | 기준 | 검증 |
|----|------|------|
| SC-01 | `node hooks/session-start.js` 출력에 `systemMessage` 키 존재 | JSON 파싱 확인 |
| SC-02 | 세션 시작 시 터미널에 "VAIS Code vX.X.X activated" 출력 | 실제 세션 시작 확인 |
| SC-03 | 기존 additionalContext 내용 그대로 유지 | 출력 내용 비교 |

---

## 4. 구현 범위

| 파일 | 변경 내용 |
|------|-----------|
| `hooks/session-start.js` | response 구조 변경 (1곳, ~3줄) |

---

## 5. 예상 출력

```
SessionStart:startup says: VAIS Code v0.29.0 activated (Claude Code)
```
