---
owner: cto
agent: cto-direct
artifact: ux-interface
phase: plan
feature: simplify-non-cto-workflow
generated: 2026-05-02
summary: "AskUserQuestion 클릭 인터페이스 강제. 자연어 명령어 안내 금지. 옵션 2~3개 + 명확/짧음."
---

# UX Interface — AskUserQuestion 클릭 패턴

## 한 줄 요약

모든 사용자 결정은 **AskUserQuestion 도구 클릭**. 자연어 명령어 안내 ("___ 입력하세요") 금지. 옵션 2~3 (4 X), 명확 + 짧음.

## 원칙

| # | 원칙 | 위반 예 |
|---|------|--------|
| 1 | 결정 포인트 = AskUserQuestion 도구 호출 | "다음 명령어 `/vais cto plan ...` 입력하세요" 텍스트 안내 |
| 2 | 옵션 개수 2~3 (4 도 가능하지만 부담 ↑) | 5+ 옵션 |
| 3 | 옵션 라벨 ≤30자 | 긴 설명을 라벨에 |
| 4 | 옵션 description ≤80자 | description 한 단락 |
| 5 | 권장 옵션을 첫 번째 + "(권장)" 표시 | 권장 표시 X 또는 마지막에 |
| 6 | "선택해주세요/결정해주세요" 같은 답변 유도 텍스트 X | "어느 쪽으로 갈까요?" 본문에 적기 |
| 7 | 선택지 텍스트 (`A. ...` `B. ...`) 응답에 직접 출력 X | A/B/C/D 나열 |

## 옵션 카테고리

### Yes/No 결정

```yaml
options:
  - label: "진행 (권장)"
    description: "제안 그대로"
  - label: "수정 필요"
    description: "어떤 부분 수정?"
```

### 분기 결정 (3 분기)

```yaml
options:
  - label: "옵션 A (권장)"
    description: "A 의 의미 ≤80자"
  - label: "옵션 B"
    description: "B 의 의미"
  - label: "다른 방향"
    description: "사용자가 직접 입력"
```

### 다음 단계 결정

```yaml
options:
  - label: "다음 phase 자동 진행"
    description: "CEO 결정대로 design 진입"
  - label: "검토"
    description: "현재 결과 확인 후 결정"
  - label: "종료"
    description: "여기서 멈춤"
```

## 자연어 안내 금지 (정확한 위반 패턴)

❌ 위반:
```
"다음 단계로 가시려면 /vais cto plan {feature} 를 입력하세요."
"plan 단계 진행 원하시면 다음 명령어:"
"여기서 멈추고 싶으면 종료라고 말씀해주세요."
"어떻게 진행할까요? A. 진행 B. 종료"
```

✅ 정확한 패턴:
- 응답 본문에 옵션 나열 X
- AskUserQuestion 도구 호출만으로 옵션 제시
- 옵션 클릭 시 자동 실행 (사용자 명령어 재입력 X)

## 자가 점검 체크리스트 (응답 송신 전)

응답에 다음 중 하나라도 있으면 즉시 멈추고 AskUserQuestion 호출:
- [ ] "선택해주세요" / "결정해주세요" / "진행할까요" / "어떻게" 류 문구
- [ ] 줄 시작 `A.` / `B.` / `C.` / `D.` 옵션 나열
- [ ] "/vais ___ 입력하세요" 자연어 명령어 안내
- [ ] "원하시면 ___ 라고 말씀" 류 안내
- [ ] 완료 아웃로의 "다음 단계" 블록 아래 텍스트 옵션

## SKILL.md 의 기존 규칙 재확인

`skills/vais/SKILL.md` 의 "🚨 최우선 공통 규칙: AskUserQuestion 강제" 절은 **그대로 유지**. 본 spec 은 그 규칙의 재확인 + 자세한 패턴 가이드.

## 효과

| 차원 | 자연어 안내 | AskUserQuestion 클릭 |
|------|-----------|--------------------|
| 사용자 액션 | 키보드 입력 (15~30 자) | 클릭 1번 |
| 명령어 외우기 | 필요 (`/vais cto plan ...`) | 불필요 |
| 오타 가능성 | 있음 | 없음 |
| UX 효율 | 낮음 | **압도적 우위** |

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-05-02 | AskUserQuestion 강제 패턴. 7 원칙 + 옵션 카테고리 3 + 자가 점검 체크리스트. SKILL.md 기존 규칙 재확인. |
