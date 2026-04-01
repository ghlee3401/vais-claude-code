---
name: commit
description: git 변경사항 분석 후 Conventional Commits 메시지 생성 + semver 범프 제안. 유틸리티 커맨드.
---

### commit — Git Commit 유틸리티

git 변경사항을 분석하여 Conventional Commits 형식의 커밋 메시지를 생성합니다.

#### 실행 순서

1. `git diff --cached --stat` 및 `git diff --cached`로 스테이징된 변경 분석
2. 스테이징 없으면 `git diff --stat` 및 `git diff`로 워킹 디렉토리 변경 분석
3. 변경 범위와 성격을 기반으로 Conventional Commits 메시지 생성
4. semver 범프 제안 (patch/minor/major)
5. AskUserQuestion으로 메시지 확인 후 커밋 실행

#### Conventional Commits 형식

```
{type}({scope}): {subject}

{body}
```

type: feat, fix, docs, style, refactor, perf, test, build, ci, chore
scope: 변경된 모듈/디렉토리 (예: agents, skills, hooks)
