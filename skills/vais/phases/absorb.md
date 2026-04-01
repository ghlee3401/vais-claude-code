---
name: absorb
description: 외부 레퍼런스 평가 및 흡수. AbsorbEvaluator를 사용한 품질/적합성 판정.
---

# /vais absorb — Reference Absorption

외부 레퍼런스를 평가하고 vais에 흡수합니다.
AbsorbEvaluator (lib/absorb-evaluator.js)를 사용한 지각 있는 흡수 시스템입니다.

## 사용법

```bash
/vais absorb {path}                   # 단일 파일 또는 디렉토리
/vais absorb --history                # 흡수 이력 조회
/vais absorb --history --filter=rejected  # 거부된 항목만
```

예시:
```bash
/vais absorb ../bkit/skills/gap-detector.md
/vais absorb ../bkit/skills/
/vais absorb ../some-reference-repo/
```

## 실행 순서 (단독 `/vais absorb {path}`)

> CEO 없이 CTO(또는 사용자)가 직접 평가합니다.

1. **AbsorbEvaluator.evaluate(path) 실행**

   ```javascript
   import { AbsorbEvaluator } from '${CLAUDE_PLUGIN_ROOT}/lib/absorb-evaluator.js'
   const evaluator = new AbsorbEvaluator()
   const result = evaluator.evaluate(path)
   ```

2. **평가 결과 출력**

   ```
   📊 흡수 평가 결과
   ─────────────────────────────
   소스: {path}
   판정: ✅ absorb / ⚠️ merge / ❌ reject
   이유: {reason}
   
   품질 점수: {qualityScore}/100
   - {reason1}
   - {reason2}
   
   적합성: {fitScore}/100
   - 권장 레이어: {suggestedLayer}
   
   기존 겹침: {overlapping.length}개 파일
   - {file1}
   - {file2}
   ─────────────────────────────
   ```

3. **사용자 확인** (AskUserQuestion)

   | 판정 | 선택지 |
   |------|--------|
   | absorb | "흡수 실행", "거부", "나중에" |
   | merge | "병합 방향 지시 후 실행", "거부", "나중에" |
   | reject | "확인" (자동 거부 기록) |

4. **실행 + Ledger 기록**

   흡수 승인 시:
   - 대상 파일을 `skills/vais/phases/` 또는 적합한 Layer에 배치
   - 기존 파일과 병합 필요 시 Edit 도구로 통합
   
   Ledger 기록:
   ```javascript
   evaluator.record({
     action: 'absorbed' | 'rejected' | 'merged',
     source: path,
     target: 'skills/vais/phases/{name}.md',  // absorbed/merged 시
     reason: '...',
     overlap: [...],
     decidedBy: 'user',
   })
   ```

## 이력 조회 (`/vais absorb --history`)

```javascript
import fs from 'fs'
const lines = fs.readFileSync('.vais/absorption-ledger.jsonl', 'utf8')
  .split('\n').filter(Boolean)
  .map(l => JSON.parse(l))
```

출력 형식:
```
📋 흡수 이력
─────────────────────────────
총 {total}건 | 흡수: {absorbed} | 거부: {rejected} | 병합: {merged}

최근 항목:
| 날짜 | 판정 | 소스 | 이유 |
|------|------|------|------|
| ... | ✅ absorbed | ../bkit/gap-detector.md | 품질 양호, CSO에 배치 |
| ... | ❌ rejected | ../old-skill.md | 중복 (cso.md와 90% 겹침) |
```

## 판정 기준

| 조건 | 판정 |
|------|------|
| Ledger에 동일 소스 존재 | ❌ reject (중복) |
| 품질 점수 < 25 | ❌ reject (저품질) |
| 기존 파일과 겹침 > 50% | ⚠️ merge |
| 품질 ≥ 50 + 적합성 ≥ 20 | ✅ absorb |
| 그 외 | ⚠️ merge (조건부) |

## CEO 연동 (`/vais ceo:absorb {path}`)

CEO가 전략 방향을 먼저 판단한 후 CTO에게 AbsorbEvaluator 실행을 위임합니다.
자세한 플로우는 `agents/ceo.md` 참조.

## Ledger 스키마

`.vais/absorption-ledger.jsonl` (append-only):

```jsonl
{"ts":"ISO8601","action":"absorbed","source":"../bkit/gap-detector.md","target":"skills/vais/phases/cso-security.md","reason":"OWASP 체크리스트 추출","overlap":["agents/qa.md"],"decidedBy":"user"}
{"ts":"ISO8601","action":"rejected","source":"../old-skill.md","reason":"중복: cso.md와 90% 겹침","overlap":["agents/cso.md"],"decidedBy":"auto"}
```
