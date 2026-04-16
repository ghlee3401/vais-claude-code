# commit-workflow-improvement - 기획서

> ⛔ **Plan 단계 범위**: 이 문서는 분석과 결정만 기록합니다. 프로덕트 파�� 생성·수정은 Do 단���에서 수행하세요.
> 강행 모드: PRD 없음. ideation 요약 기반으로 진행.

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | `/vais commit`의 커밋 메시지가 영어 multi-line으로 git log에서 가독성이 낮고, 버전 반영 대상이 5개 파일에 하드코딩되어 plugin.json/marketplace.json 등이 누락됨 |
| **Solution** | 커밋 메시지를 한국어 한 줄로 변경, 상세 내용은 CHANGELOG.md에 기록, 버전 반영은 코드 전체 grep 탐색 방식으로 전환 |
| **Function/UX Effect** | git log 한눈에 읽힘, 버전 누락 사고 방지, CI/CD 특수문자 이슈 해소 |
| **Core Value** | 커밋 품질 향상 + 버전 관리 안정성 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 직전 커밋(0.50.1)에서 plugin.json/marketplace.json 버전 누락 실제 발생 |
| **WHO** | VAIS Code 개발자 (자체 도구 개선) |
| **RISK** | 버전 grep false positive, CHANGELOG 포맷 일관성 |
| **SUCCESS** | 커밋 메시지 한국어 한 줄 + 버전 누락 0건 + CI/CD 특수문자 이슈 0건 |
| **SCOPE** | `skills/vais/utils/commit.md` 단일 파일 수정 |

---

## 1. 현황 분석

### 현재 commit.md 구조 (10단계)
1. git diff 분석 (staged → unstaged)
2. Conventional Commits 메시지 초안 생성
3. [확인 1] 메시지 승인
4. semver bump 추천
5. [확인 2] 버전 선택
6. 버전 일괄 반영 (하드코딩 5개 파일)
7. 스테이징 포함 후 커밋
8. [확인 3] push 여부

### 문제점
| # | 문제 | 영향 |
|---|------|------|
| 1 | 영어 multi-line 커밋 메시지 | git log 가독성 저하 |
| 2 | 커밋 body와 CHANGELOG 내용 중복 | 유지보수 비효율 |
| 3 | 버전 반영 5개 파일 하드코딩 | plugin.json, marketplace.json 누락 (실제 발생) |
| 4 | 특수기호 미검증 | CI/CD 파이프라인 파싱 오류 가능 |
| 5 | CHANGELOG 없으면 수동 대응 필요 | 자동화 불완전 |

## 2. 변경 설계

### 2.1 커��� 메시지 포맷 변경

**Before:**
```
fix(hooks): use portable node resolver for /bin/sh hook environments

Hooks run under /bin/sh which has a minimal PATH, causing `node` to
not be found. Added run-node.sh wrapper that searches common node
locations (homebrew, nvm, volta, fnm, nodenv, asdf, system).
```

**After:**
```
fix(hooks): /bin/sh 환경에서 node 경로 못 찾는 문제 수정
```

**규칙:**
- `{type}({scope}): 한국어 한 줄 요약`
- body 없음 — 상세 내용은 CHANGELOG.md에만
- 50자 이내 권장 (type/scope 제외)

### 2.2 특수기호 검증

| 허용 | 금지 (CI/CD 이슈) |
|------|-------------------|
| `:` `-` `()` `/` 공백 한글 영문 숫자 | `—` `'` `"` `` ` `` `$` `#` `{}` `[]` `!` `~` `*` emoji |

커밋 실행 전 메시지 검증 → 금지 문자 발견 시 sanitize 후 재확인

### 2.3 CHANGELOG 자동화

- CHANGELOG.md 없으면 자동 생성 (Keep a Changelog 표준 헤더)
- 버전 bump 시 자동 엔트리 추가
- type별 섹션 분류: feat→Added, fix→Fixed, refactor→Changed, etc.

### 2.4 버전 전체 탐색

**Before:** 5개 파일 하드코딩
```
package.json, vais.config.json, CLAUDE.md, CHANGELOG.md, README.md
```

**After:** 코드 전체 grep
```
1. 현재 버전 문자열로 전체 grep (예: "0.50.1")
2. 결과에서 false positive 필터링:
   - node_modules/, .git/, vendor/ 제외
   - CHANGELOG.md의 과거 엔트리 제외 (현재 엔트리만 업데이트)
   - 코드 내 버전 비교 로직 제외 (>= 0.50.1 같은 패턴)
3. 대상 파일 목록을 사용자에게 보여주고 확인
4. 일괄 반영
```

**현재 탐색되는 버전 파일 (0.50.x 기준):**
- `package.json` — `"version": "0.50.x"`
- `vais.config.json` — `"version": "0.50.x"`
- `.claude-plugin/plugin.json` — `"version": "0.50.x"`
- `.claude-plugin/marketplace.json` — `"version": "0.50.x"` (2곳)
- `CLAUDE.md` — `(v0.50.x)`
- `README.md` — badge URL 내 `version-0.50.x`
- `CHANGELOG.md` — `## [0.50.x]`

## 3. 변경 범위

| 파일 | 변경 내용 |
|------|----------|
| `skills/vais/utils/commit.md` | 전체 로직 개편 (한국어 메시지, body 제거, grep 탐색, sanitize, CHANGELOG 자동화) |

## 4. Open Questions 해결

| 질문 | 결정 |
|------|------|
| false positive 필터링 | 디렉토리 제외 + 패턴 필터 + 사용자 확인 3중 안전장치 |
| CHANGELOG 포맷 | Keep a Changelog 표준 (`## [version] - date` + Added/Fixed/Changed 섹션) |
| semver bump UX | 현재 3개 ��션 유지 + "버전 변경 없음" 추가 (총 4개) |

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-16 | 초기 기획서 작성 (강행 모드, ideation 기반) |
