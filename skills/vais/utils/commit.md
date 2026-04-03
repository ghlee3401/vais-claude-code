---
name: commit
description: git 변경사항 분석 후 Conventional Commits 메시지 생성 + semver 범프 제안. 유틸리티 커맨드.
---

### commit — Git Commit 유틸리티

git 변경사항을 분석하여 Conventional Commits 형식의 커밋 메시지를 생성합니다.

#### 실행 순서

1. `git diff --cached --stat` 및 `git diff --cached`로 스테이징된 변경 분석
2. 스테이징 없으면 `git diff --stat` 및 `git diff`로 워킹 디렉토리 변경 분석
3. Conventional Commits 형식으로 커밋 메시지 초안 생성
4. **[확인 1]** AskUserQuestion: 생성된 커밋 메시지를 보여주고 "이 메시지로 진행할까요?" 확인
   - "수정" 선택 시 → 사용자 입력으로 메시지 교체
5. 변경 성격 분석 후 semver 범프 추천 (patch/minor/major + 이유)
6. **[확인 2]** AskUserQuestion: "버전을 어떻게 올릴까요?" (추천 옵션을 첫 번째로 제시)
   - 옵션: "patch (x.x.+1)", "minor (x.+1.0)", "major (+1.0.0)", "버전 변경 없음"
7. **버전 일괄 반영** (누락 시 커밋 금지):
   - `package.json` → `"version"` 필드
   - `vais.config.json` → `"version"` 필드
   - `CLAUDE.md` → 3번째 줄 `(v{version})` 표기
   - `CHANGELOG.md` → 새 버전 엔트리 추가
   - `README.md` → 상단 버전 표기 및 버전 히스토리 테이블
   - 위 5개 파일의 버전이 모두 동일한지 확인 후 진행. 하나라도 불일치하면 커밋 중단하고 사용자에게 알릴 것
8. 변경된 버전 파일을 스테이징에 포함 후 커밋 실행
9. **[확인 3]** AskUserQuestion: "커밋 완료. push하시겠습니까?"
   - 옵션: "push", "나중에"
10. "push" 선택 시에만 `git push origin {현재 브랜치}` 실행

> **⚠️ push는 반드시 `/vais commit`을 통해서만**
> C-Suite 에이전트는 `git push`가 차단되어 있습니다. 작업 완료 후 `/vais commit`을 실행하면
> 커밋 메시지 작성 + semver 버전 범프 + push(확인 후)가 처리됩니다.

#### Conventional Commits 형식

```
{type}({scope}): {subject}

{body}
```

type: feat, fix, docs, style, refactor, perf, test, build, ci, chore
scope: 변경된 모듈/디렉토리 (예: agents, skills, hooks)
