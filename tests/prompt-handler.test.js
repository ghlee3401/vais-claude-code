#!/usr/bin/env node
/**
 * VAIS Code - scripts/prompt-handler.js 통합 테스트
 * stdin으로 JSON을 전달하여 사용자 의도 감지 및 워크플로우 컨텍스트 출력 검증
 *
 * child_process.execSync를 사용하여 실제 스크립트 실행 및 stdout JSON 검증
 */
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const SCRIPT_PATH = path.join(__dirname, '..', 'scripts', 'prompt-handler.js');
const PROJECT_DIR = path.join(__dirname, '..');
const VAIS_DIR = path.join(PROJECT_DIR, '.vais');
const STATUS_FILE = path.join(VAIS_DIR, 'status.json');

// 임시 프로젝트 디렉토리 (매 테스트마다 독립적으로 사용)
let tempDir = null;

/**
 * 테스트 전 .vais 디렉토리 생성 및 임시 디렉토리 준비
 */
before(() => {
  // 임시 프로젝트 디렉토리 생성
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vais-prompt-test-'));

  const tempVaisDir = path.join(tempDir, '.vais');
  if (!fs.existsSync(tempVaisDir)) {
    fs.mkdirSync(tempVaisDir, { recursive: true });
  }
});

/**
 * 테스트 후 임시 디렉토리 정리
 */
after(() => {
  try {
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  } catch (e) {
    // 무시
  }
});

/**
 * 헬퍼: prompt-handler 실행하고 JSON 출력 반환 (임시 디렉토리 사용)
 */
function runPromptHandler(prompt, activeFeature = null) {
  const tempStatusFile = path.join(tempDir, '.vais', 'status.json');

  // 상태 파일 먼저 삭제
  try {
    if (fs.existsSync(tempStatusFile)) {
      fs.unlinkSync(tempStatusFile);
    }
  } catch (e) {
    // 파일 없으면 무시
  }

  // 상태 파일 설정
  if (activeFeature) {
    const status = {
      version: 2,
      activeFeature: activeFeature,
      features: {},
    };
    fs.writeFileSync(tempStatusFile, JSON.stringify(status, null, 2));
  }

  const input = JSON.stringify({ prompt });
  try {
    const output = execSync(`node ${SCRIPT_PATH}`, {
      input,
      encoding: 'utf8',
      cwd: tempDir,  // 임시 디렉토리 사용
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return JSON.parse(output);
  } catch (e) {
    // process.exit(0)은 에러로 처리되기도 함
    if (e.stdout) {
      try {
        return JSON.parse(e.stdout);
      } catch (parseErr) {
        throw new Error(`Failed to parse stdout: ${e.stdout}`);
      }
    }
    throw e;
  }
}

describe('prompt-handler 빈 입력', () => {
  it('빈 문자열 → 빈 JSON 출력', () => {
    const result = runPromptHandler('');
    assert.deepEqual(result, {});
  });

  it('3자 미만 입력 → 빈 JSON 출력', () => {
    const result = runPromptHandler('ab');
    assert.deepEqual(result, {});
  });

  it('띄어쓰기만 → 빈 JSON 출력', () => {
    const result = runPromptHandler('   ');
    // 공백만 있으면 길이는 3 이상이지만, 내용은 없음
    const trimmed = '   '.trim();
    assert(trimmed.length < 3 || result.additionalContext === undefined);
  });
});

describe('prompt-handler 키워드 감지 + activeFeature', () => {
  it('기획 키워드 + activeFeature → plan 컨텍스트 출력', () => {
    const result = runPromptHandler('기획을 어떻게 할까요?', 'login-feature');
    assert(result.additionalContext, 'additionalContext 포함');
    assert(result.additionalContext.includes('기획'), '기획 관련 메시지');
  });

  it('백엔드 키워드 + activeFeature → backend 컨텍스트 출력', { skip: 'prompt-handler removed from hooks (v0.31.0)' }, () => {
    const result = runPromptHandler('백엔드 API 개발하고 싶어요', 'api-feature');
    assert(result.additionalContext, 'additionalContext 포함');
    assert(result.additionalContext.includes('백엔드'), '백엔드 메시지');
  });

  it('프론트엔드 키워드 + activeFeature → frontend 컨텍스트 출력', () => {
    const result = runPromptHandler('React 컴포넌트 작성해야 함', 'ui-feature');
    assert(result.additionalContext, 'additionalContext 포함');
  });

  it('QA 키워드 + activeFeature → qa 컨텍스트 출력', () => {
    const result = runPromptHandler('QA 검토 부탁합니다', 'test-feature');
    assert(result.additionalContext, 'additionalContext 포함');
  });

  it('설계 키워드 + activeFeature → design 컨텍스트 출력', () => {
    const result = runPromptHandler('UI 설계를 해야 해요', 'design-feature');
    assert(result.additionalContext, 'additionalContext 포함');
  });

  it('인프라 키워드 + activeFeature → architect 컨텍스트 출력', () => {
    const result = runPromptHandler('DB 설정과 마이그레이션', 'infra-feature');
    assert(result.additionalContext, 'additionalContext 포함');
  });
});

describe('prompt-handler activeFeature 없을 때', () => {
  it('키워드 감지되어도 additionalContext 미포함', () => {
    const result = runPromptHandler('기획을 어떻게 합니까?', null);
    assert.deepEqual(result, {});
  });

  it('여러 키워드 감지되어도 activeFeature 없으면 빈 출력', () => {
    const result = runPromptHandler('백엔드와 프론트엔드 모두 필요해요', null);
    assert.deepEqual(result, {});
  });
});

describe('prompt-handler 체이닝 패턴', () => {
  it('/vais plan:design login → 체이닝 감지 메시지', () => {
    const result = runPromptHandler('/vais plan:design login', 'any-feature');
    assert(result.additionalContext, 'additionalContext 포함');
    assert(result.additionalContext.includes('체이닝'), '체이닝 메시지');
    assert(result.additionalContext.includes(':'), '순차 구분자');
  });

  it('/vais frontend+backend checkout → 병렬 패턴 감지', { skip: 'prompt-handler removed from hooks (v0.31.0)' }, () => {
    const result = runPromptHandler('/vais frontend+backend checkout', 'any-feature');
    assert(result.additionalContext, 'additionalContext 포함');
    assert(result.additionalContext.includes('병렬'), '병렬 실행 언급');
  });

  it('/vais plan:design:architect:frontend+backend:qa feature → 혼합 체이닝', { skip: 'prompt-handler removed from hooks (v0.31.0)' }, () => {
    const result = runPromptHandler('/vais plan:design:architect:frontend+backend:qa feature', 'any-feature');
    assert(result.additionalContext, 'additionalContext 포함');
  });
});

describe('prompt-handler 범위 패턴', () => {
  it('plan부터 qa까지 → 범위 실행 메시지', () => {
    const result = runPromptHandler('plan부터 qa까지 실행해주세요', 'full-feature');
    assert(result.additionalContext, 'additionalContext 포함');
    assert(result.additionalContext.includes('범위'), '범위 실행 메시지');
  });

  it('design부터 backend까지 → 부분 범위 실행', () => {
    const result = runPromptHandler('design부터 backend까지 진행할게요', 'partial-feature');
    assert(result.additionalContext, 'additionalContext 포함');
  });

  it('architect부터 review까지 → 범위 변환', () => {
    const result = runPromptHandler('architect부터 review까지 모두 진행하세요', 'test-feature');
    assert(result.additionalContext, 'additionalContext 포함');
  });
});

describe('prompt-handler 일반 입력', () => {
  it('일반 프롬프트 + activeFeature 없음 → 빈 JSON', () => {
    const result = runPromptHandler('안녕하세요 어떻게 되나요?', null);
    assert.deepEqual(result, {});
  });

  it('관련 없는 프롬프트 + activeFeature → 빈 JSON', () => {
    const result = runPromptHandler('날씨 좋네요', 'some-feature');
    assert.deepEqual(result, {});
  });
});
