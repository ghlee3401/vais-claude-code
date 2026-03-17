#!/usr/bin/env python3
"""VAIS Code v0.11.0 — 강의용 프레젠테이션 (밝은 테마, 가독성 우선)"""

from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# ── 밝은 테마 색상 ──
WHITE      = RGBColor(0xFF, 0xFF, 0xFF)
BG_LIGHT   = RGBColor(0xF8, 0xF9, 0xFA)
BLACK      = RGBColor(0x1A, 0x1A, 0x2E)
DARK       = RGBColor(0x2D, 0x2D, 0x3F)
GRAY       = RGBColor(0x6B, 0x70, 0x80)
LIGHT_GRAY = RGBColor(0xE5, 0xE7, 0xEB)
BLUE       = RGBColor(0x25, 0x63, 0xEB)  # 메인 강조
BLUE_LIGHT = RGBColor(0xDB, 0xEA, 0xFE)
GREEN      = RGBColor(0x05, 0x96, 0x69)
GREEN_LIGHT= RGBColor(0xD1, 0xFA, 0xE5)
PURPLE     = RGBColor(0x7C, 0x3A, 0xED)
PURPLE_LT  = RGBColor(0xED, 0xE9, 0xFE)
ORANGE     = RGBColor(0xEA, 0x58, 0x0C)
ORANGE_LT  = RGBColor(0xFF, 0xED, 0xD5)
RED        = RGBColor(0xDC, 0x26, 0x26)
RED_LIGHT  = RGBColor(0xFE, 0xE2, 0xE2)

prs = Presentation()
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)

# ── Helpers ──
def set_bg(slide, color=WHITE):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color

def tbox(slide, left, top, w, h):
    return slide.shapes.add_textbox(Inches(left), Inches(top), Inches(w), Inches(h))

def txt(tf, text, sz=20, color=BLACK, bold=False, align=PP_ALIGN.LEFT, after=8, font='Arial'):
    if tf.paragraphs and tf.paragraphs[0].text == '' and len(tf.paragraphs) == 1:
        p = tf.paragraphs[0]
    else:
        p = tf.add_paragraph()
    p.text = text
    p.font.size = Pt(sz)
    p.font.color.rgb = color
    p.font.bold = bold
    p.font.name = font
    p.alignment = align
    p.space_after = Pt(after)
    return p

def card(slide, l, t, w, h, fill_color=WHITE, border_color=LIGHT_GRAY, accent=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(l), Inches(t), Inches(w), Inches(h))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    shape.line.color.rgb = border_color
    shape.line.width = Pt(1.5)
    shape.shadow.inherit = False
    if accent:
        bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(l), Inches(t+0.08), Inches(0.08), Inches(h-0.16))
        bar.fill.solid()
        bar.fill.fore_color.rgb = accent
        bar.line.fill.background()
    return shape

def make_table(slide, l, t, w, rows, cols, col_ws=None):
    shape = slide.shapes.add_table(rows, cols, Inches(l), Inches(t), Inches(w), Inches(rows * 0.52))
    tbl = shape.table
    for i, row in enumerate(tbl.rows):
        for j, cell in enumerate(row.cells):
            cell.fill.solid()
            cell.fill.fore_color.rgb = BLUE_LIGHT if i == 0 else (BG_LIGHT if i % 2 == 0 else WHITE)
            for p in cell.text_frame.paragraphs:
                p.font.size = Pt(16)
                p.font.color.rgb = BLUE if i == 0 else BLACK
                p.font.bold = (i == 0)
                p.font.name = 'Arial'
                p.space_before = Pt(4)
                p.space_after = Pt(4)
    if col_ws:
        for j, cw in enumerate(col_ws):
            tbl.columns[j].width = Inches(cw)
    return tbl

def tcell(tbl, r, c, text, color=None, bold=False, sz=16):
    cell = tbl.cell(r, c)
    cell.text = text
    for p in cell.text_frame.paragraphs:
        p.font.size = Pt(sz)
        p.font.color.rgb = color or (BLUE if r == 0 else BLACK)
        p.font.bold = bold or (r == 0)
        p.font.name = 'Arial'

def section_slide(title, subtitle_text, num, accent_color=BLUE):
    slide = prs.slides.add_slide(prs.slide_layouts[6])
    set_bg(slide, accent_color)
    tb = tbox(slide, 2, 1.2, 9, 1.5)
    txt(tb.text_frame, num, sz=100, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
    tb2 = tbox(slide, 2, 3.5, 9, 1)
    txt(tb2.text_frame, title, sz=52, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
    tb3 = tbox(slide, 2, 5.0, 9, 0.6)
    txt(tb3.text_frame, subtitle_text, sz=24, color=RGBColor(0xDB, 0xEA, 0xFE), align=PP_ALIGN.CENTER)
    return slide

def title_bar(slide, text):
    """페이지 상단 파란 타이틀 바"""
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, Inches(1.1))
    bar.fill.solid()
    bar.fill.fore_color.rgb = BLUE
    bar.line.fill.background()
    tb = tbox(slide, 0.8, 0.15, 11, 0.8)
    txt(tb.text_frame, text, sz=32, color=WHITE, bold=True)

# ════════════════════════════════════════════
# 1. 타이틀
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
# 상단 큰 파란 블록
bar = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, Inches(4.8))
bar.fill.solid()
bar.fill.fore_color.rgb = BLUE
bar.line.fill.background()

tb = tbox(s, 1, 0.8, 11, 1)
txt(tb.text_frame, 'VAIS Code', sz=72, color=WHITE, bold=True)
tb = tbox(s, 1, 2.2, 11, 1)
txt(tb.text_frame, 'v0.11.0  기술 소개', sz=40, color=RGBColor(0xBF, 0xDB, 0xFE), bold=True)
tb = tbox(s, 1, 3.5, 9, 0.8)
txt(tb.text_frame, 'Claude Code 플러그인 기반\n9단계 AI 개발 워크플로우', sz=24, color=RGBColor(0xDB, 0xEA, 0xFE))

tb = tbox(s, 1, 5.3, 11, 0.8)
txt(tb.text_frame, '체이닝 문법  ·  병렬 에이전트  ·  핑퐁 피드백 루프  ·  Gap 분석  ·  Manager Memory', sz=18, color=GRAY)
tb = tbox(s, 1, 6.3, 4, 0.4)
txt(tb.text_frame, '2026. 03', sz=16, color=GRAY)

# ════════════════════════════════════════════
# 2. 목차
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, '목차')

sections = [
    ('Part 1', '개요', 'VAIS Code란 · 핵심 가치 · 전체 아키텍처', BLUE, BLUE_LIGHT),
    ('Part 2', '워크플로우', '9단계 파이프라인 · 체이닝 문법 · 핑퐁 게이트', PURPLE, PURPLE_LT),
    ('Part 3', '시스템 구조', '에이전트 팀 · 훅 시스템 · 상태 관리 · Memory', GREEN, GREEN_LIGHT),
    ('Part 4', '실전 활용', '데모 흐름 · Gap 분석 · /vais fix · v0.11.0 변경', ORANGE, ORANGE_LT),
]
for i, (part, name, desc, ac, bg) in enumerate(sections):
    col = i % 2
    row = i // 2
    x = 0.8 + col * 6.2
    y = 1.6 + row * 2.7
    card(s, x, y, 5.8, 2.3, bg, ac, accent=ac)
    tb = tbox(s, x + 0.35, y + 0.25, 5.2, 0.5)
    txt(tb.text_frame, f'{part}  —  {name}', sz=24, color=ac, bold=True)
    tb = tbox(s, x + 0.35, y + 1.0, 5.2, 1.0)
    txt(tb.text_frame, desc, sz=18, color=DARK)

# ════════════════════════════════════════════
# 3. Section 1
# ════════════════════════════════════════════
section_slide('개요', 'VAIS Code는 무엇이고, 왜 필요한가?', '01', BLUE)

# ════════════════════════════════════════════
# 4. VAIS Code란?
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, 'VAIS Code란?')
tb = tbox(s, 0.8, 1.3, 11, 0.6)
txt(tb.text_frame, 'Claude Code 플러그인으로 동작하는  9단계 AI 개발 워크플로우  도구', sz=22, color=DARK)

data = [
    ('🎯  문제', 'AI에게 "만들어줘" 하면\n기획 없이 바로 코딩\n→ 요구사항 누락\n→ 설계 없는 코드', RED, RED_LIGHT),
    ('💡  해결', '조사→기획→설계→구현→검증\n단계별 산출물 강제\n→ 체계적 개발 보장\n→ 문서 기반 추적', BLUE, BLUE_LIGHT),
    ('✨  결과', '기획서 기반 코딩 규칙\n설계 대비 Gap 분석\n→ 90%+ 일치율 검증\n→ 세션 간 맥락 유지', GREEN, GREEN_LIGHT),
]
for i, (title, desc, ac, bg) in enumerate(data):
    x = 0.6 + i * 4.1
    card(s, x, 2.2, 3.8, 4.0, bg, ac, accent=ac)
    tb = tbox(s, x + 0.3, 2.4, 3.3, 0.6)
    txt(tb.text_frame, title, sz=24, color=ac, bold=True)
    tb = tbox(s, x + 0.3, 3.2, 3.3, 2.5)
    txt(tb.text_frame, desc, sz=19, color=DARK, after=10)

# ════════════════════════════════════════════
# 5. 핵심 가치 & 차별점
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, '핵심 가치 & 차별점')

vals = [
    ('📋  기획 없이 코드 금지', '기획서 = 단일 진실 소스(SSOT)\n코딩 규칙 + 기능 목록 + 정책 포함', BLUE, BLUE_LIGHT),
    ('🔗  체이닝 문법', 'plan:ia:wireframe → 순차\nfe+be → 병렬 / 혼합 가능', PURPLE, PURPLE_LT),
    ('🔎  Gap 분석', '설계 vs 코드 자동 비교\n90% 미만 시 최대 5회 반복', GREEN, GREEN_LIGHT),
    ('🧠  Manager Memory', '의사결정, 의존성, 기술 부채\n세션 넘어 영속 기억', ORANGE, ORANGE_LT),
]
for i, (title, desc, ac, bg) in enumerate(vals):
    col = i % 2
    row = i // 2
    x = 0.8 + col * 6.2
    y = 1.5 + row * 2.8
    card(s, x, y, 5.8, 2.4, bg, ac, accent=ac)
    tb = tbox(s, x + 0.35, y + 0.25, 5.2, 0.6)
    txt(tb.text_frame, title, sz=22, color=ac, bold=True)
    tb = tbox(s, x + 0.35, y + 1.0, 5.2, 1.2)
    txt(tb.text_frame, desc, sz=19, color=DARK, after=6)

# ════════════════════════════════════════════
# 6. 전체 아키텍처
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, '전체 아키텍처')

diagram = (
    '                    사용자  →  /vais auto login\n'
    '                         │\n'
    '                    ┌────▼─────┐\n'
    '                    │ SKILL.md │  스킬 진입점 (액션 라우팅)\n'
    '                    └────┬─────┘\n'
    '                         │\n'
    '         ┌───────────────┼───────────────┐\n'
    '         ▼               ▼               ▼\n'
    '   ┌──────────┐   ┌──────────┐   ┌─────────────┐\n'
    '   │ Manager  │ → │ Tech Lead│ → │ 에이전트 팀  │\n'
    '   │  (opus)  │   │  (opus)  │   │  (sonnet)   │\n'
    '   │ 기억/판단 │   │ 오케스트 │   │ designer    │\n'
    '   └────┬─────┘   └──────────┘   │ fe/be dev   │\n'
    '        │                        │ reviewer    │\n'
    '   피드백/기록                    └─────────────┘\n'
    '        │\n'
    '   ┌────▼──────┐   ┌──────────┐\n'
    '   │  Hooks    │   │  .vais/  │\n'
    '   │  5개 훅   │   │  상태    │\n'
    '   └───────────┘   └──────────┘'
)
card(s, 1.5, 1.4, 10.3, 5.5, BG_LIGHT, LIGHT_GRAY)
tb = tbox(s, 2.0, 1.6, 9.5, 5.2)
txt(tb.text_frame, diagram, sz=16, color=DARK, font='Courier New', after=0)

# ════════════════════════════════════════════
# 7. Section 2
# ════════════════════════════════════════════
section_slide('워크플로우', '9단계 파이프라인 · 체이닝 · 게이트', '02', PURPLE)

# ════════════════════════════════════════════
# 8. 9단계 파이프라인
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, '9단계 개발 파이프라인')

# Flow bar
flow_bar = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.6), Inches(1.3), Inches(12.1), Inches(0.7))
flow_bar.fill.solid()
flow_bar.fill.fore_color.rgb = BLUE_LIGHT
flow_bar.line.color.rgb = BLUE
flow_bar.line.width = Pt(1.5)
tb = tbox(s, 0.8, 1.35, 12, 0.6)
txt(tb.text_frame, '🔭 조사  →  📋 기획  →  🗺 IA  →  🖼 와이어프레임  →  🎨 설계  →  💻 FE  →  ⚙️ BE  →  🔎 Gap  →  🔍 검토', sz=17, color=BLUE, bold=True, align=PP_ALIGN.CENTER)

tbl = make_table(s, 0.6, 2.3, 12.1, 10, 4, [2.0, 3.5, 3.0, 3.6])
for j, h in enumerate(['단계', '산출물', '에이전트', '비고']):
    tcell(tbl, 0, j, h)

rows = [
    ('🔭  research', 'docs/01-research/', 'Tech Lead 직접', '아이디어 → 기능 도출'),
    ('📋  plan', 'docs/02-plan/ + .vais/features/', 'Tech Lead 직접', '⚡ 게이트 · 코딩 규칙 포함'),
    ('🗺  ia', 'docs/03-ia/', 'designer', '사이트맵 · 네비게이션'),
    ('🖼  wireframe', 'docs/04-wireframe/', 'designer', 'ASCII + HTML 와이어프레임'),
    ('🎨  design', 'docs/05-design/', 'designer + backend-dev', '🔀 병렬 · UI + DB 설계'),
    ('💻  fe', 'src/', 'frontend-dev', '⚡ 게이트 · 🔀 병렬'),
    ('⚙️  be', 'src/ or server/', 'backend-dev', '🔀 병렬 (fe와 동시)'),
    ('🔎  check', 'docs/06-check/', 'reviewer', 'Gap 분석 + 보안 검사'),
    ('🔍  review', 'docs/07-review/', 'reviewer', 'QA + 최종 리뷰'),
]
for i, (a, b, c, d) in enumerate(rows):
    tcell(tbl, i+1, 0, a)
    tcell(tbl, i+1, 1, b)
    tcell(tbl, i+1, 2, c)
    tcell(tbl, i+1, 3, d)

# ════════════════════════════════════════════
# 9. 체이닝 문법
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, '체이닝 문법')

tb = tbox(s, 0.8, 1.2, 10, 0.5)
txt(tb.text_frame, ':  순차  /  +  병렬  — 조합하여 워크플로우 커스터마이징', sz=20, color=GRAY)

# 문법 테이블
tbl = make_table(s, 0.8, 1.9, 5.5, 5, 3, [1.2, 1.8, 2.5])
for j, h in enumerate(['기호', '의미', '예시']):
    tcell(tbl, 0, j, h)
tcell(tbl, 1, 0, ':');    tcell(tbl, 1, 1, '순차 실행');  tcell(tbl, 1, 2, 'plan:ia:wireframe')
tcell(tbl, 2, 0, '+');    tcell(tbl, 2, 1, '병렬 실행');  tcell(tbl, 2, 2, 'fe+be')
tcell(tbl, 3, 0, '혼합'); tcell(tbl, 3, 1, '순차+병렬');  tcell(tbl, 3, 2, 'plan:design:fe+be:check')
tcell(tbl, 4, 0, 'auto'); tcell(tbl, 4, 1, '전체 자동');  tcell(tbl, 4, 2, '/vais auto login')

# 예시
examples = (
    '/vais plan 로그인기능                  # 단일\n\n'
    '/vais plan:ia:wireframe 로그인기능     # 순차\n\n'
    '/vais fe+be 로그인기능                 # 병렬\n\n'
    '/vais plan:design:fe+be:check 로그인   # 혼합\n\n'
    '/vais auto 로그인기능                  # 전체\n\n'
    '"기획부터 백엔드까지"                    # 한글 범위\n'
    ' → plan:ia:wireframe:design:fe+be'
)
card(s, 6.8, 1.9, 5.8, 5.0, BG_LIGHT, LIGHT_GRAY, accent=PURPLE)
tb = tbox(s, 7.2, 2.1, 5.2, 4.7)
txt(tb.text_frame, examples, sz=16, color=DARK, font='Courier New', after=2)

# ════════════════════════════════════════════
# 10. 게이트 & 핑퐁
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, '게이트 & 핑퐁 피드백 루프  (v0.11.0)')

# 왼쪽: 게이트 설명
card(s, 0.8, 1.4, 5.8, 2.5, ORANGE_LT, ORANGE, accent=ORANGE)
tb = tbox(s, 1.2, 1.6, 5.2, 0.5)
txt(tb.text_frame, '⚡  게이트 체크포인트', sz=24, color=ORANGE, bold=True)
tb = tbox(s, 1.2, 2.3, 5.2, 1.4)
txt(tb.text_frame,
    'vais.config.json → orchestration.gates\n\n'
    '•  plan 게이트 — 기획 완료 후 방향 확인\n'
    '•  fe 게이트 — 구현 시작 전 설계 확인',
    sz=18, color=DARK, after=4)

# 왼쪽 하단: 핵심
card(s, 0.8, 4.3, 5.8, 2.5, RED_LIGHT, RED, accent=RED)
tb = tbox(s, 1.2, 4.5, 5.2, 0.5)
txt(tb.text_frame, '⚠️  핵심 원칙', sz=24, color=RED, bold=True)
tb = tbox(s, 1.2, 5.2, 5.2, 1.4)
txt(tb.text_frame,
    '사용자가 명시적으로\n"계속" 을 선택할 때까지\n절대 다음 단계로 넘어가지 않음',
    sz=20, color=DARK, bold=True, after=6)

# 오른쪽: 핑퐁 다이어그램
card(s, 7.0, 1.4, 5.8, 5.4, BG_LIGHT, BLUE, accent=BLUE)
tb = tbox(s, 7.3, 1.5, 5.2, 0.5)
txt(tb.text_frame, '🔄  핑퐁 루프 흐름', sz=22, color=BLUE, bold=True)
pingpong = (
    '게이트 도달\n'
    '  │\n'
    '  ▼\n'
    'AskUserQuestion\n'
    '  │\n'
    '  ├─ "계속"     → 다음 단계 ✅\n'
    '  │\n'
    '  ├─ "수정 요청"\n'
    '  │     │\n'
    '  │     ▼\n'
    '  │   피드백 반영 → 수정\n'
    '  │     │\n'
    '  │     ▼\n'
    '  │   📝 수정 결과 요약\n'
    '  │     │\n'
    '  │     ▼\n'
    '  │   재확인 (계속 / 추가 수정 / 중단)\n'
    '  │\n'
    '  └─ "중단"     → 저장 후 종료 🛑'
)
tb = tbox(s, 7.3, 2.1, 5.2, 4.5)
txt(tb.text_frame, pingpong, sz=14, color=DARK, font='Courier New', after=1)

# ════════════════════════════════════════════
# 11. Section 3
# ════════════════════════════════════════════
section_slide('시스템 구조', '에이전트 · 훅 · 상태 관리 · Memory', '03', GREEN)

# ════════════════════════════════════════════
# 12. 에이전트 팀
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, '에이전트 팀 구성')

agents = [
    ('📋 Manager', 'opus', '프로젝트 기억\n전략적 판단\n크로스-피처 분석\nTech Lead 지시', ORANGE, ORANGE_LT),
    ('🏗 Tech Lead', 'opus', '아키텍처 결정\n팀 오케스트레이션\n게이트 관리\n품질 관리', BLUE, BLUE_LIGHT),
    ('🎨 Designer', 'sonnet', 'IA 설계\n와이어프레임\nUI/UX 설계\n디자인 토큰', PURPLE, PURPLE_LT),
    ('💻 FE / ⚙️ BE', 'sonnet', '프론트엔드 구현\n백엔드 API/DB\n테스트 코드', GREEN, GREEN_LIGHT),
    ('🔍 Reviewer', 'sonnet', 'Gap 분석\nOWASP 보안\nQA 검증\n코드 리뷰', RED, RED_LIGHT),
]
for i, (name, model, desc, ac, bg) in enumerate(agents):
    x = 0.4 + i * 2.55
    card(s, x, 1.3, 2.35, 3.8, bg, ac, accent=ac)
    tb = tbox(s, x + 0.2, 1.5, 2.0, 0.5)
    txt(tb.text_frame, name, sz=16, color=ac, bold=True)
    tb = tbox(s, x + 0.2, 2.0, 2.0, 0.4)
    txt(tb.text_frame, model, sz=14, color=GRAY, bold=True)
    tb = tbox(s, x + 0.2, 2.5, 2.0, 2.3)
    txt(tb.text_frame, desc, sz=14, color=DARK, after=4)

# 오케스트레이션 패턴 테이블
tbl = make_table(s, 0.8, 5.4, 11.7, 5, 3, [2.2, 5.0, 4.5])
for j, h in enumerate(['패턴', '설명', '적용 단계']):
    tcell(tbl, 0, j, h)
for i, (a, b, c) in enumerate([
    ('leader', 'Tech Lead가 직접 수행', 'research, plan'),
    ('delegate', '전문 에이전트에 위임', 'ia, wireframe, fe, be'),
    ('parallel', '여러 에이전트 동시 호출', 'design(UI+DB), fe+be'),
    ('council', 'reviewer + 리드 공동 검토', 'check, review'),
]):
    tcell(tbl, i+1, 0, a, GREEN)
    tcell(tbl, i+1, 1, b)
    tcell(tbl, i+1, 2, c)

# ════════════════════════════════════════════
# 13. 비용 최적화
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, '모델 비용 최적화')
tb = tbox(s, 0.8, 1.2, 10, 0.5)
txt(tb.text_frame, '판단은 Opus,  구현은 Sonnet  —  역할별 모델 분리로 비용 절감', sz=20, color=GRAY)

# Opus
card(s, 0.8, 2.0, 5.8, 2.3, RED_LIGHT, RED, accent=RED)
tb = tbox(s, 1.2, 2.2, 5.2, 0.5)
txt(tb.text_frame, 'Opus  —  판단, 전략, 아키텍처', sz=22, color=RED, bold=True)
tb = tbox(s, 1.2, 2.9, 5.2, 1.2)
txt(tb.text_frame, '•  Manager — 프로젝트 기억, 전략 판단, 의존성 분석\n•  Tech Lead — 아키텍처 결정, 팀 오케스트레이션', sz=18, color=DARK, after=6)

# Sonnet
card(s, 0.8, 4.6, 5.8, 2.5, BLUE_LIGHT, BLUE, accent=BLUE)
tb = tbox(s, 1.2, 4.8, 5.2, 0.5)
txt(tb.text_frame, 'Sonnet  —  코드 구현, 문서 작성', sz=22, color=BLUE, bold=True)
tb = tbox(s, 1.2, 5.5, 5.2, 1.5)
txt(tb.text_frame, '•  Designer — IA, 와이어프레임, UI/UX 설계\n•  Frontend Dev / Backend Dev — 구현\n•  Reviewer — Gap 분석, QA, 코드 리뷰', sz=18, color=DARK, after=6)

# 효과
card(s, 7.0, 2.0, 5.8, 5.1, GREEN_LIGHT, GREEN, accent=GREEN)
tb = tbox(s, 7.3, 2.2, 5.2, 0.5)
txt(tb.text_frame, '💰  비용 절감 효과', sz=24, color=GREEN, bold=True)
tb = tbox(s, 7.3, 3.0, 5.2, 3.8)
txt(tb.text_frame,
    '9단계 중 2단계만 opus\n'
    '나머지 7단계는 sonnet\n\n'
    '→ 전체 비용  60~70%  절감 (추정)\n\n\n'
    '단순 탐색에는 haiku 활용 가능',
    sz=20, color=DARK, after=8)

# ════════════════════════════════════════════
# 14. 훅 시스템
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, '훅(Hook) 시스템')
tb = tbox(s, 0.8, 1.2, 10, 0.5)
txt(tb.text_frame, 'Claude Code 이벤트에 자동 반응하는 5개 훅', sz=20, color=GRAY)

tbl = make_table(s, 0.6, 1.9, 12.1, 6, 4, [2.5, 2.0, 3.5, 4.1])
for j, h in enumerate(['훅', '이벤트', '스크립트', '역할']):
    tcell(tbl, 0, j, h)
for i, (a, b, c, d) in enumerate([
    ('SessionStart', '세션 시작', 'session-start.js', '.vais/ 디렉토리 생성, 상태 표시'),
    ('PreToolUse', 'Bash 실행 전', 'bash-guard.js', 'rm -rf, DROP, sudo 등 위험 명령 차단'),
    ('PostToolUse', 'Write | Edit 후', 'doc-tracker.js', '문서 감지 → 워크플로우 상태 자동 갱신'),
    ('UserPromptSubmit', '사용자 입력', 'prompt-handler.js', '의도 감지 → /vais 명령 제안'),
    ('Stop', '응답 완료', 'stop-handler.js', '진행률 프로그레스바 + 다음 단계 안내'),
]):
    tcell(tbl, i+1, 0, a, PURPLE, bold=True)
    tcell(tbl, i+1, 1, b)
    tcell(tbl, i+1, 2, c)
    tcell(tbl, i+1, 3, d)

card(s, 0.6, 5.2, 12.1, 1.3, GREEN_LIGHT, GREEN, accent=GREEN)
tb = tbox(s, 1.0, 5.4, 11.5, 0.9)
txt(tb.text_frame, 'v0.11.0 —  no-op 훅 2개 (notification.js, subagent-stop.js) 제거하여 오버헤드 감소', sz=18, color=DARK)

# ════════════════════════════════════════════
# 15. 상태 관리
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, '상태 관리 시스템')
tb = tbox(s, 0.8, 1.2, 10, 0.5)
txt(tb.text_frame, '.vais/  디렉토리에 모든 상태를 JSON으로 영속 관리', sz=20, color=GRAY)

tree = (
    '.vais/\n'
    '├── status.json           워크플로우 상태\n'
    '│     activeFeature · currentPhase\n'
    '│     phases (9개) · gapAnalysis\n'
    '│\n'
    '├── memory.json           Manager Memory\n'
    '│     entries[] → decision, change,\n'
    '│     feedback, dependency, debt,\n'
    '│     error, milestone\n'
    '│\n'
    '├── features/             피처 레지스트리\n'
    '│     login.json → features[], policies,\n'
    '│     techStack, hasDatabase\n'
    '│\n'
    '└── project-config.json   프로젝트별 설정'
)
card(s, 0.8, 1.9, 6.0, 5.0, BG_LIGHT, LIGHT_GRAY, accent=BLUE)
tb = tbox(s, 1.2, 2.1, 5.5, 4.7)
txt(tb.text_frame, tree, sz=16, color=DARK, font='Courier New', after=2)

# 모듈 테이블
tbl = make_table(s, 7.2, 1.9, 5.5, 6, 2, [1.8, 3.7])
for j, h in enumerate(['모듈', '핵심 역할']):
    tcell(tbl, 0, j, h)
for i, (a, b) in enumerate([
    ('paths.js', '경로 레지스트리, loadConfig'),
    ('status.js', '워크플로우 상태, updatePhase'),
    ('memory.js', 'Manager Memory, addEntry'),
    ('io.js', '훅 I/O, outputAllow / Block'),
    ('debug.js', '디버그 로깅 (VAIS_DEBUG=1)'),
]):
    tcell(tbl, i+1, 0, a, BLUE, bold=True)
    tcell(tbl, i+1, 1, b)

# ════════════════════════════════════════════
# 16. Memory System
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, 'Manager Memory 시스템')
tb = tbox(s, 0.8, 1.2, 10, 0.5)
txt(tb.text_frame, '프로젝트의 모든 의사결정과 컨텍스트를 영속 기억', sz=20, color=GRAY)

tbl = make_table(s, 0.8, 1.9, 6.5, 8, 3, [1.6, 2.0, 2.9])
for j, h in enumerate(['타입', '용도', '예시']):
    tcell(tbl, 0, j, h)
for i, (a, b, c) in enumerate([
    ('decision', '기술/비즈니스 결정', 'Next.js 선택 — SSR'),
    ('change', 'fix로 인한 변경', 'JWT → 세션 변경'),
    ('feedback', '게이트 피드백', '소셜 로그인 추가'),
    ('dependency', '피처 간 의존', 'cart → login 의존'),
    ('debt', '기술 부채', '에러 핸들링 미완'),
    ('error', '실패/재시도', '빌드 실패'),
    ('milestone', '단계 완료', 'plan 단계 완료'),
]):
    tcell(tbl, i+1, 0, a, PURPLE, bold=True)
    tcell(tbl, i+1, 1, b)
    tcell(tbl, i+1, 2, c)

scenarios = [
    ('🔍  Query 모드', '"프로젝트 현황 알려줘"\nmemory 조회 → 피처 목록, 진행률', BLUE, BLUE_LIGHT),
    ('⚡  크로스-피처 분석', '"login 수정해줘"\n→ cart, payment 영향 알림', PURPLE, PURPLE_LT),
    ('📋  기술 부채 관리', '미해결 부채 목록 조회\n해결 시 resolveDebt()', GREEN, GREEN_LIGHT),
]
for i, (t, d, ac, bg) in enumerate(scenarios):
    y = 1.9 + i * 1.7
    card(s, 7.8, y, 4.8, 1.5, bg, ac, accent=ac)
    tb = tbox(s, 8.1, y + 0.15, 4.3, 0.4)
    txt(tb.text_frame, t, sz=16, color=ac, bold=True)
    tb = tbox(s, 8.1, y + 0.6, 4.3, 0.8)
    txt(tb.text_frame, d, sz=14, color=DARK, after=3)

# ════════════════════════════════════════════
# 17. Section 4
# ════════════════════════════════════════════
section_slide('실전 활용', '데모 흐름 · Gap 분석 · /vais fix · v0.11.0', '04', ORANGE)

# ════════════════════════════════════════════
# 18. 데모 흐름
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, '실행 데모  —  /vais auto login')

demo = (
    ' 1.  Manager  — memory 조회 → 의존성 확인 → Tech Lead 지시\n\n'
    ' 2.  Tech Lead — research  →  docs/01-research/login.md\n\n'
    ' 3.  Tech Lead — plan   ⚡ 게이트\n'
    '       기획서 작성 → 피처 레지스트리 → 핑퐁 루프\n'
    '       └─ "소셜 로그인도 넣어줘"  →  반영  →  "계속"\n\n'
    ' 4.  designer  — ia  →  사이트맵 + 네비게이션\n\n'
    ' 5.  designer  — wireframe  →  ASCII/HTML 와이어프레임\n\n'
    ' 6.  🔀 병렬 — design\n'
    '       ├─ designer     →  UI 설계 (디자인 토큰, 컴포넌트)\n'
    '       └─ backend-dev  →  DB 설계 (ERD, 스키마)\n\n'
    ' 7.  🔀 병렬 — fe + be   ⚡ 게이트 (fe 시작 전)\n'
    '       ├─ frontend-dev →  React 컴포넌트 구현\n'
    '       └─ backend-dev  →  API + DB 연동\n\n'
    ' 8.  reviewer — check  →  Gap 분석  (90% 미만 시 자동 반복)\n\n'
    ' 9.  reviewer — review →  QA + OWASP 보안 + 최종 리뷰'
)
card(s, 0.6, 1.3, 12.1, 5.8, BG_LIGHT, LIGHT_GRAY, accent=BLUE)
tb = tbox(s, 1.0, 1.4, 11.5, 5.6)
txt(tb.text_frame, demo, sz=16, color=DARK, font='Courier New', after=0)

# ════════════════════════════════════════════
# 19. Gap 분석
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, 'Gap 분석  —  자동 검증 루프')

# 프로세스
card(s, 0.8, 1.3, 5.8, 4.0, BG_LIGHT, LIGHT_GRAY, accent=GREEN)
tb = tbox(s, 1.2, 1.5, 5.2, 0.5)
txt(tb.text_frame, '프로세스', sz=22, color=GREEN, bold=True)
tb = tbox(s, 1.2, 2.1, 5.2, 3.0)
txt(tb.text_frame,
    '1.  피처 레지스트리에서 요구사항 추출\n'
    '2.  Glob/Grep으로 구현 코드 탐색\n'
    '3.  각 요구사항 구현 여부 판정\n'
    '4.  일치율: (구현 수 / 전체) × 100\n'
    '5.  OWASP Top 10 보안 검사\n'
    '6.  QA 시나리오 생성\n'
    '7.  Gap 방향 판단 (코드? 스펙?)\n'
    '8.  90% 미만 → 최대 5회 자동 반복',
    sz=16, color=DARK, after=5)

# 다이어그램
gap_d = (
    'check 시작\n'
    '  │\n'
    '  ▼\n'
    '빌드 검증  (npm build / tsc)\n'
    '  │\n'
    '  ▼\n'
    'Gap 분석 실행\n'
    '  │\n'
    '  ├─  ≥ 90%  →  통과 ✅\n'
    '  │\n'
    '  └─  < 90%\n'
    '        ▼\n'
    '      Gap 방향 판단\n'
    '        ├─ 코드 누락 → 수정\n'
    '        └─ 스펙 과잉 → 확인\n'
    '        ▼\n'
    '      반복 (iteration++)\n'
    '        ├─ ≤ 5   →  재분석 🔄\n'
    '        └─ > 5   →  중단 🛑'
)
card(s, 7.0, 1.3, 5.8, 5.5, BG_LIGHT, BLUE, accent=BLUE)
tb = tbox(s, 7.3, 1.4, 5.2, 5.3)
txt(tb.text_frame, gap_d, sz=15, color=DARK, font='Courier New', after=1)

# 설정
card(s, 0.8, 5.6, 5.8, 1.2, ORANGE_LT, ORANGE, accent=ORANGE)
tb = tbox(s, 1.2, 5.7, 5.2, 1.0)
txt(tb.text_frame, '설정:  matchThreshold: 90  ·  maxIterations: 5  ·  autoIterate: true', sz=16, color=DARK)

# ════════════════════════════════════════════
# 20. /vais fix
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, '/vais fix  —  영향 분석 기반 수정')

fix = (
    '사용자: "로그인 화면 디자인 바꿔줘"\n'
    '  │\n'
    '  ▼\n'
    'Manager\n'
    '  ├── memory 조회 (과거 결정)\n'
    '  ├── dependency 맵 확인\n'
    '  └── 영향 범위 분석\n'
    '  │\n'
    '  ▼\n'
    '영향 분류\n'
    '  ├── UI만    →  wireframe:design:fe\n'
    '  ├── API만   →  design:be\n'
    '  ├── 전체    →  design:fe+be:check\n'
    '  └── 정책    →  plan:design:fe+be:check\n'
    '  │\n'
    '  ▼\n'
    'Tech Lead → 팀 실행 → Manager 기록'
)
card(s, 0.8, 1.3, 6.0, 5.5, BG_LIGHT, LIGHT_GRAY, accent=BLUE)
tb = tbox(s, 1.2, 1.5, 5.5, 5.2)
txt(tb.text_frame, fix, sz=16, color=DARK, font='Courier New', after=1)

# 크로스-피처
card(s, 7.2, 1.3, 5.5, 3.2, ORANGE_LT, ORANGE, accent=ORANGE)
tb = tbox(s, 7.5, 1.5, 5.0, 0.5)
txt(tb.text_frame, '⚠️  크로스-피처 영향 감지', sz=20, color=ORANGE, bold=True)
tb = tbox(s, 7.5, 2.2, 5.0, 2.0)
txt(tb.text_frame,
    '"login" 수정 시 영향:\n\n'
    '•  cart — 인증 토큰 의존\n'
    '    → 인증 변경 시 cart도 수정 필요\n\n'
    '•  payment — cart 경유 간접 의존',
    sz=16, color=DARK, after=4)

# 안전장치
card(s, 7.2, 4.8, 5.5, 2.0, GREEN_LIGHT, GREEN, accent=GREEN)
tb = tbox(s, 7.5, 5.0, 5.0, 0.5)
txt(tb.text_frame, '✅  안전 장치', sz=20, color=GREEN, bold=True)
tb = tbox(s, 7.5, 5.6, 5.0, 1.0)
txt(tb.text_frame, '•  fix → check → fix 재귀 방지\n•  영향 피처 사용자 확인 필수\n•  모든 변경 memory에 기록', sz=16, color=DARK, after=4)

# ════════════════════════════════════════════
# 21. v0.11.0 변경 사항
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, 'v0.11.0  변경 사항')

# 보안
card(s, 0.6, 1.3, 6.0, 3.0, BG_LIGHT, LIGHT_GRAY, accent=RED)
tb = tbox(s, 1.0, 1.4, 5.5, 0.5)
txt(tb.text_frame, '🔒  보안 & 안정성', sz=22, color=RED, bold=True)

tbl = make_table(s, 1.0, 2.1, 5.4, 6, 2, [1.8, 3.6])
for j, h in enumerate(['항목', '변경']):
    tcell(tbl, 0, j, h, sz=14)
for i, (a, b) in enumerate([
    ('bash-guard', 'sudo, 분리플래그, $HOME, chmod 777'),
    ('doc-tracker', 'includes → endsWith 오탐 수정'),
    ('prompt-handler', '복합 키워드로 오탐 감소'),
    ('status.js', 'updatePhase 재귀 → 재로드'),
    ('에러 로깅', '모든 catch에 debugLog 추가'),
]):
    tcell(tbl, i+1, 0, a, GREEN, sz=14)
    tcell(tbl, i+1, 1, b, sz=14)

# 기능
card(s, 6.9, 1.3, 6.0, 3.0, BG_LIGHT, LIGHT_GRAY, accent=BLUE)
tb = tbox(s, 7.3, 1.4, 5.5, 0.5)
txt(tb.text_frame, '✨  기능 & 품질', sz=22, color=BLUE, bold=True)

tbl2 = make_table(s, 7.3, 2.1, 5.4, 7, 2, [2.0, 3.4])
for j, h in enumerate(['항목', '변경']):
    tcell(tbl2, 0, j, h, sz=14)
for i, (a, b) in enumerate([
    ('게이트 루프', '핑퐁 피드백 루프 추가'),
    ('no-op 훅', 'notification/subagent 제거'),
    ('타이포그래피', 'design 템플릿 기본값 추가'),
    ('OWASP', 'A06/A08/A09/A10 추가'),
    ('버전 통일', 'plugin/marketplace → 0.11.0'),
    ('변경 이력', '시맨틱 버전 순 정렬'),
]):
    tcell(tbl2, i+1, 0, a, PURPLE, sz=14)
    tcell(tbl2, i+1, 1, b, sz=14)

# 테스트 배지
card(s, 0.6, 5.8, 12.3, 1.0, GREEN_LIGHT, GREEN)
tb = tbox(s, 1.0, 5.9, 11.5, 0.8)
txt(tb.text_frame, '✅   테스트:  25 suites  ·  67 tests  ·  전체 통과', sz=22, color=GREEN, bold=True, align=PP_ALIGN.CENTER)

# ════════════════════════════════════════════
# 22. 요약
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, WHITE)
title_bar(s, '요약')

card(s, 0.8, 1.4, 5.8, 4.5, RED_LIGHT, RED, accent=RED)
tb = tbox(s, 1.2, 1.6, 5.2, 0.5)
txt(tb.text_frame, '🎯  VAIS Code가 해결하는 것', sz=22, color=RED, bold=True)
tb = tbox(s, 1.2, 2.3, 5.2, 3.3)
txt(tb.text_frame,
    '•  AI가 기획 없이 코드부터 작성\n\n'
    '•  설계와 구현의 괴리 (Gap)\n\n'
    '•  세션 간 맥락 유실\n\n'
    '•  피처 간 의존성 파악 불가\n\n'
    '•  수정 시 영향 범위 모름',
    sz=19, color=DARK, after=4)

card(s, 7.0, 1.4, 5.8, 4.5, GREEN_LIGHT, GREEN, accent=GREEN)
tb = tbox(s, 7.4, 1.6, 5.2, 0.5)
txt(tb.text_frame, '✨  핵심 역량', sz=22, color=GREEN, bold=True)
tb = tbox(s, 7.4, 2.3, 5.2, 3.3)
txt(tb.text_frame,
    '•  9단계 파이프라인  →  체계적 산출물\n\n'
    '•  체이닝 문법  →  유연한 워크플로우\n\n'
    '•  병렬 에이전트  →  design, fe+be\n\n'
    '•  Gap 분석  →  90%+ 자동 검증\n\n'
    '•  Manager Memory  →  영속 맥락\n\n'
    '•  핑퐁 게이트  →  사용자 통제 보장',
    sz=19, color=DARK, after=4)

tb = tbox(s, 2, 6.2, 9, 0.5)
txt(tb.text_frame, '/vais auto {피처명}  으로 시작하세요', sz=22, color=GRAY, align=PP_ALIGN.CENTER)
tb = tbox(s, 2, 6.8, 9, 0.4)
txt(tb.text_frame, 'VAIS Code v0.11.0  ·  MIT License  ·  github.com/ghlee3401/vais-claude-code', sz=14, color=GRAY, align=PP_ALIGN.CENTER)

# ════════════════════════════════════════════
# 23. Q&A
# ════════════════════════════════════════════
s = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(s, BLUE)
tb = tbox(s, 2, 2.0, 9, 1.5)
txt(tb.text_frame, 'Q & A', sz=80, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
tb = tbox(s, 2, 4.0, 9, 1)
txt(tb.text_frame, '감사합니다', sz=44, color=WHITE, bold=True, align=PP_ALIGN.CENTER)
tb = tbox(s, 2, 5.5, 9, 0.5)
txt(tb.text_frame, 'VAIS Code v0.11.0', sz=20, color=RGBColor(0xBF, 0xDB, 0xFE), align=PP_ALIGN.CENTER)
tb = tbox(s, 2, 6.1, 9, 0.4)
txt(tb.text_frame, '/vais help  로 시작하세요', sz=18, color=RGBColor(0xBF, 0xDB, 0xFE), align=PP_ALIGN.CENTER)

# ════════════════════════════════════════════
out = '/home/user/vais-claude-code/docs/vais-code-v0.11.0.pptx'
prs.save(out)
print(f'✅ Saved: {out}')
print(f'   Slides: {len(prs.slides)}')
