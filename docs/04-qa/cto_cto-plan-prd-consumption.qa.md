# cto-plan-prd-consumption - QA 분석

> 참조: plan v1.1, design v1.1, do v1.0
> 검증 방식: 정적 grep + 플러그인 validator + JSON syntax + 파일 트리 회귀

## 종합 일치율: 100% (8/8 SC + 4/4 Gate)

| 검증 축 | 일치율 | 상태 |
|---------|--------|------|
| 구조 (Structural) | 100% | ✅ |
| 기능 (Functional) | 100% | ✅ |
| 계약 (Contract) | 100% | ✅ |
| 빌드/Validator | PASS | ✅ |

## Success Criteria 평가

| ID | 기준 | 상태 | 근거 |
|----|------|------|------|
| SC-01 | PRD 존재+완성 시 CP-0 생략, plan 0.7에 PRD 경로 자동 기재 | ✅ Met | `agents/cto/cto.md:248-251` 정책 매트릭스 `full→자동 로드`, plan.template `0.7 PRD 입력` 섹션 신설 |
| SC-02 | PRD 부재 시 CP-0가 4 옵션과 함께 발동 | ✅ Met | `agents/cto/cto.md:204-253` CP-0 섹션 + 4 옵션 (A/B/C/D) 명시. grep "A. CPO 먼저" + 3개 매칭 |
| SC-03 | CP-0 A 옵션 시 CTO 종료, CPO 안내 | ✅ Met | `cto.md:246` "A → 즉시 종료, '다음: /vais cpo …' 안내" 분기 명시 |
| SC-04 | CP-0 B 옵션 시 강행 모드, 0.7에 표시 | ✅ Met | `cto.md:247` B 분기 + plan.template 0.7 "강행 모드 사유" 섹션 |
| SC-05 | requirePrd=skip 시 CP-0 미발동 | ✅ Met | `cto.md:223-226` 정책 매트릭스에 `skip → 자동 로드/강행` 명시. config 기본값 검증: `requirePrd: ask` |
| SC-06 | 기존 plan 문서를 가진 피처는 영향 없음 | ✅ Met | 기존 8개 plan 문서 보존, template 변경은 신규 생성에만 영향. `gates.cto.plan` 키 부재 시 기본값 사용 명시 |
| SC-07 (NEW) | CP-D 호출 시 AskUserQuestion 도구 호출 흔적 | ✅ Met | `cto.md` 7회 "AskUserQuestion 도구를 호출" 문구. 최우선 규칙(F9) + 모든 CP 섹션 말미에 강제 |
| SC-08 (NEW) | CP 출력 표가 마크다운 펜스 밖 렌더링 | ✅ Met | CP-1/D/G/2/Q 5개 템플릿 모두 ` ``` ` 펜스 밖으로 분리. awk 검출 7건은 Interface Contract 마크다운 예시 블록(L543-551)으로 CP 출력이 아닌 IC 파일 형식 문서화 — 위반 아님 |

## Gate 판정

| Gate | 항목 | 상태 |
|------|------|------|
| Gate 1 (Plan) | 데이터 모델 정의 (PRDCheckResult), 기술 스택 선정, YAGNI 검증 | ✅ |
| Gate 2 (Design) | 컴포넌트 명세, IC 정의, 정책 매트릭스 | ✅ |
| Gate 3 (Architect) | config 스키마 정의 + JSON 빌드 검증 | ✅ |
| Gate 4 (Do) | 빌드/validator 통과, 모든 변경 파일 일치 | ✅ |

## 정적 검증 결과

| 검증 | 결과 |
|------|------|
| `node scripts/vais-validate-plugin.js` | ✅ 오류 0 / 경고 0 |
| `JSON.parse(vais.config.json)` | ✅ syntax OK |
| `gates.cto.plan.requirePrd` 값 | `"ask"` ✅ |
| `gates.cto.plan.completenessThreshold` 값 | `6` ✅ |
| `agents/cto/cto.md` CP 섹션 카운트 | CP-0/1/D/G/2/Q (6개) ✅ |
| `agents/cto/cto.md` "AskUserQuestion 도구를 호출" 매칭 | 7회 ✅ |
| `templates/plan.template.md` "0.7 PRD 입력" 매칭 | 1회 ✅ |
| `agents/cpo/cpo.md` "vais cto plan" 매칭 | 1회 ✅ |
| `docs/01-plan/*.plan.md` 기존 문서 손상 여부 | 8개 모두 보존 ✅ |

## 발견 이슈

| 심각도 | # | 이슈 | 파일:라인 | 권장 조치 |
|--------|---|------|----------|----------|
| 🟢 None | - | - | - | - |

**Critical 0건 / Important 0건 / Trivial 0건**

## 잠재적 후속 검증 (런타임 검증 필요)

본 QA는 정적 검증만 수행. 런타임 동작은 다음 방식으로만 검증 가능:

| 검증 | 방법 |
|------|------|
| CP-0 실제 발동 | 다음 신규 피처 `/vais cto plan {feature}` 실행 시 관찰 (dogfooding) |
| AskUserQuestion 실제 호출 | 다음 신규 피처 plan 진행 시 CP-1/D 발동 관찰 |
| CP 출력 표 렌더링 | 다음 응답에서 사용자 시각 확인 |

→ Report 단계에서 dogfooding 안내 권장.

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-07 | 초기 작성 — SC-01~08 모두 통과 |
