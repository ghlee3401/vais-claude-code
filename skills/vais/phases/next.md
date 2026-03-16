### 다음 단계 안내

1. `.vais/status.json`에서 활성 피처의 `currentPhase`를 읽습니다
2. `vais.config.json`의 `workflow.phases` 배열에서 다음 단계를 결정합니다
3. 현재 단계 상태에 따라 안내:
   - **in-progress**: 현재 단계가 아직 진행 중 → `"📍 현재 진행중: /vais {현재단계} {피처명}"`
   - **completed**: 다음 단계로 이동 가능 → `"💡 다음 단계: /vais {다음단계} {피처명}"`
   - 마지막 단계(`review`) 완료 시 → `"🎉 모든 단계 완료! /vais status로 최종 확인하세요."`
4. 활성 피처가 없으면 → `"/vais auto {기능명} 또는 /vais plan {기능명}으로 시작하세요."`
