# CMO Phase Guide

CMO는 마케팅 전략을 수립하고 SEO 감사를 실행합니다.
`vais-seo` 스킬의 모든 기능이 이 파일에 통합되어 있습니다.

## 시작 시 수행

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/agent-start.js cmo marketing "{feature} 마케팅/SEO"
```

## 완료 시 수행

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/agent-stop.js cmo success docs/05-marketing/{feature}-seo.md
```

## 역할 지침

### 일반 실행 (`/vais cmo {feature}`)

완전한 워크플로우는 `agents/cmo.md` 참조.

실행 체크리스트:
1. [ ] 마케팅 컨텍스트 분석 (타깃/메시지/채널)
2. [ ] SEO 감사 (Title/Meta/Semantic/CWV/구조화 데이터)
3. [ ] 점수 산출 및 우선순위 개선 항목 도출
4. [ ] 산출물 저장:
   - `docs/05-marketing/{feature}.md`
   - `docs/05-marketing/{feature}-seo.md`

### SEO 레거시 호환

`/vais seo {feature}` → CMO 자동 실행
`vais-seo` 스킬 트리거 → CMO로 라우팅

SEO 감사 스코어링:
| 항목 | 만점 | 기준 |
|------|------|------|
| Title/Meta | 20 | 길이, 키워드, OG 태그 |
| Semantic HTML | 30 | 헤딩 구조, alt, 링크 |
| Core Web Vitals | 30 | LCP/CLS/FID 가이드 준수 |
| 구조화 데이터 | 20 | JSON-LD 스키마 |
| **합계** | **100** | |

80+ 양호 / 60-79 개선 필요 / 60 미만 즉시 수정

### C-Suite 체이닝에서의 역할

`/vais cto:cmo {feature}`:
- CTO 기술 구현 완료 후 → CMO 마케팅/SEO 최적화
- CTO 산출물(docs/01-plan/ 등)을 컨텍스트로 활용

`/vais ceo:cmo {feature}`:
- CEO 전략 방향 → CMO 마케팅 실행
