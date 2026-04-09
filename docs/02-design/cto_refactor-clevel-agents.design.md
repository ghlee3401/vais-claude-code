# refactor-clevel-agents - 설계 (CTO Design)

> ⛔ **Design 단계 범위**: 이 문서는 설계 결정만 기록합니다. 프로덕트 파일 생성·수정은 Do 단계에서 수행하세요.
> 참조 문서:
> - `docs/01-plan/ceo_refactor-clevel-agents.plan.md` (전략)
> - `docs/01-plan/cto_refactor-clevel-agents.plan.md` (기술 기획)

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 7개 C-Level 본문(3,734줄)이 비대·중복. CEO(696)·CTO(702)는 skill_eval WARN. |
| **WHO** | 플러그인 유지보수자 (직접), /vais 사용자 (간접 — 동작 불변) |
| **RISK** | 규칙 keyword·CP ID·mandatory 섹션 손실. **v0.48.3 자동 실행 규칙 추가분도 반드시 보존**. |
| **SUCCESS** | SC-01~SC-09 전부 PASS, 특히 SC-03(keyword ≥ baseline), SC-04(CP ID), SC-07(phrase) |
| **SCOPE** | `agents/{7}/{c}.md` 7개 본문만. frontmatter/경로/CP ID 불변. |

---

## 0. v0.48.3 반영 업데이트 (설계 단계 신규)

Plan 단계와 Design 단계 사이에 **v0.48.3 "AskUserQuestion 응답 시 자동 실행 규칙 추가" (commit 508ac58)** 가 커밋되었다. 이로 인해:

### 0.1 Baseline 재측정 (2026-04-08 post-commit)

| 파일 | Lines | AskUserQuestion | 반드시 | CP count | Plan 대비 변동 |
|------|-------|-----------------|-------|---------|--------------|
| ceo.md | 696 | **21** (↑2) | 10 | 8 | lines 동일, AUQ +2 |
| cpo.md | 366 | **8** (↑2) | 5 | 4 | lines 동일, AUQ +2 |
| cto.md | 702 | **21** (↑2) | 8 | 7 | lines 동일, AUQ +2 |
| cso.md | 485 | **9** (↑2) | 6 | 4 | lines 동일, AUQ +2 |
| cmo.md | 441 | **8** (↑2) | 4 | 5 | lines 동일, AUQ +2 |
| coo.md | 361 | **8** (↑2) | 4 | 3 | lines 동일, AUQ +2 |
| cfo.md | 399 | **8** (↑2) | 5 | 3 | lines 동일, AUQ +2 |

**관찰**: 라인 수는 동일(두 줄 치환이라 카운트 무변동). AskUserQuestion keyword는 모든 파일에서 +2 → baseline 갱신 필수.

### 0.2 Plan 단계 목표 라인 수 유지 가능성

Plan의 target (ceo ≤480, cto ≤490 등) 은 **유효**. 라인 수 변화 없음.

### 0.3 추가 보존 대상 (v0.48.3 신규 keyword)

refactor-audit.js whitelist에 **v0.48.3 자동 실행 규칙 문구** 를 추가 보존 대상으로 명시해야 한다:

| 신규 Mandatory Phrase | 출처 | 보존 규칙 |
|---------------------|------|---------|
| `즉시 자동 실행` | 동작 규칙 4번 | 각 파일 ≥ 1회 |
| `사용자 선택 = 실행 승인` | 동작 규칙 4번 | 각 파일 ≥ 1회 |
| `AskUserQuestion 승인 없이` | 동작 규칙 5번 | 각 파일 ≥ 1회 |
| `자동 연쇄 진행하지 않` | 동작 규칙 5번 | 각 파일 ≥ 1회 |

→ **설계 결정**: 이 4개 문구는 공통 압축 시 원문 그대로 보존한다 (표 안에 넣어도 OK, 단 문자열은 변경 금지).

---

## 1. Architecture Options

Plan에서 채택한 **T1(표 형식화) + T2(HTML 주석 펜스 마킹)** 조합을 채택. Design에서 세부 아키텍처만 확정.

| Option | 설명 | 복잡도 | 유지보수 | 구현 속도 | 리스크 | 선택 |
|--------|------|:------:|:--------:|:---------:|:------:|:----:|
| A. 인라인 표화만 | 단순 압축 | 낮음 | 중 | 빠름 | 낮음 | |
| B. 인라인 표화 + HTML 주석 마커 | 향후 자동화 토대 마련 | 중 | 높음 | 중 | 낮음 | ✓ |
| C. AST 변환 도구 | 재현성 최고 | 높음 | 중 | 느림 | 중 | |

**Rationale**: B는 향후 스크립트화·자동 추출의 토대를 제공하면서 sub-agent 프롬프트 주입에는 무해(주석은 파싱되지 않음). A 대비 비용은 섹션당 2줄 마커 추가만.

### 1.1 HTML 주석 마커 포맷

```markdown
<!-- @refactor:begin common-rules -->
### 최우선 규칙
...
<!-- @refactor:end common-rules -->
```

마커 ID 리스트:
- `common-rules` — AskUserQuestion 강제 + 단계별 실행 + Plan 범위 + 필수 문서
- `checkpoint-rules` — 체크포인트 기반 멈춤 규칙
- `contract` — Input/Output/State Update
- `context-load` — L1-L3
- `doc-checklist` — 종료 전 필수 문서 체크리스트
- `handoff` — CTO 핸드오프 양식
- `work-rules` — 작업 원칙 + Push 규칙

이 마커는 향후 (V2) shared 파일 자동 추출의 앵커로 재사용된다.

---

## 2. refactor-audit.js 아키텍처

### 2.1 모듈 구조

```
scripts/refactor-audit.js       # entry point (CJS)
├─ parseArgs(argv)               # --init | --all | --file | --baseline
├─ collectMetrics(filePath)      # 파일별 지표 수집
│  ├─ readFile
│  ├─ splitFrontmatter           # --- 기준 분리
│  ├─ hashFrontmatter            # sha256
│  ├─ countLines                 # body.split('\n').length
│  ├─ extractCpIds               # /CP-[A-Z0-9]+/g
│  ├─ countKeywords(whitelist)   # per keyword count
│  ├─ extractSectionHeaders      # /^##+ .+$/gm
│  └─ findPhrases(phrases)       # phrase presence map
├─ writeBaseline(metrics, path)  # JSON 저장
├─ compareBaseline(current, baseline, targets)
│  ├─ rule: lines ≤ target
│  ├─ rule: frontmatter_sha === baseline
│  ├─ rule: baseline.cp_ids ⊆ current.cp_ids
│  ├─ rule: current.keyword[k] ≥ baseline.keyword[k]
│  ├─ rule: baseline.mandatory_sections ⊆ current.sections
│  └─ rule: all phrases present
└─ reporter(results)             # 콘솔 출력 + exit code
```

### 2.2 baseline.json 스키마 (최종)

```json
{
  "generated_at": "2026-04-08T...",
  "git_sha": "<HEAD sha>",
  "version": "0.48.3",
  "whitelist": {
    "keywords": ["AskUserQuestion", "반드시", "절대 금지", "절대금지", "Plan 단계 범위", "필수 문서", "체크포인트", "SubagentStop"],
    "mandatory_sections": [
      "## 🚨 최우선 규칙",
      "### 단계별 실행 모드",
      "### ⛔ Plan 단계 범위 제한",
      "### 필수 문서",
      "## Role",
      "## ⛔ 체크포인트 기반 멈춤 규칙",
      "## Contract",
      "## Checkpoint",
      "## Context Load",
      "## ⛔ 종료 전 필수 문서 체크리스트",
      "## 작업 원칙"
    ],
    "mandatory_phrases": [
      "AskUserQuestion 도구를 호출",
      "즉시 자동 실행",
      "사용자 선택 = 실행 승인",
      "자동 연쇄 진행하지 않"
    ]
  },
  "targets": {
    "agents/ceo/ceo.md": 480,
    "agents/cpo/cpo.md": 300,
    "agents/cto/cto.md": 490,
    "agents/cso/cso.md": 400,
    "agents/cmo/cmo.md": 360,
    "agents/coo/coo.md": 295,
    "agents/cfo/cfo.md": 320
  },
  "files": {
    "agents/ceo/ceo.md": {
      "lines": 696,
      "frontmatter_sha256": "<hex>",
      "cp_ids": ["CP-1","CP-2","CP-A","CP-L1","CP-L2","CP-L3","CP-Q","CP-R"],
      "keyword_counts": {
        "AskUserQuestion": 21,
        "반드시": 10,
        "절대 금지": 4,
        "Plan 단계 범위": 1,
        "필수 문서": 3,
        "체크포인트": 5,
        "SubagentStop": 1
      },
      "section_headers_count": 39,
      "mandatory_phrases": {
        "AskUserQuestion 도구를 호출": 7,
        "즉시 자동 실행": 1,
        "사용자 선택 = 실행 승인": 1,
        "자동 연쇄 진행하지 않": 1
      }
    }
    // ... 6 more files
  }
}
```

### 2.3 명령어 인터페이스

| 명령 | 동작 |
|------|------|
| `node scripts/refactor-audit.js --init` | HEAD 커밋 기준으로 baseline.json 생성 |
| `node scripts/refactor-audit.js --all` | 7개 파일 전부 baseline과 비교 |
| `node scripts/refactor-audit.js --file agents/ceo/ceo.md` | 단일 파일 검증 |
| `node scripts/refactor-audit.js --targets` | targets 만 출력 (dry run) |

Exit codes:
- `0`: 모든 파일 PASS
- `1`: 한 파일 이상 FAIL
- `2`: CLI 인자 오류

### 2.4 출력 포맷

```
[refactor-audit] agents/ceo/ceo.md
  ✓ lines          473 ≤ 480
  ✓ frontmatter    sha256 unchanged
  ✓ CP IDs         8/8 preserved (CP-1 CP-2 CP-A CP-L1 CP-L2 CP-L3 CP-Q CP-R)
  ✓ keywords       8/8 ≥ baseline
  ✓ sections       11/11 mandatory preserved
  ✓ phrases        4/4 present
  RESULT: PASS

[refactor-audit] agents/cto/ctto.md
  ✗ CP IDs         6/7 preserved — MISSING: CP-G1
  ✗ keywords       7/8 — AskUserQuestion: current=19 < baseline=21
  RESULT: FAIL

[refactor-audit] Summary: 6 PASS / 1 FAIL
```

### 2.5 테스트 전략

| 테스트 | 방법 |
|--------|------|
| T1. 기본 동작 | baseline 생성 → 변경 없이 audit → 전부 PASS |
| T2. CP ID 누락 감지 | ceo.md에서 "CP-R" 문자열 삭제 → audit FAIL |
| T3. keyword 감소 감지 | ceo.md에서 "AskUserQuestion" 2회 삭제 → audit FAIL |
| T4. frontmatter 변경 감지 | description 1글자 변경 → audit FAIL |
| T5. target 초과 감지 | 본문 1000줄 추가 → audit FAIL |
| T6. mandatory section 누락 감지 | `## Contract` 헤더 제거 → audit FAIL |

Do 단계 시작 시 T1~T6 smoke test 먼저 수행.

---

## 3. 파일별 상세 섹션 압축 맵

> 원칙: **문장 rewording 금지. 표 형식화·중복 제거·예시 압축만.** 마커(`<!-- @refactor:... -->`) 삽입 허용.

### 3.1 공통 압축 패턴 (7개 파일 공통 적용)

#### Before → After 매핑 표

| Before 섹션 (현재) | 대상 줄 수 | After 방식 | 목표 줄 수 |
|-----|---|-----|---|
| `## 🚨 최우선 규칙: 단계별 실행 + 필수 문서 작성 [+ AskUserQuestion 강제]` (소제목 4개 포함) | ~60 | 단일 섹션 + 4개 하위를 표 1개로 | ~30 |
| `### AskUserQuestion 강제 사용 (절대 규칙)` 상세 + 자가점검 블록 | ~15 | 규칙 리스트(bullet 4개) + 자가점검 1표 | ~10 |
| `### 단계별 실행 모드` phase 테이블 + 동작 규칙 | ~18 | phase 테이블 유지 + 동작 규칙 5개 항목 단축 | ~13 |
| `### ⛔ Plan 단계 범위 제한` | 9 | 원문 유지 (핵심 규칙) | 9 |
| `### 필수 문서` | 7 | 2줄 요약 | 3 |
| `## ⛔ 체크포인트 기반 멈춤 규칙` 헤더 + 표 + 규칙 | 17 | 표만 유지 + 규칙 4개를 1줄 bullet로 | 11 |
| `## Contract` (Input/Output/State Update 3 표) | 12 | 3표 병합 | 8 |
| `## Context Load` | 6 | 그대로 | 6 |
| `## ⛔ 종료 전 필수 문서 체크리스트` | 13 | 표 + 1문장 | 9 |
| `## CTO 핸드오프` (CPO/CSO/CMO/COO/CFO) | 11 | 표 1개 + 예시 1 | 8 |
| `## 작업 원칙` + `### Push 규칙` | 15 | bullet 압축 | 8 |
| **합계/파일** | **183** | | **115** → **-68줄/파일** |

### 3.2 파일별 고유 압축 맵

#### 3.2.1 ceo.md (696 → 480, -216줄)

| 섹션 | 현재 | 변경 | 목표 |
|------|------|------|------|
| `## 서비스 런칭 모드 — 동적 라우팅` | 140 | Mermaid 1개 + "피처 성격 분석 기준" 표 유지 + "추천 판단 우선순위" 리스트 유지 + "C-Level 의존성 맵" 표 유지 + "CSO↔CTO 반복 루프" 간결화 + "C-Level 위임 시 PDCA 순차 호출 규칙" 표화 + "CEO 최종 리뷰 체크리스트" bullet | 85 |
| `### CP-L2 추천 출력 형식` 코드 펜스 | 34 | 예시 1개 축약 | 18 |
| `## PDCA 사이클` (라우팅 + absorb) | 70 | absorb Do 분기 로직 펜스 1개 + MCP 경로는 요약 표 | 45 |
| `## Checkpoint` — CP-1/2/Q/R/A 상세 | 200 | 각 CP의 "출력 템플릿 코드펜스"를 **CP-1만 full 유지**, 나머지는 표 + 간결 펜스 | 135 |
| `## Full-Auto 모드` | 25 | 판정 기준표 유지, 서술 축약 | 15 |
| **CEO 고유 합계** | **469** | | **298** → **-171줄** |

**검증**: 696 - 68(공통) - 171(고유) + 27(v0.48.3 추가 보존 여백) = **484**
→ 목표 ≤480과 차이 4줄. **추가 압축 포인트**: CP-L2 출력 예시에서 중복 예시 1개 제거 또는 Full-Auto 모드 25→12로 3줄 추가 절감. **최종 목표: ≤480** 달성 가능.

#### 3.2.2 cto.md (702 → 490, -212줄)

| 섹션 | 현재 | 변경 | 목표 |
|------|------|------|------|
| `### ⛔ PRD 입력 (CP-0)` + `### ⛔ 체크포인트 도구 호출 강제 (F9)` + `### ⛔ CP 출력 표 렌더링 규칙 (F8)` | 35 | F8/F9는 메타 지시 — 표 1개로 병합 | 15 |
| `## Checkpoint` — CP-0/1/D/G1~G4/2/Q 템플릿 | 265 | **CP-1만 full 펜스 유지** (기준 예시). CP-0/D/G/2/Q는 표 + 핵심 펜스만 | 155 |
| `## PDCA 사이클 — 기술 도메인` + 에이전트 위임 규칙 + 체이닝 | 45 | 에이전트 위임 표 유지, 체이닝은 표 1개 | 28 |
| `## Gate 판정 시스템` (Gate 1~4) | 35 | 4 gate를 단일 표로 | 18 |
| `## Interface Contract` 예시 | 25 | 예시 1개만 | 12 |
| `## 데이터 분석 역량` (SQL/Cohort/A/B) | 45 | 섹션 헤더 + SDK 링크 + 요약 표 | 18 |
| **CTO 고유 합계** | **450** | | **246** → **-204줄** |

**검증**: 702 - 68(공통) - 204(고유) = **430** ≤ 490 ✅ 여유 60줄.

#### 3.2.3 cso.md (485 → 400, -85줄)

| 섹션 | 현재 | 변경 | 목표 |
|------|------|------|------|
| (공통 압축) | 68 감소 | | |
| `## PDCA 사이클 — 보안 도메인` + Gate A/B/C + Gate B 서브 분기 | 45 | Gate 3개를 표로 병합 | 30 |
| `## 법적 컴플라이언스 체크리스트` (GDPR/NDA/ToS) | 50 | **원문 그대로 유지** (도메인 핵심 가치) | 50 |
| `## 판정 기준표` Gate A/B/C | 20 | 표로 병합 | 12 |
| `## CTO 핸드오프` + 중복 섹션 | 40 | 공통 압축에 포함 | - |
| `## Security Report 작성` + `### Gate 결과` + `### 발견된 취약점` + `### 배포 승인 여부` | 15 | **"배포 승인 여부" 문자열 보존 필수** (gate-check.js:179) | 12 |
| **CSO 고유 합계** | **170** | | **104** → **-66줄** (공통 외) |

**검증**: 485 - 68 - 17 = **400** ✅

**⚠️ SC-09 핵심 보존**: `### 배포 승인 여부` 헤더는 `scripts/gate-check.js:179`의 `/배포\s*승인\s*여부/i` 정규식과 매칭되어야 한다. **헤더 텍스트 변경 절대 금지**.

#### 3.2.4 cmo.md (441 → 360, -81줄)

| 섹션 | 현재 | 변경 | 목표 |
|------|------|------|------|
| (공통 압축) | 68 감소 | | |
| GTM 전략 프레임워크 (Beachhead/ICP/NSM) | 80 | 표 1개 + SDK 링크, 설명 산문 축약 | 67 |
| **추가 감소** | | | **-13줄** |

**검증**: 441 - 68 - 13 = **360** ✅

#### 3.2.5 cfo.md (399 → 320, -79줄)

| 섹션 | 현재 | 변경 | 목표 |
|------|------|------|------|
| (공통 압축) | 68 감소 | | |
| 가격책정/수익화 프레임워크 (Unit Economics/Monetization) | 60 | 표 1개 + 산문 축약 | 49 |
| **추가 감소** | | | **-11줄** |

**검증**: 399 - 68 - 11 = **320** ✅

#### 3.2.6 cpo.md (366 → 300, -66줄)

- 공통 압축 68줄 감소로 298줄 목표 달성
- 고유 섹션은 JTBD 프레임워크 15줄 → 그대로 유지 (도메인 가치)
- **검증**: 366 - 68 = **298** ≤ 300 ✅

#### 3.2.7 coo.md (361 → 295, -66줄)

- 공통 압축 68줄 감소로 293줄 목표 달성
- CI/CD 표준 40줄 중 → 표화로 10줄 절감, 파이프라인 설정 경로 표 유지
- **검증**: 361 - 68 = **293** ≤ 295 ✅

### 3.3 v0.48.3 추가 보존 원칙 (모든 파일)

공통 압축 시 **"동작 규칙" 섹션의 4·5번 항목**은 원문 그대로 유지한다. 이 2줄은 v0.48.3에서 신규 추가된 규칙이며 `refactor-audit.js` mandatory_phrases 로 검증된다.

---

## 4. Do 단계 실행 체크리스트

### 4.1 사전 작업 (순차)

- [ ] **Pre-1**: git status 확인, 새 브랜치 또는 main에서 시작
- [ ] **Pre-2**: `node scripts/refactor-audit.js --init` → `docs/03-do/ceo_refactor-clevel-agents.baseline.json` 생성
- [ ] **Pre-3**: baseline.json 유효성 육안 검증 (7개 파일 모두 존재, targets 표 일치)
- [ ] **Pre-4**: refactor-audit smoke test T1 수행 (변경 없이 audit → 전부 PASS 확인)

### 4.2 파일 순차 리팩터링 (저위험 → 고위험)

각 파일마다:
1. Edit 수행
2. `node scripts/refactor-audit.js --file <path>` 실행
3. PASS → 다음 파일
4. FAIL → `git checkout HEAD -- <path>` 로 롤백, 재시도

| 순서 | 파일 | 예상 Edit 횟수 | 핵심 주의사항 |
|------|------|--------------|-------------|
| 1 | coo.md (361→295) | ~10 | 공통 압축 패턴 검증용 |
| 2 | cpo.md (366→300) | ~10 | JTBD 프레임워크 보존 |
| 3 | cfo.md (399→320) | ~12 | 가격책정 프레임워크 보존 |
| 4 | cmo.md (441→360) | ~13 | GTM 프레임워크 보존 |
| 5 | cso.md (485→400) | ~15 | ⚠️ "배포 승인 여부" 헤더 불변 (SC-09) |
| 6 | **ceo.md (696→480)** | ~22 | 서비스 런칭 모드 Mermaid 변환, CP-L2 출력 축약 |
| 7 | **cto.md (702→490)** | ~22 | CP 템플릿 7개 병합, CP-1만 full 펜스 |

### 4.3 사후 작업

- [ ] **Post-1**: `node scripts/refactor-audit.js --all` → 전부 PASS 확인
- [ ] **Post-2**: `python3 -m scripts.skill_eval.quick_validate agents/ceo/ceo.md agents/cpo/cpo.md agents/cto/cto.md agents/cso/cso.md agents/cmo/cmo.md agents/coo/coo.md agents/cfo/cfo.md` → 전부 PASS (WARN 0건)
- [ ] **Post-3**: `node scripts/vais-validate-plugin.js` → PASS
- [ ] **Post-4**: smoke 회귀 3건 (QA 단계에서 수행)
- [ ] **Post-5**: `docs/03-do/cto_refactor-clevel-agents.do.md` 작성

---

## 5. Risk 재평가 (Design 단계 업데이트)

Plan 단계 R1~R10 위에 추가:

| # | 시나리오 | 발생 지점 | 방지책 |
|---|---------|---------|--------|
| R11 | v0.48.3 "즉시 자동 실행" 문구가 공통 압축 중 누락 | F1 공통 압축 | mandatory_phrases whitelist에 4개 추가 (§0.3) |
| R12 | CSO "배포 승인 여부" 헤더 변경 → gate-check.js:179 regex 실패 | CSO 리팩터링 | §3.2.3 명시, SC-09 검증 |
| R13 | CP-1 템플릿 펜스 압축 시 예시 부실 → 사용자 실행 형식 혼동 | CTO F3 | 설계 원칙: 각 파일 최소 1개 full 펜스 유지 (§5.1 Plan 정책 8) |
| R14 | baseline 생성 시점 vs Do 시점 차이로 git SHA 불일치 | Pre-2 | baseline.json에 git_sha 기록, Do 시작 시 HEAD 일치 확인 |
| R15 | refactor-audit.js 자체 버그로 false PASS | T1~T6 | Do 시작 전 smoke test 필수 (§2.5) |

---

## Success Criteria (Design 단계 추가)

| ID | Criterion | Verification |
|----|-----------|--------------|
| SC-01~SC-09 | (Plan 단계 정의) | Plan 문서 참조 |
| **SC-10** | v0.48.3 mandatory_phrases 4개 전부 보존 | `refactor-audit.js` phrases check |
| **SC-11** | CSO "배포 승인 여부" 헤더 문자열 불변 | `grep -c "^### 배포 승인 여부$" agents/cso/cso.md` = 1 |
| **SC-12** | refactor-audit.js smoke test T1~T6 전부 통과 | `docs/03-do/audit-smoke-test.log` |
| **SC-13** | 각 파일 최소 1개 full CP 출력 펜스 유지 | Do 단계 수동 검증 |

---

## Impact Analysis

### Changed Resources (Design 단계 확정)

| Resource | Type | Change |
|----------|------|--------|
| `agents/ceo/ceo.md` | modify | 696 → ≤480 (§3.2.1 맵대로) |
| `agents/cpo/cpo.md` | modify | 366 → ≤300 |
| `agents/cto/cto.md` | modify | 702 → ≤490 |
| `agents/cso/cso.md` | modify | 485 → ≤400 (SC-11 보존) |
| `agents/cmo/cmo.md` | modify | 441 → ≤360 |
| `agents/coo/coo.md` | modify | 361 → ≤295 |
| `agents/cfo/cfo.md` | modify | 399 → ≤320 |
| `scripts/refactor-audit.js` | create | CJS 스크립트 (~200 LOC 예상) |
| `docs/03-do/ceo_refactor-clevel-agents.baseline.json` | create | Baseline snapshot |
| `docs/03-do/cto_refactor-clevel-agents.do.md` | create | Do 단계 로그 |
| `docs/03-do/audit-smoke-test.log` | create | T1~T6 결과 |

### Verification
- [x] v0.48.3 반영: baseline 재측정, mandatory_phrases 추가, 목표 라인 수 재확인
- [x] CSO SC-09/SC-11 연동 명시
- [x] refactor-audit.js 모듈 구조·테스트 전략 확정
- [x] Do 단계 실행 체크리스트 완성
- [x] R11~R15 추가 리스크 방지책 명시

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-08 | 초기 작성 — CTO plan 기반 상세 설계. v0.48.3 반영분 통합. refactor-audit.js 아키텍처, 파일별 섹션 압축 맵, Do 체크리스트, R11-R15 추가 |
