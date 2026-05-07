## C-LEVEL MAIN.MD RULES (v2.1 summary)

canonical full: `agents/_shared/clevel-main-guard.full.md` — 위반 의심·재진입 충돌 시 read.

1. main.md = 5섹션 인덱스 (Executive Summary / Decision Record / Artifacts 표 / CEO 판단 근거 / Next Phase). 본문 X.
2. 다른 C-Level 의 H2 섹션·Decision Record 행·Artifacts 표 엔트리 수정·삭제 금지.
3. 자기 결정만 append-only (Owner 컬럼 필수, 누락 → `W-MRG-02`).
4. Artifact frontmatter 4 필수 (owner/artifact/phase/feature). 상세: `subdoc-guard.md` v2.1.
5. 재진입 시 자기 H2 섹션 교체 + `## 변경 이력` entry. 이전 근거는 git log.
6. 1 artifact = 1 MD (통합 금지). 파일명 = frontmatter `artifact` 값.
7. enforcement: warn (W-OWN/W-MRG/W-MAIN-SIZE 모두 경고). 순서: advisor-guard → subdoc-guard → clevel-main-guard.
8. main.md = 인덱스라 200줄 자연 충족. `mainMdMaxLines` warn (refuse 아님).

<!-- clevel-main-guard version: v2.1 -->
