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
5. **버전 일괄 반영**: `package.json`, `vais.config.json` 등 버전 필드를 새 버전으로 업데이트
6. 변경된 버전 파일을 스테이징에 포함
7. 최종 커밋 메시지 확인 후 커밋 실행
8. `git push origin {현재 브랜치}` 실행

> **⚠️ push는 반드시 `/vais commit`을 통해서만**
> C-Suite 에이전트는 `git push`가 차단되어 있습니다. 작업 완료 후 `/vais commit`을 실행하면
> 커밋 메시지 작성 + semver 버전 범프 + push가 한 번에 처리됩니다.

#### Conventional Commits 형식

```
{type}({scope}): {subject}

{body}
```

type: feat, fix, docs, style, refactor, perf, test, build, ci, chore
scope: 변경된 모듈/디렉토리 (예: agents, skills, hooks)
