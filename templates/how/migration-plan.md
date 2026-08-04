---
artifact: migration-plan
owner_agent: migration-planner
phase: how
canon_source: "Pramod Sadalage & Scott Ambler 'Refactoring Databases' (2006), Addison-Wesley + Flyway / Liquibase migration best practices + Martin Fowler 'Evolutionary Database Design' (2006)"
execution:
  policy: triggered
  intent: schema-migration
  prereq: [db-schema]
  required_after: [rollback-script]
  trigger_events: ["db-schema-change", "migration-requested"]
  scope_conditions: []
template_depth: filled-sample-with-checklist
review_recommended: true
project_context_reason: "How 단계 — DB schema 변경 시 절차 + 위험 평가 + 롤백 스크립트. review_recommended=true: data loss 위험."
---

# Database Migration Plan

> **canon**: Sadalage & Ambler *Refactoring Databases* (2006) — DB refactoring 표준 (rename / move / replace 등 12+ 패턴). Fowler *Evolutionary Database Design* (2006) — incremental migration. Flyway / Liquibase tooling.
>
> **핵심 원칙**: 모든 migration 은 **forward + reverse 양방향 작성**. data loss 위험 사전 평가 + 백업 + dry-run.

---

## 1. Migration Type

| 분류 | 위험도 | 예시 |
|------|:----:|------|
| **Additive** | Low | ADD COLUMN (NULL 허용) / CREATE INDEX / CREATE TABLE |
| **Backwards-compatible Change** | Med | RENAME COLUMN (alias 유지) / ENUM 추가 |
| **Destructive** | **High** | DROP COLUMN / DROP TABLE / TRUNCATE / ALTER TYPE |
| **Long-running** | High | NOT NULL 추가 (백필 필요) / large index build |

## 2. 3-Phase Pattern (Sadalage)

> 큰 변경은 1 deploy 로 X. **3 deploy** 분해.

### Phase 1: Add (additive)
- 새 column / table 추가 (NULL 허용)
- 코드는 **양방향 read** (old + new) / **dual write**

### Phase 2: Migrate (data backfill)
- 기존 데이터 → 새 column 백필
- 별도 batch job (small chunks + idle window)

### Phase 3: Remove (destructive — 안전 확인 후)
- 코드가 new 만 read 확인
- old column / table drop
- (가능하면) **N 개 release 이후** 만 drop

## 3. Forward Migration Script

```sql
-- migrations/20260501_add_user_phone.sql
BEGIN;

ALTER TABLE users
  ADD COLUMN phone VARCHAR(20) NULL;

-- 백필 (별도 batch — 본 migration 에 포함 X)

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone
  ON users(phone) WHERE phone IS NOT NULL;

COMMIT;
```

## 4. Reverse (Rollback) Script

```sql
-- migrations/20260501_add_user_phone.down.sql
BEGIN;

DROP INDEX CONCURRENTLY IF EXISTS idx_users_phone;

ALTER TABLE users
  DROP COLUMN IF EXISTS phone;

COMMIT;
```

## 5. Risk Assessment

| Risk | Severity | Mitigation |
|------|:----:|------------|
| **Data Loss** | Critical | 사전 백업 + dry-run on staging |
| **Lock 장기화** | High | CREATE INDEX CONCURRENTLY / chunk batch |
| **Application 호환성** | Med | 3-Phase pattern + dual write |
| **Rollback 시간** | Low | reverse script 작성 + 검증 |

## 6. Pre-deploy Checklist

- [ ] **백업 완료** (timestamp 명시)
- [ ] Staging 에서 **dry-run** (실제 데이터 복제본)
- [ ] **Forward + Reverse** 모두 staging 에서 검증
- [ ] Application 코드가 **dual read/write** 지원? (Phase 1 의 경우)
- [ ] **Long-running** 인 경우 idle window (트래픽 적은 시간) 예약?
- [ ] **Monitoring** 준비 (lock duration / slow query / error rate)
- [ ] **Communication**: on-call + stakeholder 사전 공지

---

## (작성된 sample)

### Migration: catalog.json → catalog.json + index files (Sprint 14 가정)

본 프로젝트는 RDB X. 파일 시스템 기반 — 그러나 schema 변경 동일한 패턴 적용.

### 1. Migration Type

**Type**: Additive (catalog.json 형식 유지 + 새 인덱스 파일 추가)
**Phase**: Single deploy (위험 Low)

### 2. Forward

```javascript
// scripts/migrate-catalog-v2.js
// catalog.json v1.0 → v1.1 (by_phase / by_policy / by_intent 인덱스 분리)

const c = require('./catalog.json');
const v2 = {
  ...c,
  version: '1.1',
  // by_phase / by_policy / by_intent 는 이미 인라인
  // 신규: by_owner_agent 추가
  by_owner_agent: {}
};

for (const a of v2.artifacts) {
  if (!v2.by_owner_agent[a.owner_agent]) v2.by_owner_agent[a.owner_agent] = [];
  v2.by_owner_agent[a.owner_agent].push(a.id);
}

require('fs').writeFileSync('catalog.json', JSON.stringify(v2, null, 2));
```

### 3. Reverse

```javascript
// scripts/migrate-catalog-v2.down.js
const c = require('./catalog.json');
delete c.by_owner_agent;
c.version = '1.0';
require('fs').writeFileSync('catalog.json', JSON.stringify(c, null, 2));
```

### 4. Risk Assessment

| Risk | Severity | Mitigation |
|------|:----:|------------|
| catalog.json 손상 | Med | git backup + atomicWriteSync |
| 후행 도구 호환성 | Low | by_owner_agent 는 신규 — 기존 도구 영향 X |

### 5. Pre-deploy Checklist

- [x] git backup (auto via commit)
- [x] dry-run: 별도 디렉토리에서 migrate 실행
- [x] Reverse 검증: rollback 후 v1.0 동일 hash 확인
- [x] 후행 도구 (sub-agent-audit / build-catalog) 영향 평가
- [x] 모니터링: build-catalog.js 재빌드 시 동일 결과

---

## 작성 체크리스트

- [ ] Migration Type (Additive / BC Change / Destructive / Long-running) 분류 + 위험도 명시?
- [ ] **3-Phase pattern** 적용 검토? (Destructive / Long-running 의 경우 필수)
- [ ] **Forward + Reverse** script 모두 작성?
- [ ] **Risk Assessment** 표로 Severity + Mitigation 명시?
- [ ] Pre-deploy Checklist (백업 / dry-run / staging 검증 / dual-write / monitoring) 모두 통과?
- [ ] **CONCURRENTLY** (PostgreSQL) 또는 online schema change (MySQL pt-osc / gh-ost) 사용?
- [ ] **rollback 시간** 추정 명시?
- [ ] **post-deploy 검증** 절차 (smoke test / data integrity check) 정의?

---

## ⚠ Anti-pattern (Sadalage + Fowler 명시)

- **NOT NULL + 백필 동시**: 큰 테이블에 ALTER ADD COLUMN NOT NULL DEFAULT 'x' — long lock + downtime. **3 단계** (NULL 허용 → 백필 → NOT NULL) 분리.
- **rollback 부재**: forward 만 작성 — 장애 시 수동 SQL 강제. **양방향 강제**.
- **production 직접 실행**: dry-run / staging 없이 prod — 복구 비용 100x.
- **migration 파일 수정**: 이미 prod 적용된 migration 수정 — 환경별 schema 불일치. **immutable** + 새 migration.
- **ORM auto-migrate prod**: `prisma migrate dev` / `db push` 를 prod — 의도하지 않은 destructive.
- **single-deploy big change**: 100M row + ALTER 단일 deploy — lock + 다운타임. 3-Phase 강제.
- **테이블 크기 무시**: <1k row 와 >100M row 같은 절차 — 후자는 idle window + chunked batch 필수.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 12. Sadalage & Ambler + Fowler + Flyway 정전. Migration Type 4 + 3-Phase Pattern + Forward/Reverse + Risk + Checklist + sample (VAIS catalog.json v1.0→v1.1) + checklist 8 + anti-pattern 7 |
