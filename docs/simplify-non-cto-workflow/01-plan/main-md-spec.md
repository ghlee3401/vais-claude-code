---
owner: cto
agent: cto-direct
artifact: main-md-spec
phase: plan
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "각 phase 의 main.md = 인덱스 형식 (5 섹션). 본문 안 갖고 frontmatter 기반으로 artifact 표 자동 생성."
---

# Main.md Spec — Phase 인덱스 형식

## 한 줄 요약

각 phase 의 main.md = **인덱스만** (5 섹션). 본문은 artifact MD 분리. C-Level 이 artifact frontmatter 의 `summary` 만 읽고 자동 생성.

## 5 섹션 표준

```markdown
---
owner: {c-level}             # 이 phase 책임 C-Level (보통 ceo/cto)
agent: {c-level}-direct
artifact: phase-index
phase: {plan|design|do|qa|report}
feature: {feature}
generated: YYYY-MM-DD
summary: "{phase 한 줄 요약}"
---

# {feature} — {Phase Name} (인덱스)

## 1. Executive Summary
| Perspective | Content |
|-------------|---------|
| Problem | ... |
| Solution | ... |
| Effect | ... |
| Core Value | ... |

## 2. Decision Record (multi-owner)
| # | Decision | Owner | Rationale | Source artifact |
|---|----------|:-----:|-----------|----------------|

## 3. Artifacts (이 phase 박제 자료)
| Artifact | Owner | Agent | Source 거장 | 한 줄 요약 | 파일 |
|----------|:-----:|:-----:|:----------:|----------|------|
| (frontmatter 자동 추출) |

## 4. CEO 판단 근거 (왜 이 artifact 들이 이 phase 에 포함/제외)
- 포함: ...
- 제외: ...

## 5. Next Phase
→ {next-phase} ({다음 책임 C-Level} 진입)

## 변경 이력
| version | date | change |
```

## Artifacts 표 자동 생성 알고리즘

```
1. C-Level 이 phase 의 모든 sub-agent 완료 받음
2. docs/{feature}/{NN-phase}/ 폴더 스캔 (main.md 제외)
3. 각 artifact md 의 frontmatter 만 Read (본문 X)
4. 표 행 생성:
   | {artifact} | {owner} | {agent} | {source} | {summary} | [{filename}](./filename.md) |
5. 파일명 알파벳순 정렬 (또는 frontmatter `priority` 필드 있으면 그 순서)
```

## 분량 기준

| 섹션 | 권장 분량 |
|------|---------|
| Executive Summary | ≤10 줄 (4 행 표) |
| Decision Record | ≤30 줄 (10 결정 max) |
| Artifacts | artifact 수 × 1 행 |
| CEO 판단 근거 | ≤15 줄 |
| Next Phase | ≤5 줄 |
| **전체** | **≤200 줄** (size budget 자연 충족) |

## 옛 vs 새 main.md 비교

| 차원 | 옛 (v0.57) | 새 (v2.x) |
|------|----------|----------|
| 본문 포함? | sub-agent 결과 큐레이션 본문 다 포함 | 본문 X, 인덱스만 |
| 분량 | 200~500 줄 (큰 피처는 더) | ≤200 줄 |
| 토큰 | C-Level 이 sub-agent 본문 N번 Read + 압축 | frontmatter 만 Read |
| 정보 손실 | 큐레이션 시 발생 가능 | 0 (artifact 그대로) |
| 추적 | _tmp scratchpad + 큐레이션 기록 | frontmatter `agent/source` |

## 검증 (doc-validator 갱신)

| 룰 | 옛 | 새 |
|----|----|----|
| W-MAIN-SIZE (200줄) | warn | **자연 충족** (인덱스만이라 200 안 넘음) |
| W-IDX-01 (Topic 인덱스) | "Topic Documents" 섹션 검사 | "Artifacts" 섹션 검사 |
| W-OWN-01 (owner) | topic 문서 frontmatter | artifact 문서 frontmatter |
| W-MRG-02 (Decision Record Owner 컬럼) | 동일 | 동일 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | 5 섹션 표준 + Artifacts 표 자동 생성 알고리즘 + 옛/새 비교. doc-validator 룰 갱신 spec. |
