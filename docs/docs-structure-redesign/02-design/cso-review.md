# docs-structure-redesign - CSO Design Review (sub-doc)

> 🛡️ **CSO Gate 판정 문서**: main.md 동급 sub-doc. Do 진입 전 plan+design 교차 검증.
> 참조: `docs/docs-structure-redesign/01-plan/main.md`, `docs/docs-structure-redesign/02-design/main.md`

## 최종 판정

**🟡 Conditional Approval** — Do 진입 전 아래 5개 findings 반영 필요 (Blocker 2건 + Advisory 3건).

| Gate | 판정 | 비고 |
|------|:----:|------|
| A. Security Audit | ✅ PASS | `safePath` / `validateComponent` 미변경. 시크릿 노출 경로 없음. |
| B. Plugin Validator | ✅ PASS | 에이전트/skill frontmatter 미변경. plugin.json 미변경. |
| C. Independent Code Review | 🟡 PASS w/ conditions | Finding #1, #2 해결 필요 |
| skill-validator | ✅ PASS | phases/ideation.md, utils/init.md는 본문만 치환, 프론트매터 unchanged |
| compliance-auditor | ✅ PASS | 라이선스/GDPR 영향 없음 |

---

## 🚨 Findings

### Finding #1 [BLOCKER] — Plan의 Impact Analysis에서 30번째 파일 누락

**문제**: `lib/quality/template-validator.js`가 plan.md §Impact Analysis와 design.md §5.1의 "lib 7개 파일" 목록에 **없음**.

**증거** (`git grep` 수행 결과):
```text
lib/quality/template-validator.js:78: if (filePath.includes('.plan.md') || filePath.includes('01-plan/')) return 'plan';
lib/quality/template-validator.js:79: if (filePath.includes('.design.md') || filePath.includes('02-design/')) return 'design';
lib/quality/template-validator.js:80: if (filePath.includes('.do.md') || filePath.includes('03-do/')) return 'do';
lib/quality/template-validator.js:81: if (filePath.includes('.qa.md') || filePath.includes('04-qa/')) return 'qa';
lib/quality/template-validator.js:82: if (filePath.includes('.report.md') || filePath.includes('05-report/')) return 'report';
```

**영향**: 단순 문자열 주석이 아니라 **phase 추출 런타임 로직**. 새 구조 `docs/{feature}/01-plan/main.md`는 `.plan.md` fallback으로 매치 실패 → phase 식별 불가. 방치 시 template-validator가 새 구조 문서를 검증 대상에서 누락.

**조치**: plan §4.1 표에 #12 행으로 추가, design §5.1 step 3에 포함. 치환 규칙은 `'01-plan/'` → `'/plan/'` (sep 경계 필요).

---

### Finding #2 [BLOCKER] — SC-03 Baseline 가정 오류

**문제**: plan.md SC-03은 "기존 단위 테스트 100% 통과"를 수용 기준으로 명시하나, **현재 baseline 자체가 2개 실패 상태**.

**증거** (`node --test tests/paths.test.js` 실행 결과):
```text
not ok 4 - findDoc은 파일이 있으면 경로 반환 (line 92)
not ok 5 - findDoc에 role 전달 시 해당 role 문서를 찾는다 (line 102)
# tests 10 / pass 8 / fail 2
```

실패 원인: 두 테스트가 레거시 구조(`docs/01-plan/cto_테스트.plan.md`, `docs/03-do/cmo_login.do.md`)를 생성하고 `findDoc`이 찾기를 기대하나, `findDoc`은 이미 피처 중심 경로만 반환 → 매칭 실패. **즉 v0.52.0 커밋 시점부터 회귀 중.**

**영향**: SC-03을 "기존 테스트 100% 통과"로 해석하면 현재 상태부터가 Not Met. QA에서 혼선 발생.

**조치**: SC-03 문구를 **"paths.test.js 리라이트 후 tests/ 전체 100% 통과"** 로 개정. 추가로 baseline 오염 사실을 QA report에 기록.

---

### Finding #3 [ADVISORY] — README.md / CLAUDE.md 치환 범위 구체화 부족

**문제**: plan §4.1 #9 "README.md, vendor/README.md 갱신"이 라인 단위로 특정되지 않음.

**증거** (`git grep` 수행 결과):
```text
CLAUDE.md:29: ├── docs/            # 피처별 산출물 (01-plan ~ 05-report)
README.md:238: 4. `docs/00-ideation/ceo_pricing-strategy.md` 저장 ...
README.md:277: ├── 00-ideation/                       (optional) 아이디어 요약
README.md:278: ├── 01-plan/{role}_{feature}.plan.md   요구사항, 범위, 타임라인
README.md:279: ├── 02-design/{role}_{feature}.design.md   아키텍처, 기술 스택
README.md:280: ├── 03-do/{role}_{feature}.do.md       구현 로그
README.md:281: ├── 04-qa/{role}_{feature}.qa.md       QA 리포트, gap 분석
README.md:282: └── 05-report/{role}_{feature}.report.md   최종 리포트
```

CLAUDE.md도 1개 주석 라인 포함. README.md 구조 설명 블록(line 277-282)은 **6줄 일괄 rewrite** 필요 (단순 치환이 아닌 구조 설명 재작성).

**조치**: design §5.1 step 8에 "README 구조 설명 블록 rewrite" 명시. CLAUDE.md line 29도 치환 대상 추가.

---

### Finding #4 [ADVISORY] — `ideationPath()` grep 검증의 정적 한계

**문제**: design §0에서 "외부 호출자 0개"를 근거로 `ideationPath()` 삭제를 확정했으나, `git grep`은 정적 문자열 검색. 아래 패턴은 감지 불가:
- 동적 속성 접근 (`paths['ideation' + 'Path']`)
- 문자열로 함수명 전달 (`require('./paths').ideationPath`는 잡히나 string reflection은 누락 가능)
- 플러그인 외부(사용자 프로젝트)의 호출

**현 프로젝트 리스크 평가**: 코드베이스 규모(~수천 LOC)와 일관된 스타일을 볼 때 동적 호출 가능성 **매우 낮음**. Blocker는 아님.

**조치**: Do 단계 step 1 실행 후 `node --test tests/` 전수 통과로 간접 검증. 또한 삭제 대신 `@deprecated` 경고 후 다음 minor 릴리즈에서 제거하는 **2-step deprecation** 옵션 기록(채택 여부는 Do에서 판단).

---

### Finding #5 [ADVISORY] — template-validator fallback 리팩터링 기회

**문제**: Finding #1 조치 후에도 `.plan.md | .design.md | .do.md | .qa.md | .report.md` 확장자 fallback은 새 구조 `main.md`와 매치 불가. phase 감지가 경로 segment에만 의존하게 됨.

**리스크**: 낮음 — `docs/{feature}/01-plan/main.md`는 `/plan/` segment로 감지 가능. 다만 fallback 분기가 **dead code**화됨.

**조치**: Do 단계에서 template-validator의 fallback 분기를 제거하거나 주석으로 "새 구조 단독 지원" 명시. **스코프 확장 주의** — 본 피처의 목표는 경로 치환이지 validator 재설계가 아님. 최소 변경.

---

## 📋 Plan/Design 업데이트 요청 사항 요약

Do 진입 전 아래 항목을 plan/design에 반영해야 Blocker 해소:

| # | 대상 문서 | 변경 |
|---|-----------|------|
| 1 | `plan/main.md` §4.1 | #12 행 추가: `lib/quality/template-validator.js` 치환 |
| 2 | `plan/main.md` §Impact Analysis | lib 파일 목록에 `template-validator.js` 추가 (29→30개) |
| 3 | `plan/main.md` SC-03 | "기존 단위 테스트" → "리라이트 후 tests/ 전체" 로 문구 개정 |
| 4 | `plan/main.md` §4.1 #9 | "README 구조 설명 블록(line 277-282) 6줄 rewrite + CLAUDE.md:29 치환" 명시 |
| 5 | `design/main.md` §5.1 step 3 | 대상에 `lib/quality/template-validator.js` 추가 |
| 6 | `design/main.md` §5.1 step 8 | "README 구조 설명 블록 rewrite" 서브태스크 명시 |
| 7 | `design/main.md` §0 | `ideationPath()` 삭제 방식에 "2-step deprecation 옵션(낮은 리스크 대비책)" 참고 기록 |

---

## ✅ 확인된 무위험 항목 (재검증 불요)

- `safePath(base, relative)` 경로 탈출 방지 로직 unchanged
- `validateComponent` 허용 문자 정규식 unchanged (`/^[a-zA-Z0-9가-힣_-]+$/`)
- 에이전트 frontmatter(name/description/type 등) unchanged — plugin-validator 통과 보장
- skill markdown frontmatter unchanged
- 종속성 추가/제거 없음 → CVE/license 영향 0
- 개인정보/시크릿 처리 경로 없음

---

## Runtime Evidence

| 검증 명령 | 결과 | 비고 |
|----------|------|------|
| `node --test tests/paths.test.js` | 8 pass / **2 fail** | Finding #2의 근거 |
| `git grep -n "ideationPath\|00-ideation\|01-plan\|..."` | 레거시 참조 **30+개 파일** | plan의 29개 + template-validator 1개 추가 발견 |
| `grep -c "safePath\|path\.resolve\|validateComponent" lib/paths.js` | 19회 사용 | Gate A 확인용 — 변경 없음 |

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-17 | 초기 작성 — 5 Gate 교차 검증, 2 Blocker(#1 template-validator 누락, #2 SC-03 baseline 오류) + 3 Advisory |
