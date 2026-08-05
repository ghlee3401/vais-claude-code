---
artifact: dockerfile
owner_agent: container-config-author
phase: how
canon_source: "Docker Documentation 'Dockerfile Best Practices' (docs.docker.com/develop/dev-best-practices) + 'Docker in Action' (Nickoloff & Kuenzli, 2019, 2nd ed.) + Distroless / Wolfi minimal base image patterns"
execution:
  policy: scope
  intent: containerization
  prereq: [architecture-design]
  required_after: []
  trigger_events: []
  scope_conditions:
    - field: deployment.target
      operator: IN
      value: [cloud, hybrid, on-prem]
template_depth: filled-sample-with-checklist
review_recommended: false
project_context_reason: "How 단계 — Architecture 결정 후 컨테이너화. multi-stage build + 보안 (non-root + minimal base) + reproducibility (pinned versions)."
---

# Dockerfile

> **canon**: Docker Best Practices (docs.docker.com) — 25+ 권장 패턴. Nickoloff & Kuenzli *Docker in Action* (2019). Distroless (gcr.io/distroless) / Wolfi (chainguard) — minimal base 이미지.
>
> **목적**: reproducible / minimal / secure 컨테이너 이미지 생성. multi-stage build 로 builder 와 runtime 분리.

---

## 1. Base Image 선택

| Option | 크기 | 적정 시점 |
|--------|:---:|----------|
| **alpine** (musl libc) | ~5 MB | 단순 — glibc dependency 없는 경우 |
| **distroless** (gcr.io/distroless) | ~20 MB | shell 부재 + 보안 강화 |
| **wolfi-base** (chainguard) | ~10 MB | SBOM + signed |
| **slim** (debian-slim) | ~80 MB | glibc 필요 — Python / Node native modules |
| **full** (ubuntu) | ~70+ MB | 디버깅 필요 X |

**Selected**: ______ + 이유

## 2. Multi-stage Pattern

```dockerfile
# ── Stage 1: Builder ────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Dependency 먼저 (cache layer 분리)
COPY package*.json ./
RUN npm ci --omit=dev

# Source code 복사
COPY . .
RUN npm run build

# ── Stage 2: Runtime ─────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# non-root user
RUN addgroup -g 10001 app && adduser -D -u 10001 -G app app
USER app

# 빌드 산출물만 복사 (builder 의 build deps 제외)
COPY --from=builder --chown=app:app /app/node_modules ./node_modules
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/package.json ./

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node ./dist/healthcheck.js || exit 1

# Port + Entrypoint
EXPOSE 3000
CMD ["node", "./dist/index.js"]
```

## 3. .dockerignore (필수)

```
node_modules
.git
.env
.env.*
dist
build
*.log
coverage
.vscode
.idea
docker-compose*.yml
Dockerfile*
README.md
.dockerignore
.github
tests
```

## 4. docker-compose.yml (개발 환경)

```yaml
version: '3.9'

services:
  app:
    build:
      context: .
      target: builder  # 개발 시 builder stage (hot reload)
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
      - /app/node_modules
    environment:
      NODE_ENV: development
      DATABASE_URL: postgres://app:secret@db:5432/app
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

## 5. Security Checklist

- [ ] **non-root user** (USER 지시문)
- [ ] **minimal base** (alpine / distroless)
- [ ] **pinned versions** (FROM node:20.10.0-alpine — `latest` X)
- [ ] **secrets X**: ENV / ARG 에 secret 미주입 (image layer 영구 노출)
- [ ] **multi-stage**: build deps 가 runtime image 에 미포함
- [ ] **.dockerignore**: .git / .env / node_modules / build artifacts 제외
- [ ] **HEALTHCHECK** 명시
- [ ] **read-only filesystem** (가능한 경우): `--read-only` flag

---

## (작성된 sample)

### VAIS Code Plugin (Containerized 가정 — 실제는 plugin 형식)

본 프로젝트는 plugin 형식 — Dockerfile 직접 사용 X. 그러나 **유사한 보안 강화 패턴** 을 빌드 스크립트에 적용.

대안: VAIS Code 가 GitHub Actions runner 에서 동작 시 적용 가능한 Dockerfile sample:

```dockerfile
FROM node:20.10.0-alpine AS builder
WORKDIR /vais-build
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm test && npm run lint
RUN node scripts/vais-validate-plugin.js
RUN node scripts/sub-agent-audit.js
RUN node scripts/template-validator.js templates/ --depth-check
RUN node scripts/build-catalog.js

FROM gcr.io/distroless/nodejs20-debian12:nonroot AS runtime
WORKDIR /vais-code
USER nonroot

COPY --from=builder --chown=nonroot:nonroot /vais-build/lib ./lib
COPY --from=builder --chown=nonroot:nonroot /vais-build/scripts ./scripts
COPY --from=builder --chown=nonroot:nonroot /vais-build/agents ./agents
COPY --from=builder --chown=nonroot:nonroot /vais-build/skills ./skills
COPY --from=builder --chown=nonroot:nonroot /vais-build/hooks ./hooks
COPY --from=builder --chown=nonroot:nonroot /vais-build/templates ./templates
COPY --from=builder --chown=nonroot:nonroot /vais-build/catalog.json ./
COPY --from=builder --chown=nonroot:nonroot /vais-build/vais.config.json ./
COPY --from=builder --chown=nonroot:nonroot /vais-build/package.json ./

CMD ["./scripts/vais-validate-plugin.js"]
```

---

## 작성 체크리스트

- [ ] Base Image 선택 + 이유 (크기 / 보안 / 호환성) 명시?
- [ ] **Multi-stage** (builder + runtime) 분리?
- [ ] **non-root user** (USER 지시문) 적용?
- [ ] **pinned versions** (FROM node:20.10.0-alpine) — `latest` X?
- [ ] **secrets 부재**: ENV / ARG 에 secret 미주입?
- [ ] **HEALTHCHECK** 명시?
- [ ] **.dockerignore** 작성?
- [ ] **docker-compose.yml** 으로 개발 환경 단순화?
- [ ] Image 크기 최소화 (alpine / distroless / wolfi)?

---

## ⚠ Anti-pattern (Docker Best Practices 명시)

- **single-stage**: build deps 가 production image — 크기 + 공격 표면 증가.
- **root user**: USER 지시문 없이 root — 컨테이너 탈출 시 host 영향. **non-root** 강제.
- **`latest` tag**: `FROM node:latest` — reproducibility 상실. 항상 명시적 버전.
- **Secrets in Dockerfile**: ENV / ARG 로 secret — image layer 에 영구 노출. **runtime secrets** 사용 (env file / vault).
- **HEALTHCHECK 부재**: 컨테이너 alive 만 모니터링 — 실제 healthy 여부 모름.
- **.dockerignore 부재**: .git / .env / node_modules 가 image 에 포함 — 크기 + 보안.
- **single command per layer**: 모든 명령을 별도 RUN — layer 수 폭증. `&&` 로 합리적 결합.

---

## 변경 이력

| version | date | change |
|---------|------|--------|
| v1.0 | 2026-04-26 | 초기 작성 — Sprint 12. Docker Best Practices + Distroless + Wolfi 정전. Base Image 선택 + Multi-stage + .dockerignore + docker-compose + Security Checklist + sample (VAIS Code containerized 가정) + checklist 9 + anti-pattern 7 |
