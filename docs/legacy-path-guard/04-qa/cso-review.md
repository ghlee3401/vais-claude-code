# legacy-path-guard — CSO QA Review

> 🛡️ **CSO 독립 검토 문서**: Do 단계 후 Gate A(security) / Gate B(plugin) / Gate C(code review) / skill-validator / compliance 교차 검증.
> 참조: `docs/legacy-path-guard/01-plan/main.md`, `docs/legacy-path-guard/02-design/main.md` (v1.1), `docs/legacy-path-guard/03-do/main.md`

## 최종 판정

**🟢 Pass** — Blocker 1건 검토 중 즉시 수정 완료, Advisory 2건 기록.

| Gate | 판정 | 비고 |
|------|:----:|------|
| A. Security Audit | ✅ PASS | 주요 CWE 없음, command injection 방어 확인 |
| B. Plugin Validator | ✅ PASS | `vais-validate-plugin.js` 오류 0 / 경고 0 |
| C. Independent Code Review | 🟢 PASS (Blocker 해결 후) | Finding #1 즉시 수정 완료 |
| skill-validator | ✅ PASS | skill 변경 없음 |
| compliance-auditor | ✅ PASS | 라이선스/GDPR 영향 없음 |

---

## 🚨 Findings

### Finding #1 [BLOCKER → RESOLVED] — `CLAUDE.md`가 hook 예외 목록에 누락

**발견**: Do 단계에서 CLAUDE.md Rule #13을 추가하면서 본문에 `docs/01-plan/`, `docs/02-design/` 예시가 포함되어 있으나, `.hooks/pre-commit`의 허용 예외 case 문에 **`CLAUDE.md`가 빠져 있음**.

**증거** (CSO 검증 grep):
```text
.hooks/pre-commit:1       ← LEGACY_PATTERN 자체 (hook 본문 자기 예외)
CLAUDE.md:1               ← Rule #13 예시 (예외 목록 없음!)
docs/legacy-path-guard/*  ← 예외 등록됨
...
```

**영향**: 다음에 CLAUDE.md 수정 커밋 시 hook이 **자기 자신의 설명 문구를 차단** → self-blocking dead-lock. 실사용 불가능한 상태.

**수정**: Do 단계 중 발견 즉시 `.hooks/pre-commit`의 예외 case 문에 `CLAUDE.md` 추가 (line 16):
```sh
docs/_legacy/*|CHANGELOG.md|tests/paths.test.js|README.md|CLAUDE.md) continue ;;
```

**상태**: ✅ RESOLVED (CSO 리뷰 중 인라인 수정)

---

### Finding #2 [ADVISORY] — 공백 포함 파일명에서 hook 동작 부정확

**문제**: `.hooks/pre-commit:12`의 `for file in $(git diff --cached --name-only --diff-filter=ACM); do` 패턴은 **word splitting**으로 인해 공백이 포함된 파일명을 올바르게 처리하지 못함. 예: `docs/foo bar/plan/main.md`는 `docs/foo`와 `bar/plan/main.md`로 쪼개짐.

**실무 리스크**: **낮음** — VAIS Code 저장소에 공백 파일명 현재 없음 (검증: `find . -name '* *' | grep -v node_modules` = empty).

**결과적 영향**:
- 예외 매칭 오류 가능 (거짓 통과)
- `git show ":$file"`에서 파일 못 찾아 grep fail but violations 빈 상태 → **위반 누락 방향**. 즉 거짓 음성(false negative), 거짓 양성 아님.

**권장 개선** (향후):
```sh
while IFS= read -r file; do ... done < <(git diff --cached --name-only --diff-filter=ACM)
```
또는 `-z` null-terminator:
```sh
git diff --cached --name-only -z --diff-filter=ACM | while IFS= read -r -d '' file; do ...
```

**현재 조치**: 수정하지 않음 (YAGNI). 공백 파일명 도입 시 재검토. 본 finding 기록으로 재발 방지.

---

### Finding #3 [ADVISORY] — `--no-verify` 기술적 우회 가능성

**문제**: 모든 git pre-commit hook은 `git commit --no-verify`로 우회 가능. design/do에서 "금지" 문구화했으나 강제 불가.

**현 대응**:
- CLAUDE.md Rule #13: "`--no-verify` 사용은 금지"
- README Developer Setup: "`--no-verify`로 hook을 우회하지 마세요" 경고
- 사용자 메모리 "Always use /vais commit" 규칙과 일관

**진짜 강제 수단**:
- CI guard (`ci-bootstrap` 피처, 범위 밖)
- 서버 사이드 pre-receive hook (GitHub/GitLab 별도 구성)

**현 단계 판정**: Acceptable — 본 피처는 개발자 환경 guard이고, CI 구축은 후속 피처로 명확히 분리됨.

---

## ✅ Security Audit 상세 (Gate A)

### Command Injection 검토

| 위치 | 패턴 | 위험도 | 판정 |
|------|------|:------:|:----:|
| `git show ":$file"` | `$file`을 double-quote 안 | 낮음 | ✅ 안전 — word splitting 방지, 파일명은 git 내부 출처 |
| `grep -nE "$LEGACY_PATTERN"` | hardcoded 상수 | 없음 | ✅ 안전 |
| `case "$file" in ...` | glob 매칭 | 없음 | ✅ 안전 — shell이 pattern 해석만, 실행 안 함 |
| `git diff --cached --name-only` | 고정 명령 | 없음 | ✅ 안전 |
| `printf '%s\n' "$violations"` | variable을 %s로 | 없음 | ✅ 안전 (format string injection 없음) |

### OWASP Top 10 매핑

| # | 항목 | 상태 | 비고 |
|---|------|:----:|------|
| A01 | Broken Access Control | N/A | 인증/권한 경로 없음 |
| A02 | Cryptographic Failures | N/A | 암호화 없음 |
| A03 | Injection | ✅ | Shell/Command injection 방어 확인 |
| A04 | Insecure Design | ✅ | 4-Layer 방어 체계 적절 |
| A05 | Security Misconfiguration | ✅ | 기본 설정이 opt-in (실수 최소화) |
| A06 | Vulnerable Components | ✅ | 의존성 0 신규 |
| A07 | Auth Failures | N/A | — |
| A08 | Data Integrity Failures | ✅ | staged 내용 직접 검사 (git show) |
| A09 | Logging Failures | ✅ | stderr 출력, 메시지 명확 |
| A10 | SSRF | N/A | — |

---

## ✅ Plugin Validator (Gate B)

```
✅ 검증 통과 — 플러그인/마켓플레이스 배포 준비 완료
📊 오류: 0 | 경고: 0 | 정보: 8
```

`.hooks/pre-commit` 수정은 플러그인 배포 구조에 영향 없음 (개발자 환경 hook, 플러그인 런타임 아님).

---

## ✅ Test Regression (Do 단계 검증 재확인)

```
# tests 178 / pass 175 / fail 0 / skipped 3 / duration 754ms
```

`docs-structure-redesign`(v0.52.1) 완료 시점과 동일. hook 추가로 인한 테스트 회귀 없음.

---

## 📊 잔존 레거시 패턴 검증 (교차 확인)

`git grep 'docs/[0-9][0-9]-'` 결과 13개 파일, 59 occurrences 모두 **hook 예외 목록에 포함되어 있음**:

| 파일 그룹 | occurrences | hook case 매칭 |
|-----------|:-----------:|:--------------:|
| `.hooks/pre-commit` | 1 | ✅ `.hooks/pre-commit` |
| `CLAUDE.md` | 1 | ✅ `CLAUDE.md` (Finding #1 수정 후) |
| `README.md` | 1 | ✅ `README.md` |
| `CHANGELOG.md` | 20 | ✅ `CHANGELOG.md` |
| `tests/paths.test.js` | 1 | ✅ `tests/paths.test.js` |
| `docs/legacy-path-guard/*.md` | 6 | ✅ `docs/legacy-path-guard/*` |
| `docs/docs-structure-redesign/*.md` | 29 | ✅ `docs/docs-structure-redesign/*` |

**검증**: 13개 중 13개 → 예외 매칭 **100%**. 잔존 패턴 중 hook을 trigger할 파일 0건.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-17 | 초기 작성 — Gate A/B/C + skill + compliance 교차 검증. Blocker #1(CLAUDE.md 예외 누락) 즉시 RESOLVED, Advisory #2-#3 기록. 최종 판정 Pass |
