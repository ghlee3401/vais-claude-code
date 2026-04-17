---
name: dashboard
description: VAIS 피처 진행 상황 HTML 대시보드 생성. 모든 피처의 phase 진행, 산출물 링크, gate 결과를 시각화.
---

### dashboard — VAIS 대시보드 생성 유틸리티

`scripts/generate-dashboard.js` 를 실행하여 `.vais/dashboard.html` 을 생성합니다.

#### 실행 순서

1. Bash 도구로 대시보드 생성 스크립트 실행:

   ```bash
   node ${CLAUDE_PLUGIN_ROOT}/scripts/generate-dashboard.js
   ```

   (프로젝트 루트는 현재 작업 디렉토리. 필요 시 첫 번째 인자로 다른 경로 전달 가능.)

2. 생성 결과 경로(`<cwd>/.vais/dashboard.html`)를 사용자에게 stdout으로 안내합니다.
3. **[선택]** 인자로 `--open` 이 주어지면 플랫폼별로 HTML 자동 열기:
   - macOS: `open <path>`
   - Linux: `xdg-open <path>` (있는 경우)
   - 실패해도 에러로 보고하지 않고 경로만 안내.
4. **[선택]** `--feature=<name>` 인자로 특정 피처만 필터 (generate-dashboard.js가 인식하면).

#### 출력 형태

대시보드 HTML은 다음을 포함합니다:
- 각 피처의 현재 phase + 진행 바
- `docs/{feature}/{NN-phase}/main.md` 산출물 링크
- gate 결과 요약 (v0.56 sub-plan 07 활성화 이후 표기 예정)

#### 주의

- `.vais/status.json` 이 비어있는 신규 프로젝트에서는 빈 대시보드가 생성될 수 있음.
- 생성된 HTML은 `.gitignore` 대상. 커밋 금지.
