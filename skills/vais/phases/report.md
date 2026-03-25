### 📊 report — 완료 보고서 생성

QA 완료 후 프로젝트 전체를 회고하는 완료 보고서를 생성합니다.

#### Upstream Context Loading

1. **QA 문서 전체 읽기** (`docs/04-qa/{feature}.md`) — 최종 판정, Gap 일치율, 이슈 목록, Success Criteria 평가 결과 확인
2. **Plan 문서 전체 읽기** (`docs/01-plan/{feature}.md`) — Executive Summary, Context Anchor, Success Criteria 원문 로드
3. **Design 문서 전체 읽기** (`docs/02-design/{feature}.md`) — Architecture Option 선택 근거, Key Decisions 로드

#### 보고서 작성

4. `templates/report.template.md` 기반으로 보고서 작성:
   - **Executive Summary**: Project Overview (기간, 피처명) + Value Delivered (Plan Executive Summary vs 실제 결과 비교)
   - **Success Criteria Final Status**: Plan SC를 QA 결과로 최종 평가 (✅ Met / ⚠️ Partial / ❌ Not Met + 증거). Success Rate 산출
   - **PDCA Cycle Summary**: 각 Phase 상태와 산출물 정리
   - **Key Decisions & Outcomes**: Plan→Design의 주요 결정과 실제 결과 비교 (따랐는지? 결과는?)
   - **QA Results**: Gap 일치율, QA 통과율, Critical/Warning 이슈 수
   - **Retrospective**: Keep/Problem/Try 3가지 관점 회고
   - **Next Steps**: 후속 작업 체크리스트

#### 저장 및 확인

5. `docs/05-report/{feature}.md`에 저장
6. AskUserQuestion: "보고서 내용을 확인해 주세요. 수정할 사항이 있나요?"
   - 수정 요청 시 반영 후 재확인
   - 확인 시 완료

**에이전트**: manager (또는 직접 실행)
