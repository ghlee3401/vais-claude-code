---
name: commit
description: git 변경사항 분석 후 한국어 Conventional Commits 메시지 생성 + semver 범프 + CHANGELOG 자동화. 유틸리티 커맨드.
---

### commit — Git Commit 유틸리티

git 변경사항을 분석하여 **한국어 한 줄** Conventional Commits 메시지를 생성합니다.

#### 실행 순서

1. `git diff --cached --stat` 및 `git diff --cached`로 스테이징된 변경 분석
2. 스테이징 없으면 `git diff --stat` 및 `git diff`로 워킹 디렉토리 변경 분석
3. **한국어 한 줄** Conventional Commits 메시지 초안 생성 (아래 형식 참조)
   - 생성 후 **특수기호 sanitize** 자동 적용 (아래 규칙 참조)
4. **[확인 1]** AskUserQuestion: 생성된 커밋 메시지를 보여주고 "이 메시지로 진행할까요?" 확인
   - "수정" 선택 시 → 사용자 입력으로 메시지 교체 (교체 후에도 sanitize 적용)
5. 변경 성격 분석 후 semver 범프 추천 (patch/minor/major + 이유)
6. **[확인 2]** AskUserQuestion: "버전을 어떻게 올릴까요?" (추천 옵션을 첫 번째로 제시)
   - 옵션: "patch (x.x.+1)", "minor (x.+1.0)", "major (+1.0.0)", "버전 변경 없음"
7. **버전 일괄 반영** (버전 변경 선택 시):
   - 현재 버전 문자열로 프로젝트 전체를 Grep 도구로 탐색
   - 제외 대상: `node_modules/`, `.git/`, `vendor/`, `basic/`, `docs/` 내 과거 CHANGELOG 엔트리
   - false positive 필터: 버전 비교 연산자(`>=`, `<=`, `>`, `<`, `==`) 포함 행 제외
   - 탐색 결과를 사용자에게 테이블로 표시 (파일 경로 + 매칭 내용)
   - 사용자 확인 후 일괄 반영
   - 반영 후 모든 파일의 버전이 동일한지 최종 검증. 불일치 시 커밋 중단
8. **CHANGELOG.md 엔트리 추가**:
   - 파일이 없으면 아래 구조로 자동 생성:
     ```
     # Changelog
     ```
   - 새 버전 엔트리를 최상단에 추가:
     ```
     ## [{new_version}] - {YYYY-MM-DD}

     ### {섹션}

     - {커밋 메시지의 한국어 요약 부분}
     ```
   - type → 섹션 매핑: feat→Added, fix→Fixed, refactor/perf→Changed, docs→Documentation, chore/build/ci→Maintenance, test→Testing
9. 변경된 버전 파일 + CHANGELOG.md를 스테이징에 포함 후 커밋 실행
10. **[확인 3]** AskUserQuestion: "커밋 완료. push하시겠습니까?"
    - 옵션: "push", "나중에"
11. "push" 선택 시에만 `git push origin {현재 브랜치}` 실행

> **⚠️ push는 반드시 `/vais commit`을 통해서만**
> C-Suite 에이전트는 `git push`가 차단되어 있습니다. 작업 완료 후 `/vais commit`을 실행하면
> 커밋 메시지 작성 + semver 버전 범프 + push(확인 후)가 처리됩니다.

#### Conventional Commits 형식

```
{type}({scope}): 한국어 한 줄 요약
```

- type: feat, fix, docs, style, refactor, perf, test, build, ci, chore
- scope: 변경된 모듈/디렉토리 (예: agents, skills, hooks)
- **body 없음** — 상세 내용은 CHANGELOG.md에만 기록
- 50자 이내 권장 (type/scope 부분 제외)

#### 특수기호 sanitize 규칙

CI/CD 파이프라인 호환성을 위해 커밋 메시지에 사용 가능한 문자를 제한합니다.

**허용 문자**: 영문(type/scope), 한글, 숫자, `:`, `-`, `(`, `)`, `/`, 공백

**금지 문자와 치환 규칙**:
- `—` (em dash) → `-` (하이픈)
- `'`, `"`, `` ` `` (따옴표류) → 제거
- `$`, `#`, `{`, `}`, `[`, `]`, `!`, `~`, `*` → 제거
- emoji → 제거

금지 문자가 발견되면 자동 치환/제거 후 수정된 메시지를 사용자에게 보여주고 재확인합니다.
