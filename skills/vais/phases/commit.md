### 커밋 생성

1. `git status`로 변경 파일 목록 확인
2. `git diff --staged`로 스테이징된 변경사항 확인. 스테이징된 파일이 없으면 `git add`로 관련 파일 스테이징
3. Conventional Commits 형식으로 메시지 생성:
   ```
   feat(auth): 로그인 API 엔드포인트 추가
   fix(ui): 모바일 레이아웃 깨짐 수정
   docs(plan): 기획서 초안 작성
   refactor(login): 인증 로직 분리
   ```
4. **타입 가이드**:
   - `feat`: 새 기능
   - `fix`: 버그 수정
   - `docs`: 문서 변경
   - `refactor`: 리팩토링
   - `style`: 포맷/스타일 변경
   - `test`: 테스트 추가/수정
   - `chore`: 빌드/설정 변경
5. 스코프(`()` 안)는 피처명 또는 모듈명 사용
6. AskUserQuestion으로 커밋 메시지 확인 후 커밋 실행
