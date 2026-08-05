---
# 이 파일의 책임: /vais brief --deck 의 VARCO 슬라이드 양식 규칙 — 레이아웃·토큰·16장 카탈로그·내용 규칙.
---

# VARCO 과제 보고 양식 (덱)


## 이 스킬이 하는 일

`template/deck.html` 은 16장짜리 **빈 양식 덱**이다. 새 보고서를 만들 때
이 파일을 **복사해서** 내용만 채운다. 양식을 새로 그리지 않는다.

```
cp -r skills/brief/template <작업 폴더>/<보고서명>
# 그 안의 deck.html 을 편집한다 (assets/, deck-stage.js, image-slot.js 는 그대로 둔다)
```

브라우저로 `deck.html` 을 열면 바로 발표 모드다. 좌우 화살표로 넘기고,
브라우저 인쇄(Cmd/Ctrl+P)로 슬라이드 1장 = 1페이지 PDF가 나온다.

## 절대 바꾸지 말 것 (양식의 정체성)

1. **코너 그래픽** — 모든 `<section>` 첫 4줄에 있는 얇은 원호 + 좌측 그라디언트 셰브론 슬리버
   + 민트 도트, 그리고 우상단 `assets/logo-ncai.png`. 위치·크기 좌표는 원본 PPT의 EMU 값을
   그대로 옮긴 것이다. 지우거나 옮기지 않는다. 새 슬라이드를 추가할 때도 이 블록을 복사해 넣는다.
2. **캔버스** — 1920×1080 고정. `<deck-stage>` 가 자동으로 화면에 맞춰 스케일한다.
   슬라이드 안에서 `vw`/`vh` 를 쓰지 않는다. 모든 값은 px 절대값.
3. **본문 여백** — 좌우 89px, 콘텐츠 폭 1742px, 제목 블록 top 52px, 푸터 bottom 44px.
4. **푸터** — 좌측 `과제명 · 보고일`, 우측 페이지 번호. 표지·간지·Q&A 에는 넣지 않는다.

## 디자인 토큰

글꼴은 **Pretendard** 하나만 쓴다 (CDN `<link>`가 이미 head 에 있음).

| 용도 | 값 |
|---|---|
| 본문 텍스트 | `#181A1C` |
| 보조 텍스트 | `#4B5563` / `#6B7280` |
| 흐린 텍스트·푸터 | `#9CA3AF` |
| 배경 (본문 슬라이드) | `#FFFFFF` |
| 배경 (간지·Q&A) | `#F6F7F9` |
| 강조 primary | `#4339C7` (연면 `#F4F4FE`, 테두리 `#C9CDF7`) |
| 영문 키커 | `#547AF2` |
| 강조 pink (진행 중·주의) | `#F34F7A` (연면 `#FFF1F4`, 진한 글자 `#9B1B36`) |
| 강조 mint (긍정·개선) | `#64DEC7` / 글자 `#1E9C84` (연면 `#EEFBF7`) |
| 경고 amber | `#8A5A00` (연면 `#FFF6E6`) |
| 보라 (그라디언트 중간) | `#7B4BD6` |
| 하이라인 테두리 | `#E3E6EC` |
| 브랜드 그라디언트 | `linear-gradient(90deg,#4339C7 0%,#9747FF 52%,#F34F7A 99%)` |

그라디언트는 **표지 제목, 간지 큰 숫자, Q&A 문자**에만 쓴다 (전부 글자 clip — 면 채움 아님).
본문 슬라이드의 카드·타임라인·다이어그램 블록을 그라디언트나 짙은 단색으로 채우지 않는다 —
강조는 연면 배경 + 진한 글자 또는 컬러 테두리로 한다.

**타입 스케일** (1920px 기준, 24px 미만 금지)

| 역할 | 크기 / 굵기 |
|---|---|
| 표지 제목 | 88px / 800 |
| 간지 숫자 | 180px / 800 · 간지 제목 72px / 700 |
| 슬라이드 제목 | 56px / 700 |
| 영문 키커 | 24px / 600, `letter-spacing:.12em` |
| 부제·리드 | 26–30px / 400 |
| 카드 제목 | 29–32px / 600 |
| 본문·표 | 23–25px / 400–500 |
| KPI 숫자 | 76px / 700 |
| 라벨·푸터 | 20–22px |

**모양** — 카드 radius 16px, 작은 블록 14px, 큰 패널 18px, 배지/칩 999px.
테두리는 1px 하이라인. 그림자는 쓰지 않는다 (인쇄에서 지저분해진다).

## 들어 있는 16장 — 무엇을 쓸지 고르기

사용자가 준 내용에 맞는 슬라이드만 남기고 **나머지 `<section>` 은 삭제한다.**
빈 슬라이드를 남겨 두거나 자리표시자 문구를 그대로 두면 안 된다.

| # | `data-label` | 언제 쓰나 |
|---|---|---|
| 1 | 표지 | 항상 |
| 2 | 목차 | 8장 이상일 때 |
| 3 | 간지 01 | 섹션이 3개 이상일 때. 숫자·제목·리드·우측 섹션 목록을 갱신 |
| 4 | 과제 개요 | 배경/목표/범위 3단 + 하단 기본정보 스트립 |
| 5 | 정량 성과 지표 | KPI 카드 4개. 목표 대비 증감 배지 필수 |
| 6 | 마일스톤 | 5단계 타임라인. 완료/진행/예정 3색 |
| 7 | 일정 계획 | 12개월 간트. 현재 시점 세로선 위치를 반드시 옮길 것 |
| 8 | 간지 02 | 기술 섹션 진입 |
| 9 | 시스템 구성도 | 3계층. 개발 범위만 진한 블록 |
| 10 | 프로세스 흐름도 | 5단계 + 단계별 산출물 |
| 11 | 규격 비교표 | 대안 비교, 채택 열만 연보라 배경 |
| 12 | 개선 전후 | Before/After 좌우 대칭, 개선폭은 오른쪽에만 |
| 13 | 화면·데모 | 캡처 3칸 (`<image-slot>` — 브라우저에서 이미지를 끌어다 놓으면 채워짐) |
| 14 | 리스크·이슈 | 영향도 배지 + 대응 + 담당·기한. 4건 이내 |
| 15 | 요약·향후 계획 | 요약 3줄 + Next steps + 요청 사항 |
| 16 | Q&A | 항상 마지막 |

부족한 유형이 필요하면 **가장 가까운 슬라이드를 복제해 변형**한다. 새 레이아웃을 발명하지 않는다.

## 내용 작성 규칙

- 한국어 중심. 슬라이드마다 영문 키커 1개 병기 (`OVERVIEW`, `KEY RESULTS` 처럼 한 단어~두 단어).
- 존댓말 종결(`-합니다`)은 설명 문장에만. 제목·라벨은 명사형.
- 숫자에는 **항상 기준**을 붙인다: 집계 기간, 목표값, 산출 방식. KPI 슬라이드 하단
  "산출 기준" 줄을 비워 두지 않는다.
- 미달 지표는 숨기지 않고 원인과 대응을 함께 적는다.
- 리스크는 담당과 기한이 있는 것만 적는다.
- 이모지 금지. 느낌표 금지. 불릿 대신 카드·표·타임라인 구조를 쓴다.
- 자리표시자(`○○ 과제`, `○○팀`, `홍길동`)는 **전부** 실제 값으로 바꾼다.
- 발표자 노트는 각 `<section>` 의 `data-speaker-notes` 속성에 한 줄로 적는다.

## 슬라이드를 새로 추가할 때 쓰는 뼈대

```html
<section data-label="슬라이드명" data-screen-label="NN" data-speaker-notes="한 줄 노트"
  style="background:#FFFFFF;color:#181A1C;font-family:'Pretendard',sans-serif;overflow:hidden">
  <!-- 공통 코너 그래픽: 기존 슬라이드에서 이 4줄을 그대로 복사 -->
  <div style="position:absolute;left:-90px;top:-52px;width:182px;height:182px;border:1px solid #DDE0E5;border-radius:50%;transform:rotate(9deg)"></div>
  <div style="position:absolute;left:0;top:26px;width:53px;height:164px;overflow:hidden"><img src="assets/varco-chevron.png" alt="" style="position:absolute;left:-90px;top:21px;width:164px;height:122px;transform:rotate(90deg)"></div>
  <div style="position:absolute;left:84px;top:33px;width:15px;height:15px;border-radius:50%;background:#64DEC7;border:1px solid #FFFFFF"></div>
  <img src="assets/logo-ncai.png" alt="NC AI" style="position:absolute;left:1747px;top:78px;width:95px;height:27px">

  <div style="position:absolute;left:89px;top:52px;width:1660px">
    <div style="font-size:24px;font-weight:600;letter-spacing:.12em;color:#547AF2">KICKER</div>
    <div style="margin-top:8px;font-size:56px;font-weight:700;letter-spacing:-0.02em">슬라이드 제목</div>
    <div style="margin-top:12px;font-size:26px;color:#6B7280">한 줄 부제</div>
  </div>

  <!-- 본문: left:89px; top:320~330px; width:1742px 안에서 grid/flex + gap 으로 배치 -->

  <div style="position:absolute;left:89px;bottom:44px;font-size:20px;color:#9CA3AF">○○ 과제 · 2026. 07. 31.</div>
  <div style="position:absolute;right:89px;bottom:44px;font-size:20px;color:#9CA3AF">NN</div>
</section>
```

레이아웃은 **인라인 스타일 + flex/grid + gap** 으로만 쓴다. 클래스·외부 CSS를 만들지 않는다.
슬라이드 안 텍스트는 절대 24px 미만으로 내리지 않는다.

## 마무리 점검

- [ ] 자리표시자 문구가 하나도 남지 않았다
- [ ] 푸터의 과제명·보고일이 전 슬라이드에서 동일하다
- [ ] 페이지 번호가 실제 순서와 맞다
- [ ] 목차·간지의 섹션 목록이 실제 구성과 일치한다
- [ ] 간트의 "현재" 세로선이 보고 시점에 맞다
- [ ] 안 쓰는 슬라이드는 삭제했다
- [ ] 1920×1080에서 넘치는 텍스트가 없다 (브라우저로 열어 확인)
