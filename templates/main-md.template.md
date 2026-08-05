---
owner: {c-level}
agent: {c-level}-direct
artifact: phase-index
phase: {phase}
feature: {feature}
generated: {YYYY-MM-DD}
summary: "{phase 한 줄 요약 ≤200자}"
---

# {feature} — {Phase Name} (인덱스)

> Phase: {icon} {phase} | Owner: {C-Level} | Date: {date}
> 참조: {이전 phase main.md 링크 또는 — 없으면 생략}

## 1. Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | {1~2문장} |
| **Solution** | {1~2문장} |
| **Effect** | {사용자 체감 변화} |
| **Core Value** | {핵심 가치} |

## 2. Decision Record (multi-owner)

| # | Decision | Owner | Rationale | Source artifact |
|---|----------|:-----:|-----------|----------------|
| 1 | {결정 한 줄} | {c-level} | {근거} | `{artifact}.md` |

> 이전 phase 의 Decision 은 그대로 유지 (append-only). 자기 결정만 새 행 추가.

## 3. Artifacts (이 phase 박제 자료)

> sub-agent 가 직접 박제한 artifact 들의 인덱스. C-Level 이 frontmatter 만 읽고 표 자동 생성.

| Artifact | Owner | Agent | Source 거장 | 한 줄 요약 | 파일 |
|----------|:-----:|:-----:|:----------:|----------|------|
| {name} | {owner} | {agent} | {source 또는 —} | {summary} | [`{name}.md`](./{name}.md) |

> 표 행 순서: 알파벳 또는 frontmatter `priority` 필드 (있으면)

## 4. CEO 판단 근거 (왜 이 artifact 들이 이 phase 에)

- 포함: {sub-agent A 활성 이유 1줄}
- 포함: {sub-agent B 활성 이유}
- 제외: {제외된 차원 — 이유}

> CEO ideation 의 7 차원 결과 참조. 매 피처 같은 알고리즘.

## 5. Next Phase

→ **{next-phase}** ({다음 책임 C-Level} 진입)

다음 phase 의 예상 artifact (CEO ideation 박제 기준):
- {artifact 1}
- {artifact 2}
- ...

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | {date} | 초기 작성 — {간단 설명} |

<!-- main-md template version: v2.0 -->
