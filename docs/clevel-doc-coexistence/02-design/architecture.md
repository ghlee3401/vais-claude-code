---
owner: cto
authors: []
topic: architecture
phase: design
feature: clevel-doc-coexistence
---

# clevel-doc-coexistence — design — architecture

> Topic: architecture | Owner: cto | Phase: design
> 참조: `./main.md`, `./data-model.md`, `./interface-contract.md`

## 1. 아키텍처 3옵션 (CP-D)

| | A. 최소 변경 | B. 클린 아키텍처 | **C. 실용적 균형 ← 채택** |
|---|-------------|------------------|--------------------------|
| 접근 | `status.js` / `doc-validator.js` 에 함수 추가 | `lib/coexistence/` 신규 모듈 + 추상화 | 기존 파일 확장 + 필요 시 헬퍼 분리 |
| 복잡도 | 낮음 | 높음 (3+ 신규 파일) | 중간 |
| 유지보수 | 파일 비대화 | 높음 (독립 모듈) | 중간 |
| 새 파일 | 1-2 | 5+ | **2** (`clevel-main-guard.md`, `patch-clevel-guard.js`) |
| 수정 파일 | ~20 | ~25 | **~22** |
| 리스크 | 기술 부채 누적 | 추상화 과대 | — |

**채택 C — 실용적 균형** (사용자 CP-D 확정, 2026-04-20).
이유: MVP 범위 B(Standard) 와 정합. v0.57 선례(동일 옵션 C 선택)와 일관.

## 2. 컴포넌트 설계

### 2.1 `agents/_shared/clevel-main-guard.md` (canonical, 80~120 lines 목표)

**구성**:
1. 목적 선언
2. 진입 프로토콜 — "main.md 존재 시 Read 필수"
3. H2 섹션 규약 (`## [{C-LEVEL}] ...` 대문자 유지)
4. Decision Record — 자기 행 append, Owner 컬럼 필수
5. Topic Documents 인덱스 — 자기 topic 엔트리 추가
6. Topic frontmatter owner 규약
7. 재진입 규칙 (D-Q5) — 섹션 교체 + 변경 이력 entry
8. **Size budget 규칙 (F14)** — main.md 가 `mainMdMaxLines` 초과 시 topic 분리
9. 금지 사항 — 다른 C-Level 섹션 수정/삭제
10. enforcement=warn 정책 안내
11. 버전 마커

### 2.2 `scripts/patch-clevel-guard.js`

**흐름**:
1. `agents/_shared/clevel-main-guard.md` 본문(frontmatter 제외) 추출
2. `<!-- clevel-main-guard begin vX.Y.Z -->` / `end -->` 마커로 wrap
3. 6 C-Level agent md 순회 (`agents/{ceo,cpo,cto,cso,cbo,coo}/*.md`)
4. `<!-- subdoc-guard end -->` 마커 탐지 → 직후에 clevel-main 블록 삽입
5. 기존 블록 존재 시 버전 비교(content hash) → 동일하면 skip, 다르면 교체
6. `--check` 플래그 지원 (CI 용 no-op dry run)

**idempotent**: 2회 실행 no-op 보장.

### 2.3 `scripts/doc-validator.js` 확장

**신규 함수**: `validateCoexistence(feature, options)` — 기존 `validateSubDocs()` 와 동급 엔트리. CLI 출력 JSON 에 `coexistenceWarnings[]` 필드 추가.

**신규 경고 로직**:

| Code | 로직 개요 |
|------|-----------|
| `W-OWN-01` | topic.md 스캔 → YAML frontmatter 파싱 → `owner` 키 확인 |
| `W-OWN-02` | `owner` 값 ∉ `{ceo,cpo,cto,cso,cbo,coo}` |
| `W-MRG-02` | main.md 에서 `## Decision Record` 다음 표 헤더 라인 파싱 → `\|.*Owner.*\|` regex |
| `W-MRG-03` | main.md 에 `^## \[(CBO\|CPO\|CTO\|CSO\|COO\|CEO)\] ` 섹션 0 AND `topics[]` ≥ 2 |
| **`W-MAIN-SIZE` (F14)** | `wc -l main.md` > `mainMdMaxLines` AND `_tmp/` 0 AND topic 0 |

### 2.4 `lib/status.js` 확장

| 함수 | 반환 | 용도 |
|------|------|------|
| `registerTopic(feature, phase, topic, {owner, authors})` | topic 엔트리 | `topics[]` 등록 |
| `listFeatureTopics(feature, phase?)` | 엔트리[] | 조회 |
| `listScratchpadAuthors(feature, phase)` | `[{slug, path, summary}]` | D-Q3 헬퍼 |
| `getOwnerSectionPresence(feature, phase)` | `{ceo,cpo,...: bool}` | main.md `## [{X}]` 탐지 |
| `getFeatureTopics(feature, phase)` | topic 엔트리[] | D-Q6 인터페이스 |
| **`getMainDocSize(feature, phase)` (F14)** | `{ path, lines, bytes }` | W-MAIN-SIZE 판정용 |

### 2.5 Templates 수정 (5 파일)

`templates/{plan,design,do,qa,report}.template.md`:
- Executive Summary 표 → `Contributing C-Levels` 컬럼 추가
- Decision Record 표 → `Owner` 컬럼 추가
- 각 C-Level 용 H2 플레이스홀더 주석
  ```markdown
  <!-- 각 C-Level 은 자기 섹션을 아래에 append:
       ## [CBO] ... / ## [CPO] ... / ## [CTO] ... -->
  ```
- **(F14) Size budget 주석**:
  ```markdown
  <!-- size budget: main.md ≤ 200 lines 권장. 초과 시 topic 문서로 분리. -->
  ```
- `report.template.md` 는 `reportPhase: single` 정책(v0.57) 유지 — 멀티-오너는 허용하되 경고 없음.

## 3. 데이터 흐름

```
[C-Level 진입]
  ↓
main.md 존재? ──── No → 새로 생성 (자기 섹션 + Topic 인덱스 스켈레톤)
  ↓ Yes
Read main.md → 자기 `## [{C-LEVEL}]` 섹션 존재?
  ├── 없음  → append 자기 섹션 + Decision Record 행 추가 + Topic 인덱스 갱신
  └── 있음 (재진입) → 자기 섹션 교체 + `## 변경 이력` entry 추가
  ↓
topic 문서 Write (frontmatter owner 포함)
  ↓
status.js registerTopic()
  ↓
[F14] getMainDocSize() > threshold && topic 없음?
  └── Yes → W-MAIN-SIZE 경고 (clevel-main-guard §8 상기)
  ↓
종료 → doc-validator.js hook 자동 실행 → coexistenceWarnings 출력
```

## 4. 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| design main.md v1.0 §2/§4 | ✅ | | ✅ | | 아키텍처 비교 + 컴포넌트 설계 이관 |
| F14 반영 (v1.1) | | | | ✅ | §2.3 W-MAIN-SIZE + §2.4 getMainDocSize + §2.5 size budget 주석 + §3 F14 흐름 |

**필요성 판단**: 아키텍처 3옵션 비교는 main.md 축약 시 soft-pointer 로만 남기고 본 topic 에 상세 유지. F14 는 CP-D 이후 증분.

## 5. 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-20 | 초기 — 3옵션 비교, 컴포넌트 설계 (main.md 에서 추출) |
| v1.1 | 2026-04-20 | F14 편입 — `W-MAIN-SIZE` / `getMainDocSize` / size budget 주석 |
