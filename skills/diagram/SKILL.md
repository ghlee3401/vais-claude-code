---
name: diagram
description: >
  VAIS 다이어그램 스킬. 흐름도·유저 저니·스윔레인·시퀀스·상태 기계·구조도·상위 구조·데이터 흐름·ER·타임라인·트리
  11종을 외부 의존성 없는 HTML + 인라인 SVG 한 파일로 그리고, 요청 시 SVG·PNG 로 내보낸다.
  Use when the user asks for a diagram, flowchart, user flow, sequence, state, architecture, ER, timeline, tree,
  다이어그램, 흐름도, 유저 플로우, 시퀀스, 구조도, 화면 흐름, or invokes `/vais diagram <요청>`;
  also for the VAIS 3단계(화면 정의서) 흐름도와 9단계(기술 구조) 구조 안.
license: MIT
metadata:
  origin: "cathrynlavery/diagram-design main@9874ad7 (2026-09-17, MIT, 수정본)"
---

# Diagram — VAIS 다이어그램

> 원본: cathrynlavery/diagram-design main@9874ad73813715fc36875e45afd9cd94c68f3c3f `skills/diagram-design/SKILL.md` (MIT, 2026-09-17 가져와 수정). 원본의 브랜드 온보딩·가져오기(draw.io 등)·검증 스크립트 절은 뺐고, 저장 위치와 PNG 내보내기는 VAIS runtime 으로 바꿨다. 라이선스는 `LICENSE`.

그림은 **자기완결 HTML 한 파일**(인라인 SVG + CSS, 외부 의존성은 Google Fonts 링크뿐)로 만든다. 유형 11종. 유형별 세부는 `references/` 를 그 유형을 고른 뒤에만 읽는다.

---

## 1. 철학

**가장 좋은 손질은 대개 지우는 것이다.**

- 노드 하나는 생각 하나. 항상 같이 다니는 두 노드는 한 노드다.
- 선 하나는 정보 하나. 배치로 관계가 보이면 선을 지운다.
- 코랄(강조색)은 **편집자의 표시**지 깃발이 아니다. 그림당 1~2개. 다섯 개에 쓰면 신호가 사라진다.
- 다 넣었을 때가 아니라 더 뺄 게 없을 때 끝난다.

**목표 밀도 4/10.** 기술적으로 완전하되 설명서가 필요하지 않을 만큼. 노드 9개를 넘으면 그림 두 장이다.

## 2. 언제 쓰나

독자가 글·표·목록보다 그림에서 더 많이 배울 때만. 쓰지 않는 경우: 목록(표·불릿), 단순 전후 비교(표), 도형 하나짜리(문장). 그리기 전에 묻는다: *잘 쓴 문단보다 이 그림이 낫나?* 아니면 그리지 않는다.

## 3. 유형 고르기

행동·상태·규칙·위험이 뜻을 나르면 먼저 `references/semantic-patterns.md` 를 읽고 의미 패턴 하나를 고른 뒤, 가장 가까운 유형을 배치 문법으로 쓴다. 패턴이 없으면 유형을 바로 고른다.

| 보이려는 것 | 유형 | 참조 |
|---|---|---|
| 분기가 있는 결정 논리, 화면 흐름 (VAIS 3단계) | **Flowchart 흐름도** | [type-flowchart.md](references/type-flowchart.md) |
| 한 사람이 단계마다 하는 일과 느낌 | **User journey 유저 저니** | [type-journey.md](references/type-journey.md) |
| 역할 간 handoff 가 있는 절차 | **Swimlane 스윔레인** | [type-swimlane.md](references/type-swimlane.md) |
| 시간순 메시지 (요청·응답, VAIS 8단계 API) | **Sequence 시퀀스** | [type-sequence.md](references/type-sequence.md) |
| 상태 + 전이 + 조건 | **State machine 상태 기계** | [type-state.md](references/type-state.md) |
| 구성 요소 + 연결 (VAIS 9단계 구조 안) | **Architecture 구조도** | [type-architecture.md](references/type-architecture.md) |
| 단계 배너가 있는 데이터 스택 전체 | **High-level 상위 구조** | [type-high-level.md](references/type-high-level.md) |
| 역할별로 누가 어느 단계에서 무엇을 다루나 | **Data flow 데이터 흐름** | [type-data-flow.md](references/type-data-flow.md) |
| 엔티티 + 항목 + 관계 (VAIS 7단계 데이터) | **ER 데이터 모델** | [type-er.md](references/type-er.md) |
| 시간 위의 사건 | **Timeline 타임라인** | [type-timeline.md](references/type-timeline.md) |
| 부모 → 자식 (분해도·조직·파일) | **Tree 트리** | [type-tree.md](references/type-tree.md) |

이 11종 밖(사분면·레이더·간트·칸반·Sankey·Wardley 등)을 요청받으면 "지원 목록은 위 11종" 이라 말하고 가장 가까운 유형을 제안한다. 표 3열로 같은 내용을 전할 수 있으면 표를 쓴다. 두 유형이 다 맞으면 지배적인 축 하나를 고른다. 복잡도 예산(§7)을 넘으면 개요 + 상세 두 장으로 나눈다.

**고른 유형의 참조 파일을 반드시 읽고 그린다.** 패턴을 골랐으면 `semantic-patterns.md` 도.

**그리기 전 확인.** 유형(·패턴), 크기, 예산 때문에 뺄 것을 한 문장으로 말한다. 사용자가 답할 수 있으면 그 뒤에 그리고, 아니면 가정을 결과 옆에 적는다. 요청이 유형·크기·내용을 이미 다 정했으면 건너뛴다.

## 4. 공통 안티패턴

| 안티패턴 | 왜 실패하나 |
|---|---|
| 다크 모드 + 시안·보라 글로우 | 결정 없이 "기술적" 으로 보이려는 것 |
| 모노 글꼴을 "개발자 느낌" 으로 전체에 | 모노는 포트·명령·URL 같은 *기술 내용* 전용. 이름은 Geist sans |
| 모든 노드가 같은 상자 | 위계가 사라짐 |
| 범례가 그림 안에 떠 있음 | 노드와 충돌 |
| 마스크 없는 화살표 라벨 | 선이 글자 사이로 비침 |
| 세로 `writing-mode` 글자 | 못 읽음 |
| 같은 폭 요약 카드 3개 | 그냥 그리드. 폭을 다르게 |
| 그림자 | 그림자 금지, 테두리 사용 |
| 큰 둥근 모서리 | 반지름 최대 6~10px |
| "중요한" 노드마다 코랄 | 코랄은 1~2개 편집 강조 |
| Mermaid 렌더러 배치 흉내 | 자동 간격을 베끼는 것, 편집 배치가 아님 |
| §6 연결선 규칙 6개 중 하나라도 위반 | 대각선, 선에 붙은 라벨, 다음 노드에 잘린 마스크, 겹친 선, 같은 접점, 남의 상자 뒤 통과는 자동 실패 |

## 5. 디자인 시스템

색·글꼴·토큰의 정본은 `references/style-guide.md` 하나다. 아래는 요약.

| 역할 | 용도 | 기본(light) |
|---|---|---|
| `paper`, `paper-2` | 페이지·컨테이너 배경 | `#f5f5f5`, `#ececec` |
| `ink` | 기본 글자·선 | `#2d3142` |
| `muted`, `soft` | 보조 글자, 기본 화살표, 부라벨 | `#4f5d75`, `#7a8399` |
| `rule`, `rule-solid` | 헤어라인 | `rgba(45,49,66,0.12)`, `#bfc0c0` |
| `accent`, `accent-tint` | 그림당 1~2개 강조 | `#eb6c36`, `rgba(235,108,54,0.08)` |
| `link` | HTTP/API 호출, 외부 화살표 | `#2e5aa8` |

**강조 규칙:** `accent` 는 최대 2개. 나머지는 `ink`/`muted`/`soft`. 네 개를 강조하고 싶다면 아직 초점을 못 정한 것이다.

노드 유형 → 처리: **Focal**(1~2) `accent-tint`/`accent` · **Backend/API/Step** white/`ink` · **Store** `ink@0.05`/`muted` · **External** `ink@0.03`/`ink@0.30` · **Input/User** `muted@0.10`/`soft` · **Optional/Async** `ink@0.02`/`ink@0.20` dashed `4,3` · **Security/Boundary** `accent@0.05`/`accent@0.50` dashed `4,4`.

타이포: 제목 Instrument Serif 1.75rem 400 · 노드 이름 Geist 12px 600 · 부라벨 Geist Mono 9px · 아이브로/태그 Geist Mono 7~8px 대문자 tracked · 화살표 라벨 Geist Mono 8px · 편집 코멘트 Instrument Serif *italic* 14px. **모노는 기술 내용에만.** 한국어 라벨 규칙(글꼴 확장, 12px 바닥, 폭 계산)은 style-guide 의 "Korean labels" 절을 따른다.

```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500;600&family=Noto+Serif:ital@0;1&family=Noto+Sans+KR:wght@400;500;600&family=Noto+Serif+KR:wght@400&display=swap" rel="stylesheet">
```

오프라인이면 스택의 로컬 대체 글꼴로 그려진다. 문제없다.

## 6. SVG 기본 요소

**배경:** `paper` 로 채운 `<rect>` 하나. 그림을 다른 컨테이너 배경으로 감싸지 않는다. 점 무늬는 긴 글 속 hero 그림에서만 선택.

**화살표 마커 (셋 다 항상 정의):**

```svg
<marker id="arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#4f5d75"/></marker>
<marker id="arrow-accent" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#eb6c36"/></marker>
<marker id="arrow-link" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#2e5aa8"/></marker>
```

기본 `#4f5d75` 내부·일반 · 강조 `#eb6c36` 주 흐름 · 링크 `#2e5aa8` HTTP/API·외부 · 점선 `stroke-dasharray="5,4"` 선택·수동·응답·비동기. **상자보다 화살표를 먼저 그려** 선이 뒤로 가게 한다.

**연결선 규칙 6 (타협 없음):**

1. **둥근 직각(orthogonal) 연결선만.** x 나 y 가 같지 않은 두 노드 사이에 대각선 `<line>` 금지. 꺾임은 `r=8`(좁으면 `r=6`) 사분원. 공식은 `type-architecture.md`. 대각선은 자동 실패.
2. **라벨과 선 사이 6~10px 간격.** 라벨 마스크의 아래쪽과 선 사이에 보이는 틈. 마스크가 선에 닿으면 실패.
3. **선끼리 겹치지 않는다.** 같은 경로·평행 겹침 금지. 직교 교차는 bridge/hop(`type-architecture.md`), 나란히 갈 땐 ≥12px 띄운다. 겹치면 배치를 다시 한다.
4. **같은 변에 여러 선이면 접점을 나눈다.** 변 길이 L 에 N 개면 k 번째 접점은 `L·k/(N+1)`. 접점 간 ≥12px(아주 작은 상자 8px). 두 선이 같은 방향이면 끝까지 ≥12px.
5. **출발·도착이 아닌 상자 뒤를 지나지 않는다.** 우회가 기본. 가로지르는 상자(바닥 서비스 바 등)가 유일한 직선 경로에 있을 때만 예외: 점선(`4,3`), 라벨은 보이는 끝쪽, 화살촉은 진짜 도착점에만.
6. **라벨 마스크가 뒤에 그려지는 노드와 겹치지 않는다.** 노드는 라벨 뒤에 칠해지므로 겹치면 글자가 잘린다. 열린 캔버스 구간에 라벨을 둔다. 노드 안에 완전히 든 마스크는 배지라 괜찮다.

**노드 박스 (전체 패턴):**

```svg
<rect x="X" y="Y" width="W" height="H" rx="6" fill="#f5f5f5"/>                       <!-- 1 불투명 마스크 -->
<rect x="X" y="Y" width="W" height="H" rx="6" fill="FILL" stroke="STROKE" stroke-width="1"/>  <!-- 2 상자 -->
<rect x="X+8" y="Y+6" width="28" height="12" rx="2" fill="transparent" stroke="STROKE@0.40" stroke-width="0.8"/>  <!-- 3 유형 태그 (rx=2) -->
<text x="X+22" y="Y+15" fill="STROKE@0.8" font-size="7" font-family="'Geist Mono', monospace" text-anchor="middle" letter-spacing="0.08em">API</text>
<text x="CX" y="CY+2" fill="#2d3142" font-size="12" font-weight="600" font-family="'Geist', 'Noto Sans KR', sans-serif" text-anchor="middle">노드 이름</text>  <!-- 4 -->
<text x="CX" y="CY+18" fill="#4f5d75" font-size="9" font-family="'Geist Mono', monospace" text-anchor="middle">tech:port</text>  <!-- 5 -->
```

**화살표 라벨 — 항상 마스크, 항상 간격:**

```svg
<rect x="MID_X-18" y="ARROW_Y-20" width="36" height="12" rx="2" fill="#f5f5f5"/>
<text x="MID_X" y="ARROW_Y-11" fill="#7a8399" font-size="8" font-family="'Geist Mono', monospace" text-anchor="middle" letter-spacing="0.06em">WRITE</text>
```

≤14자 대문자, 구간 중앙. 세로 구간은 선 옆에 같은 간격으로. 한국어 라벨은 12px sans 500, 마스크 16px 높이.

**범례 — 맨 아래 가로 띠.** 그림 안에 두지 않는다. 헤어라인으로 나누고 항목은 ~160px 간격, `viewBox` 높이를 ~60px 늘린다.

## 7. 배치와 간격

**4px 그리드:** 노드 원점·폭·높이·간격·패딩은 4 의 배수. 글자 크기·반지름·데이터 좌표·`.5` 보정은 예외.

| 항목 | 허용값 |
|---|---|
| 노드 폭/높이 | 80, 96, 112, 120, 128, 140, 144, 160, 180, 200, 240, 320 |
| 노드 간격 | 20, 24, 32, 40, 48 |
| 상자 안 패딩 | 8, 12, 16 |
| 모서리 반지름 | 4, 6, 8 |

**복잡도 예산 (그림당):** 노드 9 · 화살표/전이 12 · 코랄 2 · 시퀀스 lifeline 5, fragment 1(둘이면 각각 단일 `opt`/`loop`), `alt` 영역 2, 중첩 1 · 스윔레인 lane 5 · ER 엔티티 8 · 트리 깊이 4 · 유저 저니 단계 6 / 행 3 / pain 2 · 데이터 흐름 lane 4 / 단계 6 · 코멘트 callout 2. 넘으면 개요 + 상세로 나눈다.

**페이지 구성:** 1 헤더(아이브로 mono, 제목 serif, 부제 sans muted) · 2 그림(기본은 테두리·배경 없이 종이 위에 바로. 카드형 hero 만 `paper-2` 배경 + 1px `rule` 테두리 + 8px 반지름) · 3 요약 카드 2~3열(폭을 다르게, `1.1fr 1fr 0.9fr`) · 4 푸터(mono muted, 헤어라인). 요약 카드는 `#fff` 배경, `1px solid rgba(45,49,66,0.12)`, 반지름 6px, 그림자 없음, 7px 점(ink/muted/coral/link/soft).

## 8. 출력 전 점검표

**유형:** 행동이 중요하면 의미 패턴을 먼저 골랐나 · 유형이 맞나 · 그리기 전 계획을 말했나 · 표/문단이 더 낫진 않나 · 참조 파일을 읽었나.
**빼기:** 지울 노드·합칠 노드·지울 화살표·지울 라벨은 없나.
**신호:** 코랄 ≤2 · 범례가 쓰인 유형만 정확히 담나 · 예산 안인가.
**기술:** `<svg>` 에 `role="img"` 와 `aria-labelledby` · `<title>` 이 `<defs>` 앞 첫 자식이고 `<desc>` 채움 · ID 는 `<slug>-title`/`<slug>-desc` · 화살표를 상자보다 먼저 · 대각선 없음 · 라벨 간격 6~10px · 선 겹침 없음 · 같은 변 접점 분리 · 남의 상자 뒤 통과 없음 · 라벨 마스크가 노드에 안 잘림 · 라벨마다 `#f5f5f5` 마스크 · 범례는 바닥 띠 · 세로 글자 없음 · `viewBox` 에 범례 높이 · 4px 그리드.
**타이포:** 이름은 Geist sans · 기술 부라벨은 Geist Mono · 제목은 Instrument Serif · 한국어는 Noto Sans KR 확장 · 다른 모노 글꼴 없음.

## 9. 템플릿과 만드는 순서

| 변형 | 파일 | 언제 |
|---|---|---|
| **Minimal light** (기본) | `assets/template.html`, `assets/example-<type>.html` | 스크린샷·문서 삽입용. 그림 + 제목 |
| **Minimal dark** | `assets/template-dark.html` | 다크 사이트·슬라이드 |

1. `assets/template.html`(다크면 `template-dark.html`)을 복사한다.
2. 행동이 중요하면 의미 패턴을 고르고, 유형 참조를 읽는다. 같은 유형의 `example-*.html` 이 있으면 구조를 참고한다(예제는 옛 스킨이라 색은 style-guide 를 따른다).
3. 아이브로·h1·SVG 본문을 바꾼다. `[diagram-slug]` 를 파일 slug 로, `<title>`/`<desc>` 를 채운다.
4. §8 점검표를 돈다.

## 10. 저장 위치 — VAIS 와의 연결

이 스킬은 VAIS 하네스 안에서 돈다. 파일은 **hook 이 그 턴에 허용한 write scope 안**에만 쓴다.

| 상황 | 저장 위치 | 어떻게 켜지나 |
|---|---|---|
| 독립 요청 `/vais diagram <요청>` | `docs/diagrams/<slug>.html` (`vais.config.json > diagrams.dir` 로 변경) | runtime 이 그 폴더를 write scope 에 넣는다 |
| `/vais` 없이 "그려줘" | 저장 불가 | 그리지 말고 `/vais diagram <요청>` 을 안내한다 (write guard 가 막는다) |
| 3단계 화면 정의서 Design ("흐름도 2~3안") | `docs/work-items/…/02-design/options/N/flow.html` | 안마다 한 파일, `screens capture` 로 PNG 를 찍어 응답에 보인다 |
| 3단계 Do (흐름 파일) | `docs/product/flows/S-001.html` | `do ready` 가 PNG 를 렌더한다. `.mmd` 도 여전히 허용 |
| 9단계 구조 안 · 7단계 데이터 · 8단계 API | 그 Work item 의 `02-design/options/N/` 또는 정본 산출물 폴더 | 위와 같음 |

slug 는 소문자 kebab-case(`signup-flow`). 그림을 만든 뒤에는 **말로 설명하지 말고 PNG 를 Read 로 열어 응답에 보인다**(CLAUDE 규칙 10-5). 하나의 그림에 파일 하나. 요청에 없는 내보내기 파일을 만들지 않는다.

## 11. 출력과 내보내기

항상 자기완결 `.html` 한 파일: 내장 CSS(외부는 Google Fonts 만), 인라인 SVG(외부 이미지 없음), 정적(애니메이션 없음).

**접근성 계약:** `<svg role="img" aria-labelledby="<slug>-title <slug>-desc">`; `<title>` 은 `<defs>` 앞 첫 자식, 60자 이하의 제목; `<desc>` 는 그림이 무엇을 보이는지 한 문장(내용을, 도형을 말하지 않는다). `title`/`desc` 같은 맨 ID 금지.

**SVG·PNG 내보내기:** 사용자가 요청할 때만. runtime 명령 하나로 같은 폴더에 만든다.

```
node "<plugin>/scripts/vais-workflow-v2.js" diagram export --session <session> --file docs/diagrams/signup-flow.html --svg --png
```

`--svg` 는 HTML 의 첫 `<svg>` 를 꺼내 글꼴 `@import` 를 넣은 독립 파일, `--png` 는 설치된 Chrome 으로 찍은 그림이다(Chrome 이 없으면 PNG 만 빠지고 설치 안내가 나온다). 파일은 그 턴의 write scope 안에 있어야 한다. 카드·헤더 같은 편집 장식은 내보내기에 들어가지 않는다.
