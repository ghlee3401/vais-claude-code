---
# 이 파일의 책임: /vais brief 진입점 — VARCO 고정 양식 기반 임원/대외 보고용 HTML 보고서·슬라이드 생성.
name: brief
description: >
  Generates executive-facing reports in the fixed VARCO house style: a technical-report
  HTML document (default) or a 16:9 slide deck (--deck). Content structure is composed
  freely from conversation context and user-provided material; layout, colors, and
  typography are locked by the template. Independent of the development workflow.
  Use when: /vais brief is invoked, or the user asks for an executive report,
  기술 보고서, 과제 보고, or 보고용 슬라이드 on an arbitrary topic.
---

# Brief — 임원/대외 보고 생성기 (VARCO 양식)

`/vais brief {주제}` — 기술 보고서 문서형 (기본) · `/vais brief {주제} --deck` — 16:9 슬라이드 덱.

개발 워크플로우와 무관한 독립 커맨드다.

**원칙: 내용 구성은 자유, 양식은 고정.** 스토리라인·섹션 선택·figure 구성은 소재에 맞게 Claude 가 판단한다. 대신 레이아웃·색·타입은 VARCO 양식 규칙을 그대로 지킨다 — 양식을 새로 그리지 않는다.

## 양식 (먼저 해당 규칙 파일을 Read)

| 형태 | 템플릿 | 규칙 |
|---|---|---|
| 문서형 (기본) | `template/report.html` | `skills/brief/varco-report.md` |
| 덱 (`--deck`) | `template/deck.html` | `skills/brief/varco-deck.md` |

## 파이프라인

1. **소재 수집** — 1차 소재는 대화 맥락 + 사용자 제공 자료(파일·데이터·URL). 필요 시 `docs/{feature}/`·git log 도 소스로 쓸 수 있다. 소재가 부족하면 이 시점에 질문 — 생성 중간 질문 금지.
2. **아웃라인 승인 (유일한 중간 확인)** — 스토리라인 + 섹션(슬라이드) 목록 + 산출 경로를 표로 제시 → AskUserQuestion 1회 (`이대로 진행` / `수정`). 대상 독자·분량이 불명확하면 이 확인에 함께 묻는다.
3. **양식 준비** — `cp -r skills/brief/template <산출 폴더>` 후 해당 규칙 파일의 지시대로 편집. 산출 기본 경로: `reports/{YYYY-MM-DD}-{slug}/` (2단계에서 확정한 경로 우선).
4. **내용 작성** — 구성은 자유, 양식 규칙 절대 준수. 안 쓰는 섹션(슬라이드)·자리표시자는 전부 제거.
5. **마무리 점검 (필수)** — 규칙 파일의 점검 리스트를 수행 → 위반 수정 → 결과를 대화에 1줄 보고 (`점검: 6/6 통과, 수정 2건`).

## 규칙

- 외부 리소스는 template 동봉분(assets/, js)만 — 그 외 CDN·원격 참조 추가 금지.
- 차트·다이어그램은 인라인 SVG 직접 생성 (라이브러리 금지).
- 본문 데이터는 소재에서만 — 수치를 지어내지 않는다. 불확실한 수치는 표기 (`~`, `추정`).
- pptx 가 꼭 필요하면 요청 시 `pptxgenjs` 스크립트 생성 (옵션, HTML 인쇄 우선 권장).
