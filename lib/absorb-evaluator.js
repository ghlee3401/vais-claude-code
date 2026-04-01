import fs from 'fs'
import path from 'path'

// Design Ref: §3-C.1 — AbsorbEvaluator. CEO가 위임하고 CTO가 실행하는 레퍼런스 흡수 평가 엔진
// Plan SC: SC-08 — /vais absorb 실행 시 평가 결과 출력
// Plan SC: SC-09 — .vais/absorption-ledger.jsonl에 모든 흡수 결정 기록

const LEDGER_PATH = '.vais/absorption-ledger.jsonl'
const SKILLS_BASE = 'skills/'

export class AbsorbEvaluator {
  constructor(
    ledgerPath = LEDGER_PATH,
    skillsBasePath = SKILLS_BASE
  ) {
    this.ledgerPath = ledgerPath
    this.skillsBasePath = skillsBasePath
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
    const codeBlocks = (content.match(/```/g) || []).length / 2
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
    if (!fs.existsSync(sourcePath)) {
      return { score: 0, suggestedLayer: null }
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

    return { score: Math.round(score), suggestedLayer }
  }

  // 전체 평가 실행
  evaluate(sourcePath) {
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
    const { score: fitScore, suggestedLayer } = this.assessFit(sourcePath)

    // 판정 로직
    let action, reason

    if (qualityScore < 25) {
      action = 'reject'
      reason = `품질 점수 미달 (${qualityScore}/100). 구조화 부족.`
    } else if (overlapScore > 0.5 && overlapping.length > 0) {
      action = 'merge'
      reason = `기존 파일과 높은 겹침 (${overlapping.length}개). 병합 권장: ${overlapping.slice(0, 2).join(', ')}`
    } else if (qualityScore >= 50 && fitScore >= 20) {
      action = 'absorb'
      reason = `흡수 적합. 품질: ${qualityScore}/100, 적합성: ${fitScore}/100, 권장 레이어: ${suggestedLayer}`
    } else {
      action = 'merge'
      reason = `조건부 흡수. 품질(${qualityScore}) 또는 적합성(${fitScore}) 보완 후 병합.`
    }

    return {
      action,
      reason,
      overlap: overlapping,
      quality: { score: qualityScore, reasons },
      fit: { score: fitScore, suggestedLayer },
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
