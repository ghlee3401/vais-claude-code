# Threat Model Template (CSO)

Plan/Design phase 에서 위협 모델 작성 시 사용. STRIDE 기반.

## STRIDE

| 약어 | 위협 유형 | 대응 보안 속성 |
|------|----------|--------------|
| S | Spoofing (사칭) | Authentication |
| T | Tampering (변조) | Integrity |
| R | Repudiation (부인) | Non-repudiation |
| I | Information Disclosure (정보 유출) | Confidentiality |
| D | Denial of Service | Availability |
| E | Elevation of Privilege | Authorization |

## Threat Model 작성 단계

1. **자산 식별** — 보호 대상 (data / services / accounts)
2. **신뢰 경계 식별** — internal / external / 3rd-party 경계
3. **데이터 흐름도** — Mermaid 또는 다이어그램으로 entry/exit
4. **STRIDE 매트릭스** — 각 자산 × 6 위협 = 위험 평가
5. **완화책** — 각 위협별 mitigation 매핑

## 매트릭스 형식

```
| 자산 | S | T | R | I | D | E | Critical? |
|------|---|---|---|---|---|---|-----------|
| user_session | High | Med | Low | High | Med | High | ✓ |
```

## 우선순위

- **Critical** — High × 2 이상 → 즉시 mitigation
- **Important** — High × 1 또는 Med × 3+ → MVP 후 처리
- **Info** — Low/Med 단일 → 모니터링만

## artifact 박제

`docs/{feature}/02-design/threat-model.md` (frontmatter: `owner: cso`, `agent: security-auditor`, `artifact: threat-model`)
