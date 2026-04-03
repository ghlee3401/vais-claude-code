import fs from 'fs'
import path from 'path'

// Design Ref: §3-C.1 — AbsorbEvaluator. CEO가 위임하고 CTO가 실행하는 레퍼런스 흡수 평가 엔진
// Plan SC: SC-08 — /vais absorb 실행 시 평가 결과 출력
// Plan SC: SC-09 — .vais/absorption-ledger.jsonl에 모든 흡수 결정 기록

const LEDGER_PATH = '.vais/absorption-ledger.jsonl'
const SKILLS_BASE = 'skills/'
const MAX_RECORD_SIZE = 10000
const PROJECT_ROOT = path.resolve('.')

export class AbsorbEvaluator {
  constructor(
    ledgerPath = LEDGER_PATH,
    skillsBasePath = SKILLS_BASE,
    projectRoot = PROJECT_ROOT
  ) {
    this.ledgerPath = ledgerPath
    this.skillsBasePath = skillsBasePath
    this.projectRoot = path.resolve(projectRoot)
  }

  // Path traversal 방지: 프로젝트 경계 내 경로만 허용
  _assertWithinBoundary(targetPath) {
    const resolved = path.resolve(targetPath)
    if (!resolved.startsWith(this.projectRoot + path.sep) && resolved !== this.projectRoot) {
      throw new Error(`Path outside project boundary: ${targetPath}`)
    }
    return resolved
  }

  // 중복 체크: Ledger에 동일 source 경로 존재?
  checkDuplicate(sourcePath) {
    if (!fs.existsSync(this.ledgerPath)) return false

    const lines = fs.readFileSync(this.ledgerPath, 'utf8')
      .split('\n')
      .filter(Boolean)

    const normalized = path.resolve(sourcePath)
    return lines.some(line => {
      try {
        const entry = JSON.parse(line)
        return path.resolve(entry.source) === normalized
      } catch { return false }
    })
  }

  // 내용 겹침: 기존 skills/ 파일들과 키워드 유사도
  checkOverlap(sourcePath) {
    this._assertWithinBoundary(sourcePath)
    if (!fs.existsSync(sourcePath)) {
      return { overlapping: [], score: 0 }
    }

    const sourceContent = this._readContent(sourcePath).toLowerCase()
    const sourceKeywords = this._extractKeywords(sourceContent)

    if (sourceKeywords.length === 0) {
      return { overlapping: [], score: 0 }
    }

    const overlapping = []
    const skillFiles = this._findSkillFiles()

    for (const skillFile of skillFiles) {
      const skillContent = this._readContent(skillFile).toLowerCase()
      const matchedKeywords = sourceKeywords.filter(kw => skillContent.includes(kw))
      const overlapRatio = matchedKeywords.length / sourceKeywords.length

      if (overlapRatio >= 0.3) {
        overlapping.push(skillFile)
      }
    }

    const score = Math.min(overlapping.length / Math.max(skillFiles.length, 1), 1)
    return { overlapping, score }
  }

  // 품질 평가: 구조화, 문서화, 예시 포함 여부
  assessQuality(sourcePath) {
    this._assertWithinBoundary(sourcePath)
    if (!fs.existsSync(sourcePath)) {
      return { score: 0, reasons: ['파일을 찾을 수 없음'] }
    }

    const content = this._readContent(sourcePath)
    const reasons = []
    let score = 0

    // 헤딩 구조 (0-25)
    const headings = (content.match(/^#{1,3}\s/gm) || []).length
    if (headings >= 3) { score += 25; reasons.push('✅ 헤딩 구조 양호') }
    else if (headings >= 1) { score += 12; reasons.push('⚠️ 헤딩 구조 부족') }
    else { reasons.push('❌ 헤딩 없음') }

    // 코드 예시 (0-25)
    const codeBlocks = Math.floor((content.match(/```/g) || []).length / 2)
    if (codeBlocks >= 2) { score += 25; reasons.push('✅ 코드 예시 충분') }
    else if (codeBlocks >= 1) { score += 12; reasons.push('⚠️ 코드 예시 부족') }
    else { reasons.push('❌ 코드 예시 없음') }

    // 문서 길이 (0-25)
    const wordCount = content.split(/\s+/).length
    if (wordCount >= 200) { score += 25; reasons.push('✅ 충분한 문서 분량') }
    else if (wordCount >= 100) { score += 12; reasons.push('⚠️ 문서 분량 부족') }
    else { reasons.push('❌ 문서 분량 너무 적음') }

    // 실행 가능 지침 (0-25)
    const hasInstructions = /##\s*(사용법|usage|실행|how to|guide)/i.test(content)
    if (hasInstructions) { score += 25; reasons.push('✅ 실행 가능 지침 존재') }
    else { reasons.push('⚠️ 실행 가능 지침 없음') }

    return { score, reasons }
  }

  // vais 적합성: C-Suite 역할/Layer 구조와 연결 가능?
  assessFit(sourcePath) {
    this._assertWithinBoundary(sourcePath)
    if (!fs.existsSync(sourcePath)) {
      return { score: 0, suggestedLayer: null, mcpCandidate: false }
    }

    const content = this._readContent(sourcePath).toLowerCase()
    let score = 0
    let suggestedLayer = null

    // Layer 키워드 매핑
    const layerPatterns = [
      { layer: 'Layer 1 (Plugin)', keywords: ['skill', 'plugin', '스킬', '플러그인', 'trigger'], weight: 20 },
      { layer: 'Layer 3 (C-Suite)', keywords: ['agent', 'role', '에이전트', '역할', 'cto', 'ceo', 'cmo', 'cso'], weight: 30 },
      { layer: 'Layer 4 (State/Event)', keywords: ['state', 'event', 'log', '상태', '이벤트', 'observability'], weight: 20 },
      { layer: 'Layer 5 (MCP)', keywords: ['mcp', 'server', 'tool', 'api', 'endpoint'], weight: 15 },
      { layer: 'Layer 2 (Implementation)', keywords: ['frontend', 'backend', 'design', 'architect', 'qa'], weight: 15 },
    ]

    let maxWeight = 0
    for (const { layer, keywords, weight } of layerPatterns) {
      const matched = keywords.filter(kw => content.includes(kw)).length
      const contribution = (matched / keywords.length) * weight
      score += contribution
      if (contribution > maxWeight) {
        maxWeight = contribution
        suggestedLayer = layer
      }
    }

    const isMcpLayer = suggestedLayer === 'Layer 5 (MCP)'
    let mcpMeta = null

    if (isMcpLayer) {
      mcpMeta = this._assessMcpFit(sourcePath, content)
    }

    return {
      score: Math.round(score),
      suggestedLayer,
      mcpCandidate: isMcpLayer && mcpMeta !== null && mcpMeta.score >= 60,
      mcpMeta,
    }
  }

  // MCP 심화 적합성 평가
  _assessMcpFit(sourcePath, content) {
    let score = 0
    const reasons = []

    // 도구성 (0-30): 실행 가능한 스크립트/CLI/API 존재
    const hasExecutable = /\.(py|sh|js|ts)\b/.test(sourcePath) ||
      /\b(python3?|node|bash|sh|npx|curl)\b/.test(content) ||
      /\b(cli|command|execute|run|script)\b/.test(content)
    const toolScore = hasExecutable ? 30 : (/\b(api|endpoint|request|response)\b/.test(content) ? 15 : 0)
    score += toolScore
    reasons.push(toolScore >= 20 ? '✅ 실행 가능한 도구 존재' : toolScore > 0 ? '⚠️ API 참조만 존재' : '❌ 실행 가능 요소 없음')

    // 래핑 가능성 (0-30): 입력→출력 구조 존재
    const hasIOPattern = /\b(input|output|param|arg|query|result|return)\b/.test(content) ||
      /\b(parameter|argument|response|payload)\b/.test(content)
    const wrapScore = hasIOPattern ? 30 : 0
    score += wrapScore
    reasons.push(wrapScore > 0 ? '✅ 입력→출력 구조 식별' : '❌ I/O 패턴 미식별')

    // 독립성 (0-20): 다른 레이어 의존 없이 독립 동작
    const hasDeps = /\b(require|import)\s/.test(content) &&
      /\b(phases|agents|skills)\b/.test(content)
    const indepScore = hasDeps ? 5 : 20
    score += indepScore
    reasons.push(indepScore >= 15 ? '✅ 독립 동작 가능' : '⚠️ 내부 레이어 의존')

    // 재사용성 (0-20): 복수 단계에서 호출 가능
    const reuseKeywords = ['search', 'analyze', 'generate', 'validate', 'check', 'convert', 'transform']
    const reuseMatches = reuseKeywords.filter(kw => content.includes(kw)).length
    const reuseScore = reuseMatches >= 2 ? 20 : reuseMatches === 1 ? 10 : 0
    score += reuseScore
    reasons.push(reuseScore >= 15 ? '✅ 범용 도구 패턴' : reuseScore > 0 ? '⚠️ 제한적 재사용' : '❌ 단일 용도')

    // 권장 tool 이름 추출
    const suggestedToolName = this._suggestToolName(content)

    // 권장 활성화 단계 추론
    const activationPhases = this._suggestActivationPhases(content)

    // 실행 커맨드 패턴 추출
    const commandPattern = this._extractCommandPattern(sourcePath, content)

    return {
      score,
      reasons,
      suggestedToolName,
      activationPhases,
      commandPattern,
    }
  }

  _suggestToolName(content) {
    const verbs = ['search', 'analyze', 'generate', 'validate', 'check', 'convert', 'transform', 'fetch', 'build', 'lint']
    const nouns = ['code', 'docs', 'design', 'data', 'schema', 'api', 'style', 'config', 'test', 'report']

    const verb = verbs.find(v => content.includes(v)) || 'process'
    const noun = nouns.find(n => content.includes(n)) || 'resource'
    return `${verb}_${noun}`
  }

  _suggestActivationPhases(content) {
    const phaseMap = [
      { phase: 'plan', keywords: ['plan', 'requirement', 'strategy'] },
      { phase: 'design', keywords: ['design', 'style', 'ui', 'ux', 'wireframe', 'color', 'font'] },
      { phase: 'do', keywords: ['implement', 'code', 'build', 'develop', 'generate'] },
      { phase: 'qa', keywords: ['test', 'validate', 'check', 'lint', 'review', 'quality'] },
    ]

    const matched = phaseMap
      .filter(({ keywords }) => keywords.some(kw => content.includes(kw)))
      .map(({ phase }) => phase)

    return matched.length > 0 ? matched : ['do']
  }

  _extractCommandPattern(sourcePath, content) {
    // 파일 확장자 기반 실행 커맨드 추론
    if (sourcePath.endsWith('.py')) return `python3 \${CLAUDE_PLUGIN_ROOT}/${sourcePath}`
    if (sourcePath.endsWith('.js')) return `node \${CLAUDE_PLUGIN_ROOT}/${sourcePath}`
    if (sourcePath.endsWith('.sh')) return `bash \${CLAUDE_PLUGIN_ROOT}/${sourcePath}`
    if (sourcePath.endsWith('.ts')) return `npx tsx \${CLAUDE_PLUGIN_ROOT}/${sourcePath}`

    // 콘텐츠에서 커맨드 패턴 추출 시도
    const cmdMatch = content.match(/(?:python3?|node|bash|npx)\s+[^\s]+/)
    if (cmdMatch) return cmdMatch[0]

    return null
  }

  // 전체 평가 실행
  evaluate(sourcePath) {
    this._assertWithinBoundary(sourcePath)
    const isDuplicate = this.checkDuplicate(sourcePath)
    if (isDuplicate) {
      return {
        action: 'reject',
        reason: `이미 흡수된 레퍼런스입니다. Ledger 참조: ${this.ledgerPath}`,
        overlap: [],
        quality: null,
        fit: null,
      }
    }

    const { overlapping, score: overlapScore } = this.checkOverlap(sourcePath)
    const { score: qualityScore, reasons } = this.assessQuality(sourcePath)
    const fit = this.assessFit(sourcePath)
    const { score: fitScore, suggestedLayer, mcpCandidate } = fit

    // 판정 로직
    let action, reason

    if (qualityScore < 25) {
      action = 'reject'
      reason = `품질 점수 미달 (${qualityScore}/100). 구조화 부족.`
    } else if (overlapScore > 0.5 && overlapping.length > 0) {
      action = 'merge'
      reason = `기존 파일과 높은 겹침 (${overlapping.length}개). 병합 권장: ${overlapping.slice(0, 2).join(', ')}`
    } else if (qualityScore >= 50 && fitScore >= 20) {
      action = mcpCandidate ? 'absorb-mcp' : 'absorb'
      reason = mcpCandidate
        ? `MCP Tool로 흡수 적합. 품질: ${qualityScore}/100, MCP 적합성: ${fit.mcpMeta.score}/100, 권장 tool: ${fit.mcpMeta.suggestedToolName}`
        : `흡수 적합. 품질: ${qualityScore}/100, 적합성: ${fitScore}/100, 권장 레이어: ${suggestedLayer}`
    } else {
      action = 'merge'
      reason = `조건부 흡수. 품질(${qualityScore}) 또는 적합성(${fitScore}) 보완 후 병합.`
    }

    return {
      action,
      reason,
      overlap: overlapping,
      quality: { score: qualityScore, reasons },
      fit: { score: fitScore, suggestedLayer, mcpCandidate, mcpMeta: fit.mcpMeta },
    }
  }

  // Ledger에 결과 기록 (append-only)
  record(result) {
    const dir = path.dirname(this.ledgerPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const entry = JSON.stringify({
      ts: new Date().toISOString(),
      ...result,
    })

    if (entry.length > MAX_RECORD_SIZE) {
      throw new Error(`Record too large (${entry.length} > ${MAX_RECORD_SIZE})`)
    }

    fs.appendFileSync(this.ledgerPath, entry + '\n', 'utf8')
  }

  // Private helpers

  _readContent(filePath) {
    try {
      if (fs.statSync(filePath).isDirectory()) {
        // 디렉토리인 경우 모든 .md 파일 합산
        return fs.readdirSync(filePath)
          .filter(f => f.endsWith('.md') || f.endsWith('.js') || f.endsWith('.ts'))
          .map(f => {
            try { return fs.readFileSync(path.join(filePath, f), 'utf8') } catch { return '' }
          })
          .join('\n')
      }
      return fs.readFileSync(filePath, 'utf8')
    } catch { return '' }
  }

  _extractKeywords(content) {
    // 의미있는 단어 추출 (불용어 제외, 4자 이상)
    const stopWords = new Set(['this', 'that', 'with', 'from', 'have', 'will', 'your', 'they', 'been', 'more'])
    return [...new Set(
      content.match(/\b[a-z가-힣]{4,}\b/g) || []
    )].filter(w => !stopWords.has(w)).slice(0, 50)
  }

  _findSkillFiles() {
    if (!fs.existsSync(this.skillsBasePath)) return []

    const files = []
    const walk = (dir) => {
      try {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const fullPath = path.join(dir, entry.name)
          if (entry.isDirectory()) walk(fullPath)
          else if (entry.name.endsWith('.md')) files.push(fullPath)
        }
      } catch {}
    }
    walk(this.skillsBasePath)
    return files
  }
}
