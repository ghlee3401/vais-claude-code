> 원본: cathrynlavery/diagram-design main@9874ad7 `references/type-er.md` (MIT, 2026-09-17 가져와 수정)

# ER / Data Model — 데이터 모델

**Best for:** conceptual and logical data models, API resource relationships, domain models — anything where the story is *entities and cardinality*. VAIS 7단계(데이터 정의서)의 항목 관계 그림이 이 유형이다.

**Not for the physical schema.** ER is entity-level: relationship lines join *boxes* and carry cardinality at each end. SQL 타입·인덱스·컬럼 단위 FK 까지 그려야 하면 이 스킬 밖이다(표로 적는다).

## Layout conventions
- Each entity is a two-section box:
  - **Header**: type tag (`ENTITY`) + entity name in Geist.
  - **Body**: field list in Geist Mono, one per line. PK prefixed with `#`, FK prefixed with `→`.
- Relationships: lines between entities with cardinality at each end:
  - `1`, `N`, `0..1`, `1..*` in Geist Mono, 8px, placed 10–12px from the entity edge.
  - Optional relationship label ("has", "belongs to") centered on the line.
- Group related entities close; lay out so most relationships are straight lines, not tangles.
- Coral on the aggregate root or central entity of the model.

## Anti-patterns
- Drawing an arrow for every FK on a model with dozens — lay out by cluster instead.
- Inconsistent cardinality notation between ends of the same relationship.
- Fields padded to equal-height boxes — natural height by content is fine.

## Examples
- `assets/example-er.html` — minimal light
