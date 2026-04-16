# commit-workflow-improvement - 설계서

## 변경 대상

`skills/vais/utils/commit.md` — 단일 파일, 마크다운 기반 지침서

## 설계

### 실행 순서 (개편 후)

```
1. git diff 분석 (staged → unstaged)
2. 변경 분석 → Conventional Commits 한국어 한 줄 메시지 초안 생성
   포맷: {type}({scope}): 한국어 요약 (50자 이내 권장)
   특수기호 sanitize 자동 적용
3. [확인 1] AskUserQuestion: 메시지 승인
   - "이 메시지로 진행" / "메시지 수정"
4. 변경 성격 분석 → semver bump 추천
5. [확인 2] AskUserQuestion: 버전 선택
   - "patch" / "minor" / "major" / "버전 변경 없음"
6. 버전 변경 시:
   a. 현재 버전 문자열로 프로젝트 전체 grep
   b. false positive 필터링 (제외 디렉토리 + 패턴)
   c. 대상 파일 목록 표시
   d. 일괄 반영
7. CHANGELOG.md 엔트리 추가 (없으면 자동 생성)
8. 스테이징 + 커밋 실행
9. [확인 3] AskUserQuestion: push 여부
```

### 커밋 메시지 규칙

```
{type}({scope}): 한국어 요약
```

- type: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- scope: 변경된 모듈/디렉토리
- body 없음 — 상세 내용은 CHANGELOG.md에만 기록
- 허용 문자: 영문(type/scope), 한글, 숫자, `:`, `-`, `()`, `/`, 공백
- 금지 문자: `—` `'` `"` `` ` `` `$` `#` `{}` `[]` `!` `~` `*` emoji

### 특수기호 sanitize 규칙

생성된 메시지에서 금지 문자 발견 시:
- `—` → `-`
- `'` `"` `` ` `` → 제거
- 기타 금지 문자 → 제거
- sanitize 후 사용자에게 수정된 메시지 재확인

### 버전 전체 탐색 규칙

```
grep 대상: 프로젝트 루트 전체
grep 패턴: 현재 버전 문자열 (예: "0.50.1")

제외 디렉토리:
- node_modules/
- .git/
- vendor/
- basic/
- docs/ (CHANGELOG 현재 엔트리 제외, 과거 엔트리는 무시)

false positive 필터:
- 버전 비교 연산자 포함 행 제외 (>=, <=, >, <, ==)
- 주석 내 예시 문자열 제외

결과를 사용자에게 테이블로 표시:
| # | 파일 | 매칭 내용 | 반영 |
사용자 확인 후 일괄 반영
```

### CHANGELOG 자동화 규칙

```
파일 없으면 생성:
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

엔트리 추가:
## [{new_version}] - {YYYY-MM-DD}

### {섹션}
- {커밋 메시지 한국어 요약}

type → 섹션 매핑:
feat → Added
fix → Fixed
refactor, perf → Changed
docs → Documentation
chore, build, ci → Maintenance
test → Testing
```

---

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-16 | 초기 설계서 작성 |
