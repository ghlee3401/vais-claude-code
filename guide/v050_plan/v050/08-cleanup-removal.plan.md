# Sub-plan 08 — Cleanup & Removal

> 상위: `../v050-full-overhaul.plan.md`
> 선행: 01, 02, 06, 07
> 후행: 09

---

## 0. 목적

v0.49의 CMO/CFO 구조와 제거된 sub-agent들을 **실제 디스크에서 삭제**하고, 코드베이스 전체에 잔존 참조가 없음을 grep으로 검증한다.

선행 조건이 중요: **CBO가 동작하고(01)**, **라우팅이 전환되었고(06)**, **VALID_SUBAGENTS에서 제외(07)** 된 후에만 안전.

---

## 1. 삭제 대상

### 1.1 디렉토리
- `agents/cmo/` (전체)
- `agents/cfo/` (전체)

### 1.2 파일
- `agents/ceo/retrospective-writer.md`
- `agents/coo/technical-writer.md`
- `agents/cto/release-engineer.md` (이미 COO로 이동, CTO 사본 제거)
- `agents/cto/performance-engineer.md` (같은 이유, 존재 시)
- `skills/vais/phases/cmo.md`
- `skills/vais/phases/cfo.md`

### 1.3 Git 상태에서 이미 일부 진행 확인됨
```
D agents/ceo/retrospective-writer.md
D agents/cfo/cfo.md
D agents/cfo/finops-analyst.md
D agents/cfo/pricing-analyst.md
D agents/cmo/cmo.md
D agents/cmo/copy-writer.md
D agents/cmo/growth-analyst.md
D agents/cmo/seo-analyst.md
D agents/cto/release-engineer.md  (T = typechange)
D agents/cto/technical-writer.md (D → 이미 CTO에 없을 수 있음)
D skills/vais/phases/cfo.md
D skills/vais/phases/cmo.md
```

대부분 이미 `git status`에서 `D`로 찍혀 있음. 이 sub-plan은 **남은 파일 정리 + 모든 참조 제거 + grep 검증**에 집중.

---

## 2. 실행 단계

### 2.1 Precheck (선행 보장 재확인)

```bash
# 1. CBO 완성 확인
ls agents/cbo/*.md | wc -l      # → 11 (본체 + 10 sub)
test -f agents/cbo/cbo.md && echo OK

# 2. 라우터 전환 확인
grep -c "cmo\|cfo" skills/vais/SKILL.md    # → 0
test -f skills/vais/phases/cbo.md && echo OK

# 3. agent-start whitelist 확인
grep -c "'cmo'\|'cfo'" scripts/agent-start.js   # → 0

# 4. 기존 상태 파일 마이그레이션 확인
node -e "require('./lib/core/migration-engine').migrate({dryRun:true})"
```

위 4개 모두 통과한 후에만 삭제 진행.

### 2.2 파일/디렉토리 삭제

```bash
# CMO/CFO 완전 제거
git rm -rf agents/cmo/ agents/cfo/

# 개별 파일
git rm -f agents/ceo/retrospective-writer.md 2>/dev/null || true
git rm -f agents/coo/technical-writer.md 2>/dev/null || true
git rm -f agents/cto/release-engineer.md 2>/dev/null || true
git rm -f agents/cto/performance-engineer.md 2>/dev/null || true
git rm -f skills/vais/phases/cmo.md skills/vais/phases/cfo.md 2>/dev/null || true
```

### 2.3 Grep 검증 (Critical)

```bash
# 코드/에이전트/스킬에서 대소문자 혼합 검색
CODE_TARGETS="agents/ skills/ lib/ scripts/ hooks/ templates/ tests/"

echo "=== CMO 참조 ==="
grep -rn "\\bcmo\\b\\|\\bCMO\\b" $CODE_TARGETS 2>/dev/null

echo "=== CFO 참조 ==="
grep -rn "\\bcfo\\b\\|\\bCFO\\b" $CODE_TARGETS 2>/dev/null

echo "=== retrospective-writer 참조 ==="
grep -rn "retrospective-writer" $CODE_TARGETS 2>/dev/null

echo "=== technical-writer 참조 ==="
grep -rn "technical-writer" $CODE_TARGETS 2>/dev/null

echo "=== release-engineer 이전 경로 참조 ==="
grep -rn "agents/cto/release-engineer" $CODE_TARGETS 2>/dev/null
grep -rn "agents/cto/performance-engineer" $CODE_TARGETS 2>/dev/null
```

**기대 결과**: 모든 명령 출력 **0건** (CHANGELOG.md, CLAUDE.md, guide/ 문서의 **역사적 언급은 예외**, 이들은 코드 타겟에 포함 X).

### 2.4 config 잔존 참조 확인
```bash
grep -n "cmo\|cfo" vais.config.json .claude-plugin/plugin.json .claude-plugin/marketplace.json
# → 0건
```

### 2.5 테스트 전 실행
```bash
npm test
```
실패 시:
- 삭제된 파일을 참조하는 테스트가 있음 → 테스트 수정 또는 삭제
- 09 docs/tests sub-plan에서 테스트 최종 정리이지만, 여기서 `npm test` 통과가 막히면 블로커

---

## 3. 예외 처리: 역사적 언급 유지

다음 문서는 "v0.49까지 CMO/CFO 있었음 → v0.50에서 CBO로 통합" 형태로 **유지**:
- `CHANGELOG.md` — v0.49.x 및 이전 엔트리
- `CLAUDE.md` — 변경 이력 섹션 (있다면)
- `AGENTS.md` — Migration notes 섹션
- `guide/*-v2.md` 및 `guide/*-v1.md` — 요구사항/레퍼런스 문서

grep 검증 시 위 경로는 타겟에서 제외된다.

---

## 4. 진입 시 신경 쓸 점

### 4.1 선행에서 보장됨
- 01: CBO 완성 (10 sub + 본체)
- 02: 기존 C-Level 본체에서 제거 대상 sub-agent 참조 제거
- 06: 라우터에서 cmo/cfo 제거
- 07: agent-start.js VALID_SUBAGENTS 갱신

### 4.2 다음으로 넘길 보증
- 삭제 대상 파일/디렉토리 0건 잔존
- grep 검증 결과 0건 (코드 디렉토리)
- `npm test` 통과

### 4.3 함정
- **삭제 순서**: 코드 참조를 먼저 제거(01/02/06/07) → 파일 삭제. 역순이면 import 실패로 테스트 전부 깨짐.
- **macOS `.DS_Store` 잔재**: `agents/cmo/` 삭제 후 `.DS_Store` 파일이 따로 남을 수 있음 → `git rm` 후 수동 정리.
- **skills/vais/phases/cmo.md가 06의 안내 메시지 포함 상태**: 06에서 "v0.50부터 CBO로 통합" 안내를 넣었더라도 이 sub-plan에서 삭제. 안내가 필요하면 CLAUDE.md로 이전.
- **외부 플러그인/사용자 설정 참조**: 사용자의 `.claude/settings.local.json` 등에 cmo/cfo 커스텀 설정 있을 수 있음. 본 sub-plan 범위 아님(사용자 책임). 단 CHANGELOG에 마이그레이션 가이드 명시 필요.
- **CI cache**: 제거된 파일이 CI 캐시에 남아 있을 수 있음 → 09에서 CI 재빌드 확인.

---

## 5. 검증

- [ ] `agents/cmo/` 디렉토리 미존재
- [ ] `agents/cfo/` 디렉토리 미존재
- [ ] `agents/ceo/retrospective-writer.md` 미존재
- [ ] `agents/coo/technical-writer.md` 미존재
- [ ] `agents/cto/release-engineer.md` 미존재
- [ ] `skills/vais/phases/cmo.md`, `cfo.md` 미존재
- [ ] `grep -rn "\\bcmo\\b\\|\\bcfo\\b" agents/ skills/ lib/ scripts/ hooks/ templates/ tests/ vais.config.json` == 0 (단 라인 카운트 또는 모두 exit 1 without match)
- [ ] `grep -rn "retrospective-writer\\|technical-writer" agents/ skills/ lib/ scripts/` == 0
- [ ] `npm test` 통과

연결 SC: **SC-4**

---

## 6. 다음 단계

- **09** Docs & Tests — 문서 4종(CLAUDE/AGENTS/README/CHANGELOG) 최종 동기화 + 테스트 6종 정비
