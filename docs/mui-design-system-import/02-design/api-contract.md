---
owner: cto
topic: api-contract
phase: design
feature: mui-design-system-import
---

# API Contract — mui-design-system-import (design v2.0)

> Owner: CTO | Phase: design | Date: 2026-05-02 (v2.0 — 런타임 통합 폐기)
> 본 피처는 외부 HTTP API 가 없는 internal infra. **v2.0**: 런타임 통합 폐기로 Hook/MCP API 도 본 피처 범위 외 → **인터페이스 = CLI 1종 + ui-designer.md 안내문 1줄**.

## 한 줄 요약 (v2.0)

(1) `import-mui-design-system.js` CLI 시그니처 + exit code, (2) `agents/cto/ui-designer.md` 안내문 1줄 spec — 2종 인터페이스 확정. **v1.0 의 Hook diff / MCP adapter API / hookSpecificOutput.additionalContext 주입 spec 모두 폐기**.

---

## 1. Import CLI (`scripts/import-mui-design-system.js`)

### 1.1 Usage

```
node scripts/import-mui-design-system.js [options]

Options:
  --fallback-mui-only      Figma API 호출 스킵, MUI npm 디폴트만으로 빌드
                           (FIGMA_PAT 미설정 시 자동 활성)
  --dry-run                실제 파일 쓰기 없이 diff 만 출력 (CI/PR 검증용)
  --skip-validation        Ajv 검증 스킵 (디버깅 용, production 사용 금지)
  --figma-file-key <key>   Figma file key 명시 (env 보다 우선)
  --verbose, -v            상세 로그
  --help, -h               이 메시지
```

> v1.0 의 `--ds-name <name>` 파라미터 폐기 — 본 피처는 `mui` 고정. ds-name 일반화는 후속 피처 (`nc-design-system-import` 등) 에서 도입.

### 1.2 환경변수

| 변수 | 필수 | 설명 |
|------|:----:|------|
| `FIGMA_PAT` | ⚠️ 권장 | Figma Personal Access Token. 없으면 `--fallback-mui-only` 자동 활성 |
| `FIGMA_FILE_KEY` | ⚠️ 권장 | Figma file key. 없으면 fallback |
| `MUI_VERSION_PIN` | ❌ | 명시적 MUI 버전 사용 (기본: package.json devDep 사용) |

### 1.3 표준 출력 (stdout)

```
[1/4] FETCH
  ✓ Figma styles    (124 entries, 32.1KB)
  ✓ MUI npm theme   (createTheme defaults)
  ✓ overrides       (0 entries)
[2/4] NORMALIZE
  ✓ figma → standard schema (124 → 87 tokens after dedupe)
  ✓ mui   → standard schema (140 tokens)
[3/4] RESOLVE (overrides > figma > mui-npm)
  ✓ merged 156 tokens (figma=87, mui-only=69, override=0)
[4/4] EMIT (atomic)
  ✓ design-system/mui/MASTER.md
  ✓ design-system/mui/tokens/{color,typography,spacing,radius,shadow}.md
  ✓ design-system/mui/components/{19개}.md
  ✓ design-system/mui/lockfile.json
  ✓ design-system/mui/CHANGELOG.md (entry: v1.0.1)
  ✓ design-system/INDEX.md (mui entry updated)

DIFF SUMMARY (vs previous lockfile):
  tokens changed:    2 (primary.main, error.dark)
  components changed: 0
  added: 0   removed: 0   deprecated: 0

✓ Done in 12.4s
```

### 1.4 Exit code

| Code | 의미 | 예시 시나리오 |
|:----:|------|--------------|
| 0 | 성공 | 정상 완료 또는 input unchanged (멱등) |
| 1 | 일반 에러 | 알 수 없는 예외 |
| 2 | schema 검증 실패 | lockfile invalid, JSON schema 불일치 |
| 3 | Figma 인증 실패 | FIGMA_PAT 만료/무효 (401) |
| 4 | MUI npm 부재 | `@mui/material` 미설치 |
| 5 | 출력 atomicity 실패 | 일부 파일 쓰기 실패 시 rollback 미완료 |

### 1.5 멱등성 보장

- Stage 0: input hash 계산 (figma + mui + overrides)
- 기존 lockfile.inputs 의 모든 hash 와 일치 시 Stage 1~4 스킵, exit 0 + "input unchanged" 메시지
- `--dry-run` 은 항상 모든 stage 실행 (멱등 검사 무시)

### 1.6 atomic emit

- emit 단계는 임시 디렉토리 (`tmp/ds-emit-{ts}/`) 에 모두 쓰고, 검증 통과 시 `rename` 으로 이동
- 부분 실패 시 임시 디렉토리 삭제, 원본 미변경 → 사용자는 항상 일관된 카탈로그를 봄
- 자세한 흐름은 `architecture.md` §4

---

## 2. ui-designer.md 안내문 spec (D-8)

### 2.1 추가 위치

기존 `agents/cto/ui-designer.md` 의 "## 문서 참조 규칙" 섹션 본문 (line 119~131 근처) 에 다음 한 줄 추가:

```markdown
> 디자인 시스템 카탈로그가 등록되어 있으면 (`design-system/INDEX.md` 참조), 해당 DS 의 `design-system/{ds}/MASTER.md` 를 우선 참조하여 토큰/컴포넌트 어휘를 일관되게 사용합니다.
```

### 2.2 변경 범위

- frontmatter 변경 ❌
- tools 변경 ❌
- 새 섹션 추가 ❌
- 본문 단 한 줄 추가만

### 2.3 효과

- ui-designer agent 가 컨텍스트를 읽을 때 자연스럽게 카탈로그 위치를 인지
- 자동 호출/주입 없음 (런타임 통합 폐기)
- agent 가 "필요하다고 판단되면" 카탈로그를 Read 하는 정도 — 사용자 의도와 일치

---

## 3. ~~Hook 수정 spec~~ (N/A in v2.0)

> **v2.0**: 폐기. 본 피처는 hook 변경 없음.

## 4. ~~MCP adapter API~~ (N/A in v2.0)

> **v2.0**: 폐기. 본 피처는 MCP runner 변경 없음. 기존 `design_search` / `design_system_generate` / `design_stack_search` 모두 vendor 동작 그대로.

## 5. ~~Response shape (DesignSearchResponse)~~ (N/A in v2.0)

> **v2.0**: 폐기.

---

## 6. 호환성 매트릭스 (v2.0)

| 인터페이스 | Backward Compatible? | 근거 |
|----------|:--------------------:|------|
| Import CLI | ✅ (신규) | 신규 스크립트, 기존 사용처 없음 |
| ui-designer.md | ✅ | 본문 1줄 추가만, frontmatter 변경 없음 |
| Hook PreToolUse | ✅ | **변경 없음** (v2.0) |
| MCP design_* tools | ✅ | **변경 없음** (v2.0) |

---

## 큐레이션 기록

| Source | 채택 | 거절 | 병합 | 추가 | 이유 |
|--------|:----:|:----:|:----:|:----:|------|
| v1.0 §2 (Hook diff) | | ✓ | | | (v2.0) 본 피처 범위 외 |
| v1.0 §3 (MCP adapter API) | | ✓ | | | (v2.0) 본 피처 범위 외 |
| v1.0 §1 (Import CLI) | ✓ | | | | 본 피처 핵심 인터페이스, 유지 |
| v1.0 §4 (ui-designer 본문 추가) | | | ✓ | | (v2.0) "## 디자인 시스템 baseline" 큰 섹션 → 한 줄 안내문으로 축소 |
| 사용자 정정 (2026-05-02) | | | | ✓ | "사용자가 쓸 때 부른다는 의미가 아니었다" → 자동 호출 spec 일체 폐기 |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-01 | CTO design 초기 작성 (CLI + Hook diff + MCP adapter + ui-designer 본문 + 호환성 매트릭스) |
| **v2.0** | **2026-05-02** | **런타임 통합 폐기 — §3 (Hook diff) / §4 (MCP adapter API) / §5 (Response shape) 모두 N/A 표시. §1 (CLI) 유지하되 `--ds-name` 파라미터 제거 (mui 고정). §2 (ui-designer.md) 큰 섹션 추가 → 한 줄 안내문으로 축소. 호환성 매트릭스 — Hook/MCP "변경 없음" 으로 단순화.** |
