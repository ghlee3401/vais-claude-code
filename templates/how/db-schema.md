---
artifact: db-schema
owner_agent: db-architect
phase: how
canon_source: "Martin Kleppmann 'Designing Data-Intensive Applications' (2017), O'Reilly + C.J. Date 'An Introduction to Database Systems' (2003, 8th ed.) + Bill Karwin 'SQL Antipatterns' (2010), Pragmatic Bookshelf"
execution:
  policy: scope
  intent: db-schema-design
  prereq: [architecture-design]
  required_after: [migration-plan]
  trigger_events: []
  scope_conditions:
    - field: persistent_storage_required
      operator: ==
      value: true
template_depth: filled-sample-with-checklist
review_recommended: true
project_context_reason: "How 단계 — Architecture 결정 후 데이터 모델링. Normalization / Index 전략 / Concurrency 결정. review_recommended=true: schema 변경 비용 후행 100x."
---

# Database Schema Design

> **canon**: Kleppmann *DDIA* (2017) Ch.2~5 — Storage / Replication / Partitioning. Date *Introduction to Database Systems* (2003) — Codd Normal Form. Karwin *SQL Antipatterns* (2010) — 25 가지 흔한 함정.
>
> **목적**: 데이터 모델 (entity + relation + 제약) 명시 → migration 의 입력 + ORM/SQL 코드 표준.

---

## 1. DB Engine 선택

| Option | 강점 | 적정 시점 |
|--------|------|----------|
| **PostgreSQL** | ACID + JSON + window functions | 대부분 (default) |
| **MySQL** | 광범위 호스팅 / replica 단순 | 단순 OLTP |
| **MongoDB** | schema-less / horizontal scale | 변동 많은 데이터 / event log |
| **Redis** | in-memory / pub-sub | cache / rate limit / queue |
| **DuckDB / SQLite** | 단일 노드 / OLAP | edge / embedded |

**Selected**: ______ + 이유

## 2. Entity-Relationship (ER)

```
┌────────────┐  N : M  ┌────────────┐
│   Users    │────────│   Roles    │
│ (id, ...)  │        │ (id, ...)  │
└────────────┘        └────────────┘
       │ 1
       │ M
┌────────────┐
│   Posts    │
│ (id, ...)  │
└────────────┘
```

(Mermaid ER / dbdiagram.io 링크)

## 3. Tables (DDL Spec)

### users

| Column | Type | Constraint | Index |
|--------|------|-----------|:-----:|
| id | UUID | PRIMARY KEY | (PK) |
| email | VARCHAR(255) | UNIQUE NOT NULL | UNIQUE |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | (no) |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | (no) |
| deleted_at | TIMESTAMPTZ | NULL | (partial — WHERE deleted_at IS NULL) |

### posts

| Column | Type | Constraint | Index |
|--------|------|-----------|:-----:|
| id | UUID | PRIMARY KEY | (PK) |
| user_id | UUID | NOT NULL REFERENCES users(id) ON DELETE CASCADE | (FK) |
| status | TEXT | NOT NULL CHECK (status IN ('draft','published')) | (no) |
| published_at | TIMESTAMPTZ | NULL | (partial — WHERE status='published') |

## 4. Normalization 전략

| 단계 | 정의 | 본 schema 적용 |
|:---:|------|---------------|
| 1NF | atomic columns (no array/JSON 남용) | ✅ |
| 2NF | non-key 가 partial key 의존 X | ✅ |
| 3NF | non-key 가 다른 non-key 의존 X | ✅ |
| BCNF | 모든 non-trivial FD 가 superkey | ✅ |

**의도된 denormalization**: ______ (성능·집계 위해 — 명시적 trade-off)

## 5. Index 전략

| Index | 목적 | Cardinality |
|-------|------|:----------:|
| `users(email)` UNIQUE | login 검색 | High |
| `posts(user_id, status)` composite | 사용자별 게시글 list | Med |
| `posts(published_at) WHERE status='published'` partial | published 만 lookup | Low (partial) |

**Anti-pattern 회피**: 모든 column 에 index X (write 비용 폭증).

## 6. Concurrency + Consistency

| 메커니즘 | 적용 |
|---------|------|
| **Optimistic Locking** | `version` column + UPDATE WHERE version=N |
| **Pessimistic Locking** | SELECT FOR UPDATE — 정말 필요한 곳만 |
| **Transaction Isolation** | 기본 READ COMMITTED / 필요 시 SERIALIZABLE |
| **Soft Delete** | `deleted_at` (audit / undo) — index 영향 |

---

## (작성된 sample)

**Project**: VAIS Code Plugin (DB N/A — 로컬 파일 시스템 사용)

본 프로젝트는 RDB 사용 X. 그러나 **유사한 데이터 모델** (catalog.json + .vais/status.json + .vais/profile.yaml + docs/ filesystem) 사용. SQL 표 대신 파일 schema 정의.

### 1. "Engine" 선택

**Selected**: 로컬 파일 시스템 (JSON / YAML / Markdown)
**이유**: 1 인 plugin / git-tracked / 트랜잭션 부재 OK / 검색 = grep + glob

### 2. "Entity-Relationship"

```mermaid
graph LR
  Profile[.vais/profile.yaml]
  Catalog[catalog.json]
  Status[.vais/status.json]
  Docs[docs/{feature}/]
  
  Profile --> CLevel[6 C-Level]
  Catalog --> SubAgent[44 sub-agent]
  Status --> Docs
  Docs --> Tmp[_tmp/ scratchpad]
```

### 3. "Tables"

#### catalog.json (artifact list)

| Field | Type | Constraint |
|-------|------|-----------|
| version | string | "1.0" |
| generated_at | ISO timestamp | required |
| total_artifacts | int | ≥ 0 |
| artifacts[].id | string | unique |
| artifacts[].owner_agent | string | (cross-ref to agents/) |
| artifacts[].canon_source | string | required |
| artifacts[].execution.policy | enum | always/scope/user-select/triggered |

#### .vais/profile.yaml (12 변수)

| Field | Type |
|-------|------|
| type | enum (oss/b2b-saas/b2c/internal-tool/...) |
| target_market | string |
| deployment.target | enum (local-only/cloud/hybrid/on-prem) |
| users.target_scale | enum (solo/team/pilot/100/1k-100k/100k+) |
| sla_required | bool |
| ... (12 변수 총) | ... |

### 4. Concurrency

- **catalog.json**: build-catalog.js 가 atomicWriteSync 사용 (`lib/fs-utils.js`)
- **.vais/status.json**: lib/status.js 가 lock + retry pattern
- **profile.yaml**: 사용자 편집 우선 — hook 은 미존재 시만 생성

---

## 작성 체크리스트

- [ ] DB Engine 선택 + 이유 명시?
- [ ] ER Diagram **시각화** (Mermaid / dbdiagram.io / draw.io 링크) 포함?
- [ ] 각 Table 의 **Column / Type / Constraint / Index** 명시?
- [ ] Primary Key / Foreign Key + ON DELETE 동작 명시?
- [ ] Normalization 단계 (1NF~BCNF) 검증 + **의도된 denormalization** 명시?
- [ ] Index 전략 — composite / partial / covering 사용 적정?
- [ ] **Concurrency** 메커니즘 (Optimistic / Pessimistic / Soft Delete) 명시?
- [ ] **Anti-pattern 회피** — 모든 column 에 index X / EAV / Naive Tree 등 (Karwin 25 항목 검토)?

---

## ⚠ Anti-pattern (Karwin SQL Antipatterns 25 항목 중 핵심)

- **EAV (Entity-Attribute-Value)**: schema flexibility 명목으로 (entity_id, attr_name, value) 테이블 — 쿼리 복잡 + 성능 폭망. JSON column 으로 대체.
- **Naive Tree** (parent_id 만): 깊은 트리 lookup 시 N 쿼리. **Closure Table** or **Materialized Path** 사용.
- **Polymorphic Association**: 하나의 FK column 이 여러 테이블 참조 — 정합성 부재. 분리 테이블 / supertype 사용.
- **모든 column 에 index**: write 성능 폭망 + 디스크 낭비. **자주 WHERE 되는 column 만**.
- **NULL 의 의미 다중**: NULL 이 "없음" / "미설정" / "삭제됨" 동시 — 의미 모호. **명시적 enum** 또는 NOT NULL 강제.
- **Implicit Default Order**: ORDER BY 없이 결과 순서 가정 — DB engine 변경 시 깨짐. 명시적 ORDER BY.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 12. Kleppmann DDIA + Date + Karwin SQL Antipatterns 정전. Engine 선택 + ER + DDL spec + Normalization + Index + Concurrency + sample (VAIS — 파일 시스템 schema 유추) + checklist 8 + anti-pattern 6 |
