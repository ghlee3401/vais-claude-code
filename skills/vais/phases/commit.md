### 커밋 생성

#### Step 1: 변경 분석

1. `git status`로 변경 파일 목록 확인
2. `git diff --staged`로 스테이징된 변경사항 확인. 스테이징된 파일이 없으면 `git add`로 관련 파일 스테이징
3. `git log --oneline -5`로 최근 커밋 스타일 확인

#### Step 2: 버전 판단 (Semver)

변경 내용을 분석하여 **semver 버전 범프가 필요한지** 판단합니다:

**판단 기준:**
| 변경 유형 | 버전 | 예시 |
|----------|------|------|
| 기존 기능 호환 깨뜨리는 변경 | **Major** (x.0.0) | API 삭제, 설정 포맷 변경, 필수 필드 추가 |
| 새 기능 추가, 템플릿 구조 변경, phase 파일 추가 | **Minor** (0.x.0) | 새 phase, 새 템플릿, 새 섹션 추가 |
| 버그 수정, 오타, 문서 보정, 설정값 수정 | **Patch** (0.0.x) | 버그 fix, 누락 필드 추가, README 수정 |
| 문서만 변경 (PDCA docs, CHANGELOG) | **None** | Plan/Design/Report 문서 작성만 |
| 코드 포맷/리팩토링 (동작 변경 없음) | **None** | 변수명 변경, 코드 정리 |

**자동 판단 흐름:**
1. 변경된 파일 목록에서 `templates/`, `skills/`, `hooks/`, `lib/`, `scripts/` 파일이 있는가?
   - 없으면 (docs만 변경) → 버전 범프 불필요 → Step 4로
2. 새 파일이 생성되었는가? 또는 기존 기능이 확장되었는가?
   - Yes → **Minor** 제안
3. 버그 수정 또는 설정 보정인가?
   - Yes → **Patch** 제안
4. 기존 API/설정 호환성이 깨지는가?
   - Yes → **Major** 제안

AskUserQuestion으로 판단 결과를 제시:
- "이번 변경은 **{minor/patch}** 버전 범프를 권장합니다. 현재 {현재버전} → {제안버전}. 동의하시나요?"
- 옵션: "{제안} (Recommended)", "다른 버전 지정", "버전 범프 안 함"

#### Step 3: 버전 일괄 반영

버전 범프가 결정되면, 아래 **7곳을 모두** 업데이트합니다:

| # | 파일 | 위치 | 형식 |
|---|------|------|------|
| 1 | `vais.config.json` | `"version"` 필드 | `"0.x.y"` |
| 2 | `.claude-plugin/plugin.json` | `"version"` 필드 | `"0.x.y"` |
| 3 | `.claude-plugin/marketplace.json` | `"version"` 필드 (2곳) | `"0.x.y"` |
| 4 | `README.md` | 상단 버전 배지 | `**v0.x.y**` |
| 5 | `CHANGELOG.md` | 최상단에 새 엔트리 추가 | `## [0.x.y] - YYYY-MM-DD` |
| 6 | `templates/*.template.md` | 하단 `<!-- template version: -->` | 변경된 템플릿만 |
| 7 | `vendor/README.md` | 버전 참조 (2곳) | `v0.x.y` |

**CHANGELOG 엔트리 자동 생성:**
- 커밋 메시지에서 `feat:` → Added, `fix:` → Fixed, `refactor:` → Changed 분류
- 변경 파일 목록에서 주요 변경사항 요약

#### Step 4: 커밋 메시지 생성

Conventional Commits 형식:
```
feat(auth): 로그인 API 엔드포인트 추가
fix(ui): 모바일 레이아웃 깨짐 수정
docs(plan): 기획서 초안 작성
refactor(login): 인증 로직 분리
chore: bump version to v0.x.y
```

**타입 가이드:**
- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `refactor`: 리팩토링
- `style`: 포맷/스타일 변경
- `test`: 테스트 추가/수정
- `chore`: 빌드/설정 변경

스코프(`()` 안)는 피처명 또는 모듈명 사용.

#### Step 5: 확인 및 실행

1. 버전 범프 + 커밋 메시지를 한번에 정리하여 AskUserQuestion:
   - 변경 파일 목록
   - 버전: {현재} → {신규} (또는 "범프 없음")
   - 커밋 메시지 초안
   - 옵션: "커밋 실행", "메시지 수정", "취소"
2. 승인 후 커밋 실행
3. AskUserQuestion: "push도 할까요?" — 옵션: "push", "나중에"
